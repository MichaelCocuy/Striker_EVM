# Striker EVM

Herramienta interna para que los líderes de proyecto registren el avance de sus actividades y
vean, en tiempo real, si el proyecto va bien o mal en cronograma y presupuesto, usando
**Earned Value Management (EVM / Valor Ganado)**, estándar del PMI.

Desafío técnico para el cargo de Ingeniero de Desarrollo en Trycore Colombia. El enunciado
completo está en [`docs/reto.md`](docs/reto.md).

## Qué hace

- CRUD de **proyectos** y **actividades**. Cada actividad registra nombre, presupuesto total
  (BAC), % de avance planificado a la fecha de corte, % de avance real y costo real (AC).
- Cálculo automático de **PV, EV, CV, SV, CPI, SPI, EAC y VAC**, por actividad y consolidado
  por proyecto, con la **interpretación** de CPI y SPI (bajo/sobre presupuesto,
  adelantado/atrasado).
- **Dashboard** con el resumen consolidado, semáforo de estado, gráfica que compara PV, EV y AC
  por actividad, gauges de CPI y SPI con la referencia en 1.0, y la tabla de actividades con
  sus indicadores.
- **Roles**: quien registra el avance (`REGISTRAR`) y quien lo revisa (`REVIEWER`).

Los indicadores **no se persisten**: se calculan al leer, así que editar una actividad actualiza
todo el tablero. Un indicador que no es matemáticamente calculable se devuelve como `null` con
un estado `NOT_APPLICABLE` y el motivo, nunca como cero ni infinito.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 · PyJWT · bcrypt |
| Base de datos | PostgreSQL 16 |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS 4 · GSAP · Recharts |
| Pruebas | pytest + coverage (backend) · Vitest + Testing Library + MSW (frontend) |
| Linters | ruff (backend) · ESLint + Prettier (frontend) |

## Cómo correrlo

### Opción 1 — Docker Compose (recomendada)

Levanta PostgreSQL (inicializada con el script de la base de datos), el backend y el frontend.

```bash
git clone https://github.com/MichaelCocuy/Striker_EVM.git
cd Striker_EVM
docker compose up --build
```

| Servicio | URL |
|---|---|
| Aplicación | http://localhost:5173 |
| API | http://localhost:8000/api/v1 |
| Documentación del API (Swagger UI) | http://localhost:8000/api-docs |
| Verificación de estado | http://localhost:8000/api/v1/health |

El contenedor del frontend sirve el bundle con nginx y hace *proxy* de `/api` hacia el backend,
así que el navegador habla con un solo origen. Para detenerlo: `docker compose down`; para
borrar también los datos: `docker compose down -v`.

Las variables tienen valores por defecto; para ajustarlas, copia
[`.env.example`](.env.example) a `.env`. **`JWT_SECRET` debe cambiarse fuera del entorno local.**

### Opción 2 — Backend y frontend por separado

Útil para desarrollar. Requiere Python 3.12+, Node 20+ y una PostgreSQL accesible (o
`docker compose up -d db`).

```bash
# Backend
cd backend
python -m venv .venv && .venv/Scripts/activate   # Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
export DATABASE_URL="postgresql+psycopg://striker:striker@localhost:5432/striker"
export JWT_SECRET="una-clave-local-de-al-menos-32-bytes"
alembic upgrade head          # crea el esquema si la base está vacía
uvicorn app.main:app --reload

# Frontend (en otra terminal)
cd frontend
npm ci
npm run dev                   # http://localhost:5173, con proxy de /api al backend
```

El dev server arranca con **mocks activados** (`VITE_USE_MOCKS=true` en
`.env.development`), así que la aplicación funciona sin backend. Para trabajar contra el API
real, crea `frontend/.env.development.local` con `VITE_USE_MOCKS=false`.

### Script de inicialización de la base de datos

[`backend/db/init.sql`](backend/db/init.sql) crea el esquema completo, siembra los tres usuarios
y carga el proyecto de ejemplo con sus tres actividades. Es idempotente y Docker Compose lo monta
en el contenedor de PostgreSQL, así que se ejecuta solo en el primer arranque. Para aplicarlo a
mano:

```bash
psql "postgresql://striker:striker@localhost:5432/striker" -f backend/db/init.sql
```

Alembic sigue siendo la fuente de verdad para la evolución del esquema; el script deja
registrada la migración inicial para que ambos caminos queden coherentes.

### Credenciales de ejemplo (solo entorno local)

| Email | Contraseña | Rol | Qué puede hacer |
|---|---|---|---|
| `revisor@striker.local` | `Striker2026!` | REVIEWER | Administrar proyectos, asignar responsables, ver el reporte consolidado |
| `registrador@striker.local` | `Striker2026!` | REGISTRAR | Registrar avance y costo de **sus** actividades |
| `registrador2@striker.local` | `Striker2026!` | REGISTRAR | Igual, sobre otras actividades |

El proyecto de ejemplo **"Portal de clientes"** trae las tres actividades del caso resuelto en
la guía, así que el dashboard abre con datos que se pueden verificar a mano.

## Pruebas

```bash
# Backend: 306 pruebas, 100 % de cobertura (mínimo exigido: 80 % sobre la capa de negocio)
cd backend && pytest --cov

# Frontend: 117 pruebas
cd frontend && npm run test

# Linters
cd backend && ruff check . && ruff format --check .
cd frontend && npm run lint && npm run typecheck
```

Las pruebas del dominio EVM comparan contra los valores resueltos a mano en
[`docs/EVM_GUIA.md`](docs/EVM_GUIA.md), no contra lo que devuelva la implementación. Un test de
contraste verifica que el OpenAPI generado concuerde con el contrato publicado, y otro que las
fixtures que consume el frontend sigan siendo copia exacta de las del contrato.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/reto.md`](docs/reto.md) | Enunciado del desafío (transcripción del PDF original) |
| [`docs/EVM_GUIA.md`](docs/EVM_GUIA.md) | Qué es el Valor Ganado, qué significa cada indicador, casos borde y el ejemplo de tres actividades resuelto paso a paso |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Arquitectura, módulos, dependencias, plan de construcción en paralelo, roles y lineamientos de diseño |
| [`docs/api/openapi.yaml`](docs/api/openapi.yaml) | Contrato del API (fuente de verdad entre backend y frontend) |
| [`docs/GITFLOW.md`](docs/GITFLOW.md) | Reglas de ramas, Pull Requests y mensajes de commit |
| [`backend/README.md`](backend/README.md) | Detalle del backend: endpoints, variables, migraciones, ejemplos con curl |
| [`frontend/README.md`](frontend/README.md) | Detalle del frontend: scripts, mocks, sistema de diseño, movimiento |
| [`AI_PROCESS.md`](AI_PROCESS.md) | Proceso de trabajo con IA: herramientas, prompts textuales, decisiones y reflexión |

## Estructura

```
Striker_EVM/
├── backend/
│   ├── app/domain/          # cálculo EVM y política de roles: Python puro, sin framework
│   ├── app/application/      # casos de uso; dependen de puertos, no de SQLAlchemy
│   ├── app/infrastructure/   # ORM, repositorios, JWT, hashing
│   ├── app/api/v1/           # routers y esquemas; traducen HTTP y nada más
│   ├── db/init.sql           # script de inicialización de la base de datos
│   └── tests/                # unitarias (dominio y casos de uso) e integración (por endpoint)
├── frontend/src/
│   ├── api/                  # cliente tipado del contrato
│   ├── features/             # auth · projects · summary · chart · activities · layout
│   ├── components/ui/        # sistema de diseño
│   ├── motion/               # utilidades GSAP
│   └── mocks/                # MSW con las fixtures del contrato
├── docs/
├── docker-compose.yml
├── AI_PROCESS.md
└── README.md
```

## Flujo de trabajo

Gitflow estricto: `main` (producción, protegida), `develop` (integración), `feature/*` por
módulo, `release/*` antes de cada versión. Todo cambio entró a `develop` mediante Pull Request.
Detalles y comandos en [`docs/GITFLOW.md`](docs/GITFLOW.md).
