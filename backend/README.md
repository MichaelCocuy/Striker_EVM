# Striker EVM — backend

FastAPI + SQLAlchemy 2 + PostgreSQL backend of Striker EVM. This package contains:

- `app/domain/evm` — pure EVM calculator (no framework, 100 % covered).
- `app/domain/auth` — user roles (`REGISTRAR`, `REVIEWER`) and the authorization policy
  (`policy.py`: who manages projects, lists users and modifies or owns activities).
- `app/application` — framework-free errors, ports (repositories, password hasher, token
  service), mappers, the auth use cases (login, current user, list users), the project and
  activity use cases (`projects/`, `activities/`) and the EVM report use case
  (`evm/get_project_report.py`).
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

## Projects and activities

CRUD of the two resources; every endpoint needs a bearer token and answers the uniform error
shape below.

| Method and path | Who | What it does |
|---|---|---|
| `GET /projects` | both roles | Projects, newest first, each with its `activityCount`. |
| `POST /projects` | REVIEWER | Creates a project; the caller becomes `createdBy`. |
| `GET /projects/{projectId}` | both roles | One project with its activity count. |
| `PUT /projects/{projectId}` | REVIEWER | Replaces name and description. |
| `DELETE /projects/{projectId}` | REVIEWER | Deletes the project and, in cascade, its activities. |
| `GET /projects/{projectId}/activities` | both roles | Raw measures of its activities, oldest first. |
| `POST /projects/{projectId}/activities` | both roles | Creates an activity (see the owner rules). |
| `PUT /projects/{projectId}/activities/{activityId}` | owner or REVIEWER | Replaces the activity. |
| `DELETE /projects/{projectId}/activities/{activityId}` | owner or REVIEWER | Deletes the activity. |

Owner rules (`docs/ARQUITECTURA.md` §11): a `REGISTRAR` owns the activities they create, so
`ownerId` is optional and, if sent, must be their own id (`403` otherwise); a `REVIEWER` must
send an `ownerId` of an existing user (`400` when it is missing or unknown) and may reassign it
when editing. A `REGISTRAR` editing or deleting an activity of somebody else gets `403`, and an
activity reached through a project it does not belong to answers `404`.

`budgetAtCompletion` must be greater than 0, `actualCost` 0 or greater and both percents between
0 and 100, with at most two decimals; breaking any of these answers `400 VALIDATION_ERROR` with
the offending field in `details`. Amounts and percents are JSON numbers rounded to two decimals
(a JSON number has no scale, so `10000.00` travels as `10000.0`).

Create a project and an activity in it with the seed users:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"revisor@striker.local","password":"Striker2026!"}' | jq -r .accessToken)

# 1. A REVIEWER creates the project and keeps its id
PROJECT_ID=$(curl -s -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Portal de clientes","description":"Portal de autogestión"}' | jq -r .id)

# 2. The same REVIEWER adds an activity, naming its owner (Carlos Registrador)
curl -s -X POST "http://localhost:8000/api/v1/projects/$PROJECT_ID/activities" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Desarrollo","ownerId":"11111111-1111-4111-8111-000000000002",
       "budgetAtCompletion":40000.00,"plannedProgressPercent":50.00,
       "actualProgressPercent":40.00,"actualCost":20000.00}' | jq .

# 3. Its owner (a REGISTRAR) registers progress on it; ownerId may be omitted
REG_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"registrador@striker.local","password":"Striker2026!"}' | jq -r .accessToken)

curl -s "http://localhost:8000/api/v1/projects/$PROJECT_ID/activities" \
  -H "Authorization: Bearer $REG_TOKEN" | jq '.[].name'
```

A `REGISTRAR` calling step 1 answers `403 FORBIDDEN`, which is what the frontend relies on to
hide the project management actions.

## EVM report

`GET /projects/{projectId}/evm` is the only source of indicators: it returns, in one call, the
EVM indicators of every activity of the project plus the consolidated total, each with its cost
and schedule interpretation. Both roles may call it. Indicators are never stored — they are
computed on read by `app/domain/evm` from the raw inputs (BAC, planned %, actual %, actual cost),
so the report always reflects the current data.

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"revisor@striker.local","password":"Striker2026!"}' | jq -r .accessToken)

curl -s http://localhost:8000/api/v1/projects/22222222-2222-4222-8222-000000000001/evm \
  -H "Authorization: Bearer $TOKEN" | jq .project.indicators
```

Money carries 2 decimals and the performance indices 4, both as JSON numbers; an indicator that
cannot be computed (a division by zero) is `null`, its status is `NOT_APPLICABLE` and `notes`
explains why. A project without activities answers `200` with `activities: []` and a consolidated
block in zero / `null` / `NOT_APPLICABLE` — never `404`. An unknown project answers `404`.

The numbers can be checked by hand: the seed project "Portal de clientes" is the worked example
of [`docs/EVM_GUIA.md` §6](../docs/EVM_GUIA.md), so the response above must match its §6.6 table
(BAC 60 000.00, PV 32 000.00, EV 29 000.00, AC 31 500.00, CPI 0.9206, SPI 0.9063, EAC 65 172.41,
VAC −5 172.41) and each activity its §6.5 row. The same expected response is committed as
`docs/api/fixtures/evm-report.json`, which the unit and integration tests compare against field
by field.

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
settings live in `tests/seed.py`). `tests/contract_fixtures.py` loads the shared response fixtures
of `docs/api/fixtures` with exact decimals, so tests assert against the published contract.

## Lint and format

```bash
ruff check .
ruff format --check .
```

Use `ruff format .` to apply formatting.
