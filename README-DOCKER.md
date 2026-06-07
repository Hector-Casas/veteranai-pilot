# Docker — Veteran AI Demo Stack

## Architecture

```
┌─────────────────────────────────────────┐
│               Docker Host               │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │   Next.js    │  │  executor-api   │  │
│  │  :3000       │  │  FastAPI :8000  │  │
│  └──────────────┘  └────────┬────────┘  │
│                             │ docker.sock│
│              ┌──────────────▼──────┐    │
│              │ python-sandbox      │    │
│              │ (ephemeral, per req)│    │
│              │ --network=none      │    │
│              │ --read-only         │    │
│              └─────────────────────┘    │
└─────────────────────────────────────────┘
```

executor-api communicates with the Docker daemon via the socket to launch
ephemeral `python-sandbox` containers per analysis request.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine ≥ 24 (Linux)
- Docker Compose V2 (`docker compose`, not `docker-compose`)
- Python 3.10+ (only to run the data-generation scripts once)
- Datasets already generated: `analyst-service/data/*.db` must exist

## Step 0 — Generate the datasets (once)

```powershell
cd data-prep
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python generate_ventas_retail.py
python generate_metricas_saas.py
python generate_recursos_humanos.py
cd ..
```

## Step 1 — Build the sandbox image

This image is NOT a compose service; executor-api launches containers from it at runtime.

```powershell
docker build -t python-sandbox:latest ./python-sandbox
```

## Step 2 — Configure environment

```powershell
# Copy and edit the executor-api env file
Copy-Item executor-api\.env.example executor-api\.env

# Copy and edit the Next.js env file (MISTRAL_API_KEY etc.)
# .env.local already exists from previous setup
```

## Step 3 — Build the compose services

```powershell
docker compose build
```

## Step 4 — Start the stack

```powershell
# Full stack (Next.js + executor-api):
docker compose up

# Only executor-api (when running Next.js natively with npm run dev):
docker compose -f docker-compose.yml -f docker-compose.dev.yml up executor-api
```

## Step 5 — Verify

```powershell
# Health check
Invoke-RestMethod http://localhost:8000/health

# List datasets
Invoke-RestMethod http://localhost:8000/datasets

# Quick SQL test
$body = @{ dataset_id = "ventas-retail"; sql = "SELECT * FROM customers LIMIT 3" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8000/execute-sql/stream `
  -ContentType "application/json" -Body $body
```

## Step 6 — Run unit tests

```powershell
cd executor-api
pip install -r requirements.txt pytest
pytest tests/ -v
```

## Step 7 — Run integration tests (requires running stack)

```powershell
# From WSL or Git Bash:
bash executor-api/tests/integration_test.sh http://localhost:8000
```

## Step 8 — Stop everything

```powershell
docker compose down
# To also remove the sandbox-work volume:
docker compose down -v
```

## Useful commands

```powershell
# Follow logs of executor-api
docker compose logs -f executor-api

# Follow logs of Next.js
docker compose logs -f nextjs

# Shell into executor-api container
docker compose exec executor-api bash

# List running sandbox containers
docker ps --filter "ancestor=python-sandbox:latest"

# Manually test the sandbox image
docker run --rm --network=none --read-only `
  -e EXEC_TYPE=sql -e DATASET_PATH=/data/dataset.db `
  -e CODE_FILE=/work/query.sql -e OUTPUT_FILE=/work/output.json `
  -v "${PWD}/analyst-service/data/ventas_retail.db:/data/dataset.db:ro" `
  -v "${env:TEMP}\va-test:/work" `
  python-sandbox:latest
```

## Windows Docker Desktop notes

- The Docker socket is at `//./pipe/docker_engine` on Windows but
  the `docker-py` library handles this automatically.
- The `sandbox-work` named volume lives inside WSL2; executor-api can
  inspect `vol.attrs["Mountpoint"]` to get the path Docker uses for
  mounting into sandbox containers.
- If `docker compose up` fails on volumes, run:
  `docker volume create veteran-ai-sandbox-work` manually first.

## Production (Proxmox / Linux)

1. Copy repo to server
2. Install Docker Engine (not Desktop)
3. Run steps 0–4 above (same commands, Bash instead of PowerShell)
4. Restrict `executor-api` port: remove `ports: - "8000:8000"` and
   proxy through Nginx or Caddy
5. Set `ALLOWED_ORIGINS` to your actual domain in `executor-api/.env`
