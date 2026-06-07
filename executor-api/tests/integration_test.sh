#!/usr/bin/env bash
# integration_test.sh — End-to-end tests against a running executor-api.
#
# Usage:
#   ./tests/integration_test.sh [BASE_URL]
#   BASE_URL defaults to http://localhost:8000
#
# Requires: curl, jq

set -euo pipefail

BASE="${1:-http://localhost:8000}"
PASS=0
FAIL=0

ok()   { echo "  ✓ $1"; ((PASS++)); }
fail() { echo "  ✗ $1"; ((FAIL++)); }

echo ""
echo "══════════════════════════════════════════════"
echo "  Executor API Integration Tests"
echo "  Target: $BASE"
echo "══════════════════════════════════════════════"

# ── 1. Health ──────────────────────────────────────────────────────────────
echo ""
echo "1. Health endpoint"
STATUS=$(curl -sf "$BASE/health" | jq -r '.status')
[[ "$STATUS" == "ok" ]] && ok "GET /health returns {status: ok}" || fail "GET /health"

# ── 2. Datasets list ───────────────────────────────────────────────────────
echo ""
echo "2. Dataset list"
COUNT=$(curl -sf "$BASE/datasets" | jq 'length')
[[ "$COUNT" -eq 3 ]] && ok "GET /datasets returns 3 datasets" || fail "Expected 3 datasets, got $COUNT"

# ── 3. Valid SQL ───────────────────────────────────────────────────────────
echo ""
echo "3. Valid SQL execution (SSE stream)"
SQL_RESP=$(curl -sf -X POST "$BASE/execute-sql/stream" \
  -H "Content-Type: application/json" \
  -d '{"dataset_id":"ventas-retail","sql":"SELECT order_id, status FROM orders LIMIT 5"}' \
  --no-buffer 2>&1 | tr '\n' '|')

echo "$SQL_RESP" | grep -q '"completed"' \
  && ok "SQL stream contains completed event" \
  || fail "SQL stream missing completed event (response: ${SQL_RESP:0:300})"

# ── 4. Invalid SQL (DDL) ───────────────────────────────────────────────────
echo ""
echo "4. Invalid SQL rejected at API level"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/execute-sql/stream" \
  -H "Content-Type: application/json" \
  -d '{"dataset_id":"ventas-retail","sql":"DROP TABLE customers"}')
[[ "$HTTP_CODE" == "422" || "$HTTP_CODE" == "400" ]] \
  && ok "DROP TABLE returns $HTTP_CODE" \
  || fail "Expected 400/422 for DROP TABLE, got $HTTP_CODE"

# ── 5. Valid Python ────────────────────────────────────────────────────────
echo ""
echo "5. Valid Python execution"
PY_CODE='result = dfs["orders"].groupby("status")["total_amount"].sum().to_dict()'
PY_RESP=$(curl -sf -X POST "$BASE/execute-python/stream" \
  -H "Content-Type: application/json" \
  -d "{\"dataset_id\":\"ventas-retail\",\"code\":\"$PY_CODE\"}" \
  --no-buffer 2>&1 | tr '\n' '|')

echo "$PY_RESP" | grep -q '"completed"\|"python_result"' \
  && ok "Python stream contains completed event" \
  || fail "Python stream missing completed event (response: ${PY_RESP:0:300})"

# ── 6. Invalid Python (os import) ─────────────────────────────────────────
echo ""
echo "6. Blocked Python import rejected"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/execute-python/stream" \
  -H "Content-Type: application/json" \
  -d '{"dataset_id":"ventas-retail","code":"import os; result = os.getcwd()"}')
[[ "$HTTP_CODE" == "422" || "$HTTP_CODE" == "400" ]] \
  && ok "import os returns $HTTP_CODE" \
  || fail "Expected 400/422 for import os, got $HTTP_CODE"

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════"
echo ""

[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
