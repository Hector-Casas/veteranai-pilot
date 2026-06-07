"""
generate_metricas_saas.py
Genera metricas_saas.db con datos sintéticos de una empresa SaaS.

Tablas:
  users         (~5 000 filas)
  subscriptions (~5 000 filas)
  events        (~100 000 filas)
  mrr_history   (~24 filas, snapshot mensual)
"""

import json
import os
import random
import sqlite3
from datetime import date, datetime, timedelta

import numpy as np
from faker import Faker


def parse_date_flexible(value):
    """Parsea fechas tolerantemente desde SQLite o strings."""
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        for fmt in (
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
        ):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            raise ValueError(f"No se pudo parsear fecha: {value!r}")
    raise TypeError(f"Tipo no soportado para fecha: {type(value).__name__}")

# ── Reproducibilidad ────────────────────────────────────────────────────────
random.seed(42)
np.random.seed(42)
fake = Faker(["es_MX", "en_US"])
Faker.seed(42)

# ── Destino ─────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "analyst-service", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)
DB_PATH = os.path.join(OUTPUT_DIR, "metricas_saas.db")

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# ════════════════════════════════════════════════════════════════════════════
# DDL
# ════════════════════════════════════════════════════════════════════════════
cur.executescript("""
CREATE TABLE users (
    user_id              INTEGER PRIMARY KEY,
    email                TEXT NOT NULL UNIQUE,
    signup_date          DATE NOT NULL,
    country              TEXT NOT NULL,
    acquisition_channel  TEXT NOT NULL,
    industry             TEXT NOT NULL
);

CREATE TABLE subscriptions (
    subscription_id INTEGER PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id),
    plan            TEXT NOT NULL,
    mrr             REAL NOT NULL,
    started_at      DATE NOT NULL,
    cancelled_at    DATE,
    status          TEXT NOT NULL
);

CREATE TABLE events (
    event_id    INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(user_id),
    event_type  TEXT NOT NULL,
    created_at  DATETIME NOT NULL,
    metadata    TEXT
);

CREATE TABLE mrr_history (
    month         DATE PRIMARY KEY,
    total_mrr     REAL NOT NULL,
    new_mrr       REAL NOT NULL,
    churned_mrr   REAL NOT NULL,
    expansion_mrr REAL NOT NULL
);
""")


# ════════════════════════════════════════════════════════════════════════════
# USERS (~5 000)
# ════════════════════════════════════════════════════════════════════════════
CHANNELS    = ["organic", "paid_search", "referral", "social", "direct"]
CH_WEIGHTS  = [0.30, 0.25, 0.20, 0.15, 0.10]
INDUSTRIES  = ["SaaS", "E-commerce", "Fintech", "Healthcare", "EdTech",
               "Logistics", "Marketing", "Legal", "Real Estate", "Manufacturing"]
COUNTRIES   = (["Mexico"] * 35 + ["USA"] * 30 + ["Colombia"] * 10 +
               ["España"] * 8 + ["Argentina"] * 7 + ["Chile"] * 5 +
               ["Brazil"] * 3 + ["Peru"] * 2)

users = []
for uid in range(1, 5001):
    email   = fake.unique.email()
    signup  = fake.date_between(start_date=date(2023, 1, 1), end_date=date(2025, 6, 1))
    country = random.choice(COUNTRIES)
    channel = random.choices(CHANNELS, weights=CH_WEIGHTS)[0]
    industry = random.choice(INDUSTRIES)
    users.append((uid, email, str(signup), country, channel, industry))

cur.executemany("INSERT INTO users VALUES (?,?,?,?,?,?)", users)
print(f"  users: {len(users)} filas")


# ════════════════════════════════════════════════════════════════════════════
# SUBSCRIPTIONS (~5 000)
# ════════════════════════════════════════════════════════════════════════════
PLANS = {
    "free":       (0,   0.40),
    "starter":    (29,  0.35),
    "pro":        (99,  0.20),
    "enterprise": (499, 0.05),
}
PLAN_NAMES = list(PLANS.keys())
PLAN_WEIGHTS = [v[1] for v in PLANS.values()]

# Tasa de churn: ~25% global (más alta en free/starter, baja en enterprise)
CHURN_PROB = {"free": 0.40, "starter": 0.30, "pro": 0.15, "enterprise": 0.05}

CUTOFF_DATE = date(2026, 5, 1)

subscriptions = []
# users tuple: (uid, email, signup_str, country, channel, industry)
# Use explicit names to avoid off-by-one errors if columns are reordered.
for sid, (uid, _email, signup_str, _country, _channel, _industry) in enumerate(users, start=1):
    signup_date = parse_date_flexible(signup_str)
    plan  = random.choices(PLAN_NAMES, weights=PLAN_WEIGHTS)[0]
    mrr   = PLANS[plan][0]
    start = signup_date + timedelta(days=random.randint(0, 3))

    churned = random.random() < CHURN_PROB[plan]
    if churned:
        tenure_days = random.randint(30, 500)
        cancel = start + timedelta(days=tenure_days)
        cancel = min(cancel, CUTOFF_DATE)
        cancelled_at = str(cancel) if cancel < CUTOFF_DATE else None
        status = "cancelled" if cancelled_at else "active"
    else:
        cancelled_at = None
        status = "active"

    subscriptions.append((sid, uid, plan, mrr, str(start), cancelled_at, status))

cur.executemany("INSERT INTO subscriptions VALUES (?,?,?,?,?,?,?)", subscriptions)
print(f"  subscriptions: {len(subscriptions)} filas")


# ════════════════════════════════════════════════════════════════════════════
# EVENTS (~100 000)
# ════════════════════════════════════════════════════════════════════════════
EVENT_TYPES = ["login", "feature_used", "export", "api_call", "invite_sent"]

# Usuarios con más plan → más eventos
PLAN_EVENT_RATE = {"free": 3, "starter": 15, "pro": 40, "enterprise": 80}

FEATURE_NAMES = ["dashboard", "reports", "analytics", "export_csv", "api_v2",
                 "team_management", "integrations", "billing", "notifications"]

events = []
event_id = 1

sub_by_uid = {s[1]: s for s in subscriptions}  # uid → subscription tuple

for uid, email, signup_str, *_ in users:
    plan = sub_by_uid[uid][2]
    avg_events = PLAN_EVENT_RATE[plan]
    n_events = max(0, int(np.random.poisson(avg_events)))

    signup = parse_date_flexible(signup_str)
    start_dt = datetime(signup.year, signup.month, signup.day)
    end_dt   = datetime(2026, 4, 30)
    span_days = (end_dt - start_dt).days
    if span_days <= 0:
        continue

    for _ in range(n_events):
        ev_type = random.choice(EVENT_TYPES)
        days_offset = random.randint(0, span_days)
        hour = random.randint(7, 22)
        dt = start_dt + timedelta(days=days_offset, hours=hour,
                                  minutes=random.randint(0, 59))

        if ev_type == "feature_used":
            meta = json.dumps({"feature": random.choice(FEATURE_NAMES)})
        elif ev_type == "api_call":
            meta = json.dumps({"endpoint": f"/api/v2/{random.choice(FEATURE_NAMES)}",
                               "status": random.choice([200, 200, 200, 400, 500])})
        else:
            meta = None

        events.append((event_id, uid, ev_type, dt.strftime("%Y-%m-%d %H:%M:%S"), meta))
        event_id += 1

cur.executemany("INSERT INTO events VALUES (?,?,?,?,?)", events)
print(f"  events: {len(events)} filas")


# ════════════════════════════════════════════════════════════════════════════
# MRR_HISTORY (24 meses)
# ════════════════════════════════════════════════════════════════════════════
BASE_MRR   = 8_500.0   # MRR inicial (hace 24 meses)
GROWTH     = 0.12      # ~12% MoM con ruido

mrr_history = []
current_mrr = BASE_MRR
start_month = date(2024, 5, 1)

for i in range(24):
    month = date(start_month.year + (start_month.month + i - 1) // 12,
                 (start_month.month + i - 1) % 12 + 1, 1)
    noise      = random.uniform(-0.03, 0.03)
    new_mrr    = round(current_mrr * (GROWTH + noise) * random.uniform(0.8, 1.2), 2)
    churned    = round(current_mrr * random.uniform(0.02, 0.06), 2)
    expansion  = round(current_mrr * random.uniform(0.01, 0.04), 2)
    current_mrr = round(current_mrr + new_mrr - churned + expansion, 2)
    mrr_history.append((str(month), current_mrr, new_mrr, churned, expansion))

cur.executemany("INSERT INTO mrr_history VALUES (?,?,?,?,?)", mrr_history)
print(f"  mrr_history: {len(mrr_history)} filas")


# ════════════════════════════════════════════════════════════════════════════
# Índices
# ════════════════════════════════════════════════════════════════════════════
cur.executescript("""
    CREATE INDEX idx_events_user_date ON events(user_id, created_at);
    CREATE INDEX idx_sub_user         ON subscriptions(user_id);
    CREATE INDEX idx_sub_status       ON subscriptions(status);
""")

conn.commit()
conn.close()
print(f"\n✓ metricas_saas.db generado en: {os.path.abspath(DB_PATH)}")
