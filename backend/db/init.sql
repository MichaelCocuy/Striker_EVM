-- Striker EVM - database initialization script.
--
-- Purpose: this is the "database initialization script" required by the challenge. Docker
-- Compose mounts it into /docker-entrypoint-initdb.d/ so PostgreSQL runs it once, when the data
-- volume is created. It creates the schema, registers the matching Alembic revision and loads the
-- seed users plus the example project of docs/EVM_GUIA.md section 6.
--
-- Schema evolution is owned by Alembic (backend/alembic/versions). This script mirrors the
-- initial migration (0001_initial_schema) and stamps alembic_version accordingly, so running
-- `alembic upgrade head` afterwards only applies migrations newer than this baseline.
--
-- Every statement is idempotent: the script can be re-run against an existing database.

BEGIN;

CREATE TABLE IF NOT EXISTS app_user (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    full_name     VARCHAR(200) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_app_user_email      UNIQUE (email),
    CONSTRAINT ck_app_user_role_allowed CHECK (role IN ('REGISTRAR', 'REVIEWER'))
);

CREATE TABLE IF NOT EXISTS project (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    created_by  UUID         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_project_created_by_app_user FOREIGN KEY (created_by) REFERENCES app_user (id)
);

CREATE TABLE IF NOT EXISTS activity (
    id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id               UUID          NOT NULL,
    owner_id                 UUID          NOT NULL,
    name                     VARCHAR(200)  NOT NULL,
    budget_at_completion     NUMERIC(14,2) NOT NULL,
    planned_progress_percent NUMERIC(5,2)  NOT NULL,
    actual_progress_percent  NUMERIC(5,2)  NOT NULL,
    actual_cost              NUMERIC(14,2) NOT NULL,
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_activity_project_id_project
        FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE,
    CONSTRAINT fk_activity_owner_id_app_user
        FOREIGN KEY (owner_id) REFERENCES app_user (id),
    CONSTRAINT ck_activity_budget_positive          CHECK (budget_at_completion > 0),
    CONSTRAINT ck_activity_actual_cost_non_negative CHECK (actual_cost >= 0),
    CONSTRAINT ck_activity_planned_percent_range
        CHECK (planned_progress_percent BETWEEN 0 AND 100),
    CONSTRAINT ck_activity_actual_percent_range
        CHECK (actual_progress_percent BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS ix_activity_project_id ON activity (project_id);
CREATE INDEX IF NOT EXISTS ix_activity_owner_id   ON activity (owner_id);

-- Alembic baseline: this schema equals revision 0001_initial_schema.
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO alembic_version (version_num)
SELECT '0001_initial_schema'
WHERE NOT EXISTS (SELECT 1 FROM alembic_version);

-- Seed users (ARQUITECTURA.md section 11). Local-only password for all three: Striker2026!
INSERT INTO app_user (id, email, full_name, role, password_hash) VALUES
    ('11111111-1111-4111-8111-000000000001', 'revisor@striker.local', 'Laura Revisora',
     'REVIEWER', '$2b$12$5loH57GfuyXzSEqzokPf8uju1E8NRx/X1svsXTbeMEK35RTEI983S'),
    ('11111111-1111-4111-8111-000000000002', 'registrador@striker.local', 'Carlos Registrador',
     'REGISTRAR', '$2b$12$PqqU.WNx8l6JOnNT14xKpeRzdE2VySHXUz.bJknTaKoy9MfPXLFge'),
    ('11111111-1111-4111-8111-000000000003', 'registrador2@striker.local', 'Ana Registradora',
     'REGISTRAR', '$2b$12$NMog5vEVn/1SjFqHpiW3p.E1uutaMGd3d6BFZ689mp1ecYk9mrqZa')
ON CONFLICT (id) DO NOTHING;

-- Example project of EVM_GUIA.md section 6, created by the reviewer.
INSERT INTO project (id, name, description, created_by) VALUES
    ('22222222-2222-4222-8222-000000000001', 'Portal de clientes',
     'Proyecto de ejemplo de la guía EVM: tres actividades con avance y costo registrados.',
     '11111111-1111-4111-8111-000000000001')
ON CONFLICT (id) DO NOTHING;

-- created_at is staggered so listings (ordered by creation) follow the guide: 1, 2, 3.
INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000000000001', '22222222-2222-4222-8222-000000000001',
     '11111111-1111-4111-8111-000000000002', 'Diseño',     10000.00, 100.00, 100.00,  9000.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000000000002', '22222222-2222-4222-8222-000000000001',
     '11111111-1111-4111-8111-000000000003', 'Desarrollo', 40000.00,  50.00,  40.00, 20000.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000000000003', '22222222-2222-4222-8222-000000000001',
     '11111111-1111-4111-8111-000000000002', 'Pruebas',    10000.00,  20.00,  30.00,  2500.00,
     now() - INTERVAL '1 second',  now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

COMMIT;
