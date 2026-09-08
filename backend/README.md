# Striker EVM — backend

FastAPI + SQLAlchemy 2 + PostgreSQL backend of Striker EVM. This package contains:

- `app/domain/evm` — pure EVM calculator (no framework, 100 % covered).
- `app/domain/auth` — user roles (`REGISTRAR`, `REVIEWER`).
- `app/application` — framework-free errors, repository ports (Protocols) and mappers.
- `app/infrastructure/db` — SQLAlchemy models, repositories, session and health probe.
- `app/api` — FastAPI routers, uniform error handlers and dependencies.
- `alembic/` — schema migrations; `db/init.sql` — database initialization script.

Layers depend inwards only: API → application → domain; infrastructure sits behind the ports.

## Requirements

- Python 3.12 or newer (tested locally on 3.14; the Docker image uses 3.12).
- Docker with Compose v2 (for PostgreSQL and the containerized stack).

## Run everything with Docker Compose

From the repository root:

```bash
docker compose up -d --build
```

This starts PostgreSQL 16 (initialized once with `backend/db/init.sql`: schema, seed users and the
example project of `docs/EVM_GUIA.md §6`) and the API on <http://localhost:8000>.

- Swagger UI: <http://localhost:8000/api-docs>
- OpenAPI document: <http://localhost:8000/api-docs/openapi.json>
- Health: `curl http://localhost:8000/api/v1/health` → `{"status":"ok","database":"ok"}`

Stop and wipe the database with `docker compose down -v`.

## Run locally with uvicorn

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows (Git Bash); on Linux/macOS: source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e .[dev]
cp .env.example .env            # adjust if needed
docker compose -f ../docker-compose.yml up -d db   # PostgreSQL only
uvicorn app.main:app --reload
```

The API listens on <http://127.0.0.1:8000>; docs at `/api-docs`.

## Environment variables

Read from the environment or from `backend/.env` (see `.env.example`); every one has a
development default.

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | Environment name. |
| `DATABASE_URL` | `postgresql+psycopg://striker:striker@localhost:5432/striker` | SQLAlchemy URL (psycopg 3 driver). |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed browser origins. |
| `JWT_SECRET` | `change-me-in-production` | Signing key for access tokens (auth module). |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm. |
| `JWT_EXPIRES_MINUTES` | `480` | Token lifetime (8 h). |

Compose also accepts `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` and
`BACKEND_PORT` from a root `.env`.

## Database initialization and migrations

- `db/init.sql` is the initialization script mounted into PostgreSQL by Docker Compose. It is
  idempotent and creates the schema, stamps the Alembic baseline and loads the seed data.
- Alembic owns schema evolution. With `DATABASE_URL` pointing to the target database:

  ```bash
  alembic upgrade head            # apply pending migrations (no-op right after init.sql)
  alembic check                   # verify models and schema match
  alembic revision --autogenerate -m "Describe the change"
  ```

## Seed credentials (local environment only)

All seed users share the password `Striker2026!`.

| Email | Role | Name |
|---|---|---|
| `revisor@striker.local` | REVIEWER | Laura Revisora |
| `registrador@striker.local` | REGISTRAR | Carlos Registrador |
| `registrador2@striker.local` | REGISTRAR | Ana Registradora |

The seed project "Portal de clientes" has the three activities of the EVM guide (Diseño,
Desarrollo, Pruebas).

## Error contract

Every 4xx/5xx response has the shape `{"code", "message", "details"}` with codes
`VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),
`HTTP_ERROR` (other framework-level statuses, e.g. 405) and `INTERNAL_ERROR` (500).

## Run the tests with coverage

```bash
pytest --cov
```

Coverage is measured over `app/` and the run fails below 80 % (see `pyproject.toml`). Repository
and API tests run against SQLite in-memory through SQLAlchemy, so no PostgreSQL is needed.

## Lint and format

```bash
ruff check .
ruff format --check .
```

Use `ruff format .` to apply formatting.
