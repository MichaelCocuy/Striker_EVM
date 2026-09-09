-- Striker EVM - database initialization script.
--
-- Purpose: this is the "database initialization script" required by the challenge. Docker
-- Compose mounts it into /docker-entrypoint-initdb.d/ so PostgreSQL runs it once, when the data
-- volume is created. It creates the schema, registers the matching Alembic revision and loads the
-- seed users plus a demo dataset of eight projects, each one showing a different EVM
-- situation (see the comments above the inserts).
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

-- ---------------------------------------------------------------------------------------
-- Demo dataset: one project per EVM situation, so a reviewer who launches the app sees
-- every behaviour of the calculation without having to type data in.
--
-- Projects are listed newest first by the API, so created_at descends here: the guide's
-- example appears first and the empty project last. Inside a project, activities are
-- listed oldest first, so their created_at ascends in insertion order.
--
-- The consolidated values in the comments were computed with the same rules as the domain
-- (Decimal, ROUND_HALF_UP, money to 2 decimals and indices to 4) and are what
-- GET /api/v1/projects/{id}/evm must return. They are meant to be checked by hand.
-- ---------------------------------------------------------------------------------------

-- 1. Portal de clientes: over budget and behind schedule; the numbers of EVM_GUIA.md section 6
--    BAC 60000.00 | PV 32000.00 | EV 29000.00 | AC 31500.00
--    CV -2500.00 | SV -3000.00 | CPI 0.9206 | SPI 0.9063 | EAC 65172.41 | VAC -5172.41
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000001', 'Portal de clientes',
     'Caso resuelto paso a paso en docs/EVM_GUIA.md sección 6: gasta más de lo que avanza. Es el proyecto contra el que se verifican los cálculos.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000000000001', '22222222-2222-4222-8222-000000000001',
     '11111111-1111-4111-8111-000000000002', 'Diseño', 10000.00, 100.00, 100.00, 9000.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000000000002', '22222222-2222-4222-8222-000000000001',
     '11111111-1111-4111-8111-000000000003', 'Desarrollo', 40000.00, 50.00, 40.00, 20000.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000000000003', '22222222-2222-4222-8222-000000000001',
     '11111111-1111-4111-8111-000000000002', 'Pruebas', 10000.00, 20.00, 30.00, 2500.00,
     now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

-- 2. Migración a la nube: under budget and ahead of schedule (CPI > 1, SPI > 1)
--    BAC 40000.00 | PV 23000.00 | EV 25600.00 | AC 22000.00
--    CV 3600.00 | SV 2600.00 | CPI 1.1636 | SPI 1.1130 | EAC 34375.00 | VAC 5625.00
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000002', 'Migración a la nube',
     'Proyecto sano: rinde más trabajo por peso gastado y va por delante del cronograma. Los dos semáforos en verde.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000002000001', '22222222-2222-4222-8222-000000000002',
     '11111111-1111-4111-8111-000000000002', 'Inventario de servidores', 8000.00, 100.00, 100.00, 7000.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000002000002', '22222222-2222-4222-8222-000000000002',
     '11111111-1111-4111-8111-000000000003', 'Migración de datos', 20000.00, 60.00, 70.00, 12000.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000002000003', '22222222-2222-4222-8222-000000000002',
     '11111111-1111-4111-8111-000000000002', 'Pruebas de carga', 12000.00, 25.00, 30.00, 3000.00,
     now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

-- 3. Integración de pagos: ahead but expensive (CPI < 1, SPI > 1); it will end well above the BAC
--    BAC 50000.00 | PV 17500.00 | EV 22750.00 | AC 29500.00
--    CV -6750.00 | SV 5250.00 | CPI 0.7712 | SPI 1.3000 | EAC 64835.16 | VAC -14835.16
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000003', 'Integración de pagos',
     'Va por delante del plan, pero cada avance cuesta más de lo presupuestado. Avanzar rápido no significa avanzar bien.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000003000001', '22222222-2222-4222-8222-000000000003',
     '11111111-1111-4111-8111-000000000003', 'Pasarela de pagos', 30000.00, 40.00, 55.00, 20000.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000003000002', '22222222-2222-4222-8222-000000000003',
     '11111111-1111-4111-8111-000000000002', 'Conciliación automática', 15000.00, 30.00, 35.00, 7000.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000003000003', '22222222-2222-4222-8222-000000000003',
     '11111111-1111-4111-8111-000000000003', 'Certificación PCI', 5000.00, 20.00, 20.00, 2500.00,
     now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

-- 4. Rediseño del intranet: cheap but late (CPI > 1, SPI < 1); the case that looking at spend alone hides
--    BAC 30000.00 | PV 17000.00 | EV 12500.00 | AC 10300.00
--    CV 2200.00 | SV -4500.00 | CPI 1.2136 | SPI 0.7353 | EAC 24720.00 | VAC 5280.00
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000004', 'Rediseño del intranet',
     'Gasta poco, pero también produce poco: el ahorro viene de no haber hecho el trabajo. Mirar solo el gasto haría pensar que va bien.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '4 seconds', now() - INTERVAL '4 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000004000001', '22222222-2222-4222-8222-000000000004',
     '11111111-1111-4111-8111-000000000002', 'Investigación de usuarios', 6000.00, 100.00, 80.00, 4000.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000004000002', '22222222-2222-4222-8222-000000000004',
     '11111111-1111-4111-8111-000000000003', 'Maquetación', 14000.00, 50.00, 30.00, 3500.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000004000003', '22222222-2222-4222-8222-000000000004',
     '11111111-1111-4111-8111-000000000002', 'Migración de contenido', 10000.00, 40.00, 35.00, 2800.00,
     now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

-- 5. Cumplimiento normativo: exactly on target (CPI = 1, SPI = 1, CV = SV = VAC = 0)
--    BAC 40000.00 | PV 23000.00 | EV 23000.00 | AC 23000.00
--    CV 0.00 | SV 0.00 | CPI 1.0000 | SPI 1.0000 | EAC 40000.00 | VAC 0.00
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000005', 'Cumplimiento normativo',
     'Cada actividad gastó exactamente lo que vale lo producido y avanzó exactamente lo planeado. El único caso donde los índices valen 1.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '5 seconds', now() - INTERVAL '5 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000005000001', '22222222-2222-4222-8222-000000000005',
     '11111111-1111-4111-8111-000000000003', 'Diagnóstico de brechas', 10000.00, 100.00, 100.00, 10000.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000005000002', '22222222-2222-4222-8222-000000000005',
     '11111111-1111-4111-8111-000000000002', 'Políticas y procedimientos', 20000.00, 50.00, 50.00, 10000.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000005000003', '22222222-2222-4222-8222-000000000005',
     '11111111-1111-4111-8111-000000000003', 'Capacitación', 10000.00, 30.00, 30.00, 3000.00,
     now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

-- 6. App móvil de campo: edge cases: CPI not computable (AC = 0), activity not started, spend with no progress (CPI = 0, EAC not computable) and activity not scheduled yet (SPI not computable); its consolidated CPI shows how a high CPI can mislead
--    BAC 43000.00 | PV 8400.00 | EV 2900.00 | AC 1600.00
--    CV 1300.00 | SV -5500.00 | CPI 1.8125 | SPI 0.3452 | EAC 23724.14 | VAC 19275.86
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000006', 'App móvil de campo',
     'Recién arranca y reúne los cuatro casos borde de docs/EVM_GUIA.md sección 5. Ojo con su CPI consolidado: sale alto solo porque casi no hay costos cargados todavía, no porque el proyecto vaya bien.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '6 seconds', now() - INTERVAL '6 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000006000001', '22222222-2222-4222-8222-000000000006',
     '11111111-1111-4111-8111-000000000002', 'Diseño de pantallas', 12000.00, 50.00, 20.00, 0.00,
     now() - INTERVAL '4 seconds', now() - INTERVAL '4 seconds'),
    ('33333333-3333-4333-8333-000006000002', '22222222-2222-4222-8222-000000000006',
     '11111111-1111-4111-8111-000000000003', 'Backend de sincronización', 18000.00, 0.00, 0.00, 0.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000006000003', '22222222-2222-4222-8222-000000000006',
     '11111111-1111-4111-8111-000000000002', 'Pruebas en campo', 8000.00, 30.00, 0.00, 1200.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000006000004', '22222222-2222-4222-8222-000000000006',
     '11111111-1111-4111-8111-000000000003', 'Publicación en tiendas', 5000.00, 0.00, 10.00, 400.00,
     now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

-- 7. Certificación ISO 27001: finished with an overrun (SPI = 1, CPI < 1, EAC = AC)
--    BAC 50000.00 | PV 50000.00 | EV 50000.00 | AC 56000.00
--    CV -6000.00 | SV 0.00 | CPI 0.8929 | SPI 1.0000 | EAC 56000.00 | VAC -6000.00
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000007', 'Certificación ISO 27001',
     'Terminado al 100 % y entregado a tiempo, pero costó más de lo presupuestado. Comprobación de cordura: si ya terminó, el costo estimado al terminar es exactamente el costo real.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '7 seconds', now() - INTERVAL '7 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, project_id, owner_id, name, budget_at_completion,
                      planned_progress_percent, actual_progress_percent, actual_cost,
                      created_at, updated_at) VALUES
    ('33333333-3333-4333-8333-000007000001', '22222222-2222-4222-8222-000000000007',
     '11111111-1111-4111-8111-000000000003', 'Auditoría interna', 15000.00, 100.00, 100.00, 18000.00,
     now() - INTERVAL '3 seconds', now() - INTERVAL '3 seconds'),
    ('33333333-3333-4333-8333-000007000002', '22222222-2222-4222-8222-000000000007',
     '11111111-1111-4111-8111-000000000002', 'Remediación de hallazgos', 25000.00, 100.00, 100.00, 27000.00,
     now() - INTERVAL '2 seconds', now() - INTERVAL '2 seconds'),
    ('33333333-3333-4333-8333-000007000003', '22222222-2222-4222-8222-000000000007',
     '11111111-1111-4111-8111-000000000003', 'Auditoría de certificación', 10000.00, 100.00, 100.00, 11000.00,
     now() - INTERVAL '1 second', now() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;

-- 8. Tablero de indicadores: no activities: money at zero, CPI/SPI/EAC/VAC not computable, both statuses NOT_APPLICABLE
--    BAC/PV/EV/AC 0.00 | CV/SV 0.00 | CPI/SPI/EAC/VAC no calculables
INSERT INTO project (id, name, description, created_by, created_at, updated_at) VALUES
    ('22222222-2222-4222-8222-000000000008', 'Tablero de indicadores',
     'Proyecto creado pero sin actividades todavía. Sirve para ver que el sistema dice que no hay nada que evaluar en lugar de inventar ceros.',
     '11111111-1111-4111-8111-000000000001', now() - INTERVAL '8 seconds', now() - INTERVAL '8 seconds')
ON CONFLICT (id) DO NOTHING;

COMMIT;
