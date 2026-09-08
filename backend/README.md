# Striker EVM — backend

FastAPI + SQLAlchemy 2 + PostgreSQL backend of Striker EVM. This package contains:

- `app/domain/evm` — pure EVM calculator (no framework, 100 % covered).
- `app/domain/auth` — user roles (`REGISTRAR`, `REVIEWER`) and the authorization policy
  (`policy.py`: who manages projects, lists users and modifies or owns activities).
- `app/application` — framework-free errors, ports (repositories, password hasher, token
  service), mappers and the auth use cases (login, current user, list users).
- `app/infrastructure/db` — SQLAlchemy models, repositories, session and health probe.
- `app/infrastructure/security` — bcrypt password hasher and PyJWT token service.
- `app/api` — FastAPI routers, uniform error handlers, dependencies and the security
  dependencies (`CurrentUser`, `ReviewerUser`, `require_role`).
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
| `JWT_SECRET` | `change-me-in-production-at-least-32-bytes` | HS256 signing key, at least 32 bytes. **Must be overridden outside the local environment.** |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm. |
| `JWT_EXPIRES_MINUTES` | `480` | Token lifetime (8 h); reported as `expiresIn` (seconds) on login. |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor used when hashing passwords (tests lower it to 4). |

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

## Authentication and roles

Every endpoint except `GET /health` and `POST /auth/login` requires `Authorization: Bearer
<JWT>`. Tokens are HS256, valid for 8 hours, and carry the claims `sub` (user id), `role`,
`iat` and `exp`. A missing, malformed or expired token answers `401 UNAUTHORIZED`; a valid
token whose role is not allowed answers `403 FORBIDDEN` (permission matrix in
`docs/ARQUITECTURA.md §11`). Only `REVIEWER` users can call `GET /users`.

```bash
# 1. Log in (public) and keep the token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \n  -H 'Content-Type: application/json' \n  -d '{"email":"revisor@striker.local","password":"Striker2026!"}' | jq -r .accessToken)

# 2. Call protected endpoints with it
curl -s http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8000/api/v1/users   -H "Authorization: Bearer $TOKEN"
```

The login response is `{"accessToken", "tokenType": "bearer", "expiresIn": 28800, "user"}`.
Wrong email or password both answer `401` with the same message, so the API does not reveal
which emails exist. In Swagger UI use **Authorize** and paste the token (scheme `bearerAuth`).

Routers of later modules protect endpoints with the dependencies of `app/api/security.py`:
`CurrentUser` (any authenticated user) and `ReviewerUser` (REVIEWER only), or
`require_role(...)` for other combinations. Activity ownership rules live in
`app/domain/auth/policy.py` (`can_modify_activity`, `resolve_activity_owner`).

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
`tests/conftest.py` provides a seeded `client` plus `auth_headers(email)`, `reviewer_headers`
and `registrar_headers` fixtures for authenticated requests (seed users and the fast-bcrypt test
settings live in `tests/seed.py`).

## Lint and format

```bash
ruff check .
ruff format --check .
```

Use `ruff format .` to apply formatting.
