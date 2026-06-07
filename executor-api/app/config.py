from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Sandbox image & limits ──────────────────────────────────────────
    sandbox_image: str = "python-sandbox:latest"
    sandbox_timeout_seconds: int = 15
    sandbox_memory_limit: str = "512m"
    sandbox_cpu_limit: float = 1.0
    sandbox_pids_limit: int = 50

    # ── Volume / path coordination ──────────────────────────────────────
    # Named Docker volume shared between executor-api and sandbox containers.
    # executor-api writes code/reads output under sandbox_work_dir;
    # sandbox containers get the same subdir bind-mounted as /work.
    sandbox_work_volume: str = "veteran-ai-sandbox-work"
    # Fallback when running outside Docker (e.g., local dev without compose)
    host_work_dir: str = "/tmp/veteran-ai-work"
    # Path where executor-api accesses the work volume (inside its container)
    sandbox_work_dir: str = "/sandbox-work"
    # Fallback dataset host path (used when container self-inspection fails)
    datasets_host_dir: str = "/data"

    # ── Known datasets (container-side paths in executor-api) ──────────
    datasets: dict[str, str] = Field(
        default={
            "ventas-retail":     "/data/ventas_retail.db",
            "metricas-saas":     "/data/metricas_saas.db",
            "recursos-humanos":  "/data/recursos_humanos.db",
        }
    )

    # ── CORS ────────────────────────────────────────────────────────────
    allowed_origins: list[str] = ["http://localhost:3000"]

    # ── Logging ─────────────────────────────────────────────────────────
    log_level: str = "INFO"

    model_config = {"env_file": ".env"}


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
