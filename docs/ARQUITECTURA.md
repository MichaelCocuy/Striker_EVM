# Arquitectura y descomposición en módulos

Objetivo de este documento: definir la arquitectura de Striker EVM, partirla en módulos con
fronteras claras, hacer explícitas las dependencias entre ellos y derivar de ahí **qué se
puede construir en paralelo y qué no**. El plan está pensado para trabajar varias ramas
`feature/*` a la vez (una por módulo) y minimizar el tiempo total.

---

## 1. Requisitos que condicionan la arquitectura

Del enunciado (`reto.md`) se derivan restricciones no negociables:

| Requisito | Consecuencia arquitectónica |
|---|---|
| Lógica de negocio fuera de los controladores | Capa de **dominio** pura (cálculo EVM) separada de la capa **API** y de la **persistencia**. |
| Cobertura ≥ 80 % en la capa de negocio, casos borde cubiertos | El dominio no depende de framework ni de base de datos: se prueba con tests unitarios puros y rápidos. |
| Un test de integración por endpoint validando el contrato | El **contrato OpenAPI** se define primero y es la referencia de esos tests. |
| Indicadores por actividad **y** consolidados por proyecto | Un servicio de reporte que compone actividades → proyecto. El frontend **no** calcula nada. |
| Dashboard "en tiempo real" | Tras cada creación/edición/borrado, el frontend vuelve a pedir el reporte EVM al backend. |
| Cero code smells, linter en el repo | Linter y formateador configurados en backend y frontend desde el andamiaje. |
| OpenAPI en `/api-docs` o `/swagger-ui` | El framework debe generar OpenAPI desde el código; se enriquece con descripciones y códigos de error. |
| README con instrucciones locales y script de inicialización de BD | `docker compose up` levanta PostgreSQL + backend + frontend; el script SQL de inicialización vive en el repo. |

---

## 2. Stack propuesto

> **Decisión pendiente del autor.** La recomendación es la siguiente; la descomposición en
> módulos de este documento es válida con cualquiera de las dos opciones preferidas por el
> enunciado (Spring Boot o FastAPI), solo cambian las herramientas de cada módulo.

| Capa | Recomendación | Alternativa equivalente | Motivo de la recomendación |
|---|---|---|---|
| Backend | **Python 3.12+ / FastAPI** + SQLAlchemy 2 + Alembic + Pydantic v2 | Java 21 / Spring Boot 3 + Spring Data JPA + Flyway + springdoc | FastAPI genera OpenAPI automáticamente en `/docs` (se reubica en `/api-docs`), `Decimal` nativo para dinero, `pytest` + `pytest-cov` para cobertura, `ruff` como linter/formateador único. Menos ceremonia para un plazo de 5 días. |
| Base de datos | **PostgreSQL 16** (Docker) | — | Preferencia explícita del enunciado. `NUMERIC` para dinero y porcentajes. |
| Frontend | **React 18 + TypeScript + Vite** | Angular 17+ | Tipado del contrato, arranque rápido, `Recharts` para la gráfica PV/EV/AC, `ESLint` + `Prettier`. |
| Orquestación local | **Docker Compose** | — | Un comando para levantar todo; el script SQL de inicialización se monta en el contenedor de PostgreSQL. |

Herramientas disponibles en la máquina de desarrollo: Java 21, Node 24, Python 3.14, Docker
29 con Compose v5. Nota: si se elige FastAPI, usar la imagen `python:3.12` en Docker para
evitar incompatibilidades de librerías con Python 3.14, muy reciente.

---

## 3. Vista general

```mermaid
flowchart LR
    subgraph Frontend["Frontend (React + TS)"]
        UI[Dashboard]
        Client[API client tipado]
        UI --> Client
    end

    subgraph Backend["Backend (FastAPI)"]
        API[Capa API<br/>routers · schemas · errores]
        APP[Capa aplicación<br/>casos de uso]
        DOM[Dominio EVM<br/>cálculo puro, sin framework]
        REPO[Persistencia<br/>ORM · repositorios · migraciones]
        API --> APP
        APP --> DOM
        APP --> REPO
    end

    DB[(PostgreSQL)]
    Client -- HTTP/JSON --> API
    REPO --> DB
```

Regla de dependencias: las flechas solo apuntan hacia adentro. **El dominio no importa
nada** de API ni de persistencia. La capa de aplicación orquesta: lee de repositorios,
llama al dominio, devuelve resultados que la capa API serializa.

---

## 4. Modelo de datos

```mermaid
erDiagram
    PROJECT ||--o{ ACTIVITY : contiene
    PROJECT {
        uuid id PK
        varchar name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    ACTIVITY {
        uuid id PK
        uuid project_id FK
        varchar name
        numeric budget_at_completion
        numeric planned_progress_percent
        numeric actual_progress_percent
        numeric actual_cost
        timestamptz created_at
        timestamptz updated_at
    }
```

Restricciones en base de datos (además de la validación en la API):

- `budget_at_completion NUMERIC(14,2) CHECK (> 0)`
- `actual_cost NUMERIC(14,2) CHECK (>= 0)`
- `planned_progress_percent`, `actual_progress_percent NUMERIC(5,2) CHECK (BETWEEN 0 AND 100)`
- `ON DELETE CASCADE` de proyecto a actividades.
- **Los indicadores no se persisten.** Son derivados; se calculan en cada consulta. Evita
  inconsistencias y simplifica la edición.

---

## 5. Contrato del API (v1)

Este contrato es el **punto de sincronización** entre backend y frontend. Se congela antes
de abrir las ramas de ambos lados; cualquier cambio posterior pasa por PR propio.

Prefijo: `/api/v1`. Documentación: `/api-docs` (Swagger UI) y `/api-docs/openapi.json`.

| Método | Ruta | Propósito | Códigos |
|---|---|---|---|
| GET | `/health` | Verificar que el servicio y la BD responden | 200 |
| GET | `/projects` | Listar proyectos (con conteo de actividades) | 200 |
| POST | `/projects` | Crear proyecto | 201, 400 |
| GET | `/projects/{projectId}` | Obtener proyecto | 200, 404 |
| PUT | `/projects/{projectId}` | Editar proyecto | 200, 400, 404 |
| DELETE | `/projects/{projectId}` | Eliminar proyecto y sus actividades | 204, 404 |
| GET | `/projects/{projectId}/activities` | Listar actividades (datos crudos) | 200, 404 |
| POST | `/projects/{projectId}/activities` | Crear actividad | 201, 400, 404 |
| PUT | `/projects/{projectId}/activities/{activityId}` | Editar actividad | 200, 400, 404 |
| DELETE | `/projects/{projectId}/activities/{activityId}` | Eliminar actividad | 204, 404 |
| GET | `/projects/{projectId}/evm` | **Reporte EVM**: indicadores por actividad + consolidado + interpretación | 200, 404 |

Esquemas principales (JSON, `camelCase`; dinero como string decimal o número con 2
decimales, se fija en el OpenAPI):

```jsonc
// ActivityInput (POST/PUT)
{
  "name": "Desarrollo",
  "budgetAtCompletion": 40000.00,
  "plannedProgressPercent": 50.00,
  "actualProgressPercent": 40.00,
  "actualCost": 20000.00
}

// EvmIndicators (se usa igual para actividad y proyecto)
{
  "budgetAtCompletion": 40000.00,
  "plannedValue": 20000.00,
  "earnedValue": 16000.00,
  "actualCost": 20000.00,
  "costVariance": -4000.00,
  "scheduleVariance": -4000.00,
  "costPerformanceIndex": 0.8000,        // null si no calculable
  "schedulePerformanceIndex": 0.8000,    // null si no calculable
  "estimateAtCompletion": 50000.00,      // null si no calculable
  "varianceAtCompletion": -10000.00,     // null si no calculable
  "costStatus": "OVER_BUDGET",           // UNDER_BUDGET | ON_BUDGET | OVER_BUDGET | NOT_APPLICABLE
  "scheduleStatus": "BEHIND_SCHEDULE",   // AHEAD_OF_SCHEDULE | ON_SCHEDULE | BEHIND_SCHEDULE | NOT_APPLICABLE
  "notes": []                            // motivos cuando algo es NOT_APPLICABLE
}

// EvmReport (GET /projects/{id}/evm)
{
  "project": { "id": "...", "name": "Portal de clientes", "indicators": { /* EvmIndicators */ } },
  "activities": [
    { "id": "...", "name": "Diseño", "input": { /* ActivityInput */ }, "indicators": { /* EvmIndicators */ } }
  ]
}

// Error (todos los 4xx/5xx)
{ "code": "VALIDATION_ERROR", "message": "plannedProgressPercent must be between 0 and 100", "details": [ ... ] }
```

Los valores esperados del reporte para el proyecto de ejemplo están en
[`EVM_GUIA.md`](EVM_GUIA.md#6-ejemplo-completo-con-tres-actividades-resuelto-paso-a-paso);
ese JSON se guarda como *fixture* compartida por backend (tests de integración) y frontend
(mocks).

---

## 6. Módulos

Cada módulo es una rama `feature/<id>` que entra a `develop` por PR. "Entrega" es la
definición de terminado.

| ID | Módulo | Rama | Entrega | Depende de |
|---|---|---|---|---|
| **M0** | Fundaciones del repo | `main` inicial + `feature/docs-evm-guide-and-architecture` | Gitflow, README, guía EVM, este documento, AI_PROCESS.md | — |
| **M1** | Contrato API y fixtures | `feature/api-contract` | `docs/api/openapi.yaml` con todos los endpoints, esquemas, errores; `docs/api/fixtures/*.json` con el proyecto de ejemplo y su reporte esperado | M0 |
| **M2** | Dominio EVM | `feature/backend-evm-domain` | Módulo puro de cálculo: indicadores por actividad, consolidado, interpretación, casos borde. Tests unitarios con los valores de la guía. Cobertura ≥ 80 % (meta: ~100 %). | M0 (solo la guía) |
| **M3** | Andamiaje backend + persistencia | `feature/backend-persistence` | Proyecto FastAPI con `ruff`, `pytest`, `docker-compose` (PostgreSQL), modelos ORM, migraciones, `db/init.sql`, repositorios, `GET /health` | M1 (nombres de campos) |
| **M4** | API CRUD proyectos y actividades | `feature/backend-crud-api` | Routers + schemas + validación + manejo de errores uniforme; test de integración por endpoint contra el contrato | M1, M3 |
| **M5** | API reporte EVM | `feature/backend-evm-report` | Caso de uso `GetProjectEvmReport` que compone M2 + repositorios; endpoint `GET /projects/{id}/evm`; test de integración con la fixture | M2, M4 |
| **M6** | Documentación OpenAPI enriquecida | `feature/backend-openapi-docs` | Descripciones por endpoint, ejemplos, códigos de error, Swagger en `/api-docs`; verificación de que el OpenAPI generado coincide con M1 | M4, M5 |
| **M7** | Andamiaje frontend | `feature/frontend-scaffold` | Vite + React + TS, ESLint/Prettier, layout base, cliente API tipado generado desde `openapi.yaml`, mocks (MSW) con las fixtures de M1, estado de carga/error | M1 |
| **M8** | CRUD de actividades + tabla con indicadores | `feature/frontend-activities` | Formulario crear/editar/eliminar actividad, tabla de actividades con sus indicadores | M7 |
| **M9** | Resumen consolidado y semáforos | `feature/frontend-project-summary` | Tarjetas de indicadores del proyecto, indicación visual de CPI/SPI (colores/etiquetas), manejo de `NOT_APPLICABLE` | M7 |
| **M10** | Gráfica PV / EV / AC | `feature/frontend-evm-chart` | Gráfica de barras agrupadas por actividad con PV, EV y AC | M7 |
| **M11** | Gestión de proyectos en UI | `feature/frontend-projects` | Lista/selección/creación de proyecto (mínimo viable para llegar al dashboard) | M7 |
| **M12** | Integración y entrega local | `feature/integration` | `docker compose up` completo (BD + backend + frontend), CORS, variables de entorno, README con pasos de ejecución y datos de ejemplo cargados | M5, M6, M8, M9, M10, M11 |
| **M13** | Release | `release/1.0.0` → `main` | Versión, README final, AI_PROCESS.md cerrado, tag `v1.0.0` | M12 |

Transversal (no es rama propia): actualizar `AI_PROCESS.md` en cada PR que involucre
prompts o decisiones, y preparar el guion del video.

---

## 7. Grafo de dependencias

```mermaid
flowchart TD
    M0[M0 Fundaciones] --> M1[M1 Contrato API + fixtures]
    M0 --> M2[M2 Dominio EVM]
    M1 --> M3[M3 Andamiaje backend + persistencia]
    M1 --> M7[M7 Andamiaje frontend + mocks]
    M3 --> M4[M4 API CRUD]
    M2 --> M5[M5 API reporte EVM]
    M4 --> M5
    M4 --> M6[M6 OpenAPI enriquecido]
    M5 --> M6
    M7 --> M8[M8 CRUD actividades + tabla]
    M7 --> M9[M9 Resumen + semáforos]
    M7 --> M10[M10 Gráfica PV/EV/AC]
    M7 --> M11[M11 Gestión de proyectos UI]
    M5 --> M12[M12 Integración]
    M6 --> M12
    M8 --> M12
    M9 --> M12
    M10 --> M12
    M11 --> M12
    M12 --> M13[M13 Release 1.0.0]

    classDef done fill:#2e7d32,color:#fff,stroke:#1b5e20
    classDef critical stroke:#c62828,stroke-width:3px
    class M0 done
    class M1,M3,M4,M5,M12,M13 critical
```

**Ruta crítica** (borde rojo): M1 → M3 → M4 → M5 → M12 → M13. Es la cadena backend: no se
puede exponer el reporte sin CRUD, ni CRUD sin persistencia, ni persistencia sin haber
fijado el contrato. Todo lo demás cuelga en paralelo de esa cadena.

---

## 8. Plan de construcción en paralelo

### Qué se puede paralelizar y por qué

| Se hace en paralelo | Por qué es seguro |
|---|---|
| **M1 ∥ M2** | El dominio EVM solo necesita la guía; no le importa cómo se llaman los campos JSON. El contrato solo necesita la guía y el enunciado. |
| **M3 ∥ M7** | Ambos parten del contrato. Uno construye la BD, el otro la UI contra mocks. No se tocan. |
| **M8 ∥ M9 ∥ M10 ∥ M11** | Componentes independientes que consumen el mismo cliente API mockeado de M7. Se integran en el dashboard al final de la ola. |
| **M4 ∥ (M8–M11)** | El frontend entero avanza contra mocks mientras el backend termina el CRUD. |
| **M6 ∥ frontend** | Enriquecer OpenAPI no bloquea a nadie. |

### Qué **no** se puede paralelizar

| Secuencia obligatoria | Motivo |
|---|---|
| M1 antes de M3, M4, M7 | Si backend y frontend inventan nombres de campos por separado, la integración se vuelve un rehacer. El contrato es la única fuente de verdad compartida. |
| M3 antes de M4 | Los endpoints CRUD escriben y leen de la BD. |
| M2 **y** M4 antes de M5 | El reporte compone cálculo + datos persistidos. |
| Todo antes de M12 | La integración necesita ambos lados reales. |
| M12 antes de M13 | No se libera lo que no corre de punta a punta. |

### Olas de trabajo

```mermaid
gantt
    title Olas de construcción (duración relativa, no fechas)
    dateFormat  X
    axisFormat  %s

    section Ola 0
    M0 Fundaciones                :done, m0, 0, 1

    section Ola 1
    M1 Contrato API + fixtures    :crit, m1, 1, 2
    M2 Dominio EVM + tests        :m2, 1, 3

    section Ola 2 · Backend
    M3 Persistencia               :crit, m3, 2, 4
    M4 API CRUD                   :crit, m4, 4, 6
    M5 API reporte EVM            :crit, m5, 6, 7
    M6 OpenAPI enriquecido        :m6, 7, 8

    section Ola 2 · Frontend
    M7 Andamiaje + mocks          :m7, 2, 3
    M8 CRUD actividades + tabla   :m8, 3, 5
    M9 Resumen + semáforos        :m9, 3, 4
    M10 Gráfica PV/EV/AC          :m10, 3, 4
    M11 Gestión de proyectos      :m11, 4, 5

    section Ola 3
    M12 Integración + README      :crit, m12, 8, 9
    M13 Release 1.0.0             :crit, m13, 9, 10
```

| Ola | Ramas simultáneas | Condición para pasar a la siguiente |
|---|---|---|
| 0 | M0 | Este documento mergeado en `develop`. |
| 1 | **M1, M2** | Contrato congelado y fixtures publicadas; dominio con tests verdes. |
| 2 | **Backend**: M3 → M4 → M5 → M6 (secuencial) · **Frontend**: M7 → {M8, M9, M10, M11} (paralelo tras M7) | Backend expone `/evm` real; frontend funciona completo contra mocks. |
| 3 | M12 → M13 | Demo con un proyecto y tres actividades funciona con `docker compose up`. |

### Mecánica para trabajar varias ramas a la vez

- Una rama `feature/*` por módulo, cada una en un **git worktree** propio (directorios
  hermanos), para que varios agentes o sesiones trabajen sin pisarse:
  `git worktree add ../striker-m2 -b feature/backend-evm-domain develop`.
- El contrato (`docs/api/openapi.yaml`) y las fixtures se tratan como **artefactos
  inmutables** durante la ola 2. Un cambio requiere PR propio y aviso a ambos lados.
- Orden de merge en la ola 2: primero lo que otros necesitan (M7 antes que M8–M11); las
  ramas paralelas del frontend se rebasan sobre `develop` antes de abrir PR para evitar
  conflictos en `App.tsx`/rutas.
- Los tests son la puerta de cada PR: dominio (unitarios), API (integración por endpoint),
  frontend (componentes con mocks).

---

## 9. Estructura de directorios objetivo

```
Striker_EVM/
├── backend/
│   ├── app/
│   │   ├── domain/evm/          # M2: cálculo puro (sin FastAPI, sin SQLAlchemy)
│   │   ├── application/         # casos de uso: proyectos, actividades, reporte EVM
│   │   ├── infrastructure/db/   # M3: modelos ORM, repositorios, sesión, migraciones
│   │   └── api/v1/              # M4–M6: routers, schemas (Pydantic), errores
│   ├── tests/
│   │   ├── unit/domain/         # oráculo: EVM_GUIA.md §5 y §6
│   │   └── integration/api/     # un test por endpoint contra el contrato
│   ├── db/init.sql              # script de inicialización de BD (montado en Postgres)
│   ├── pyproject.toml           # ruff, pytest, cobertura
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                 # M7: cliente generado desde openapi.yaml
│   │   ├── features/activities/ # M8
│   │   ├── features/summary/    # M9
│   │   ├── features/chart/      # M10
│   │   ├── features/projects/   # M11
│   │   └── mocks/               # MSW con fixtures de docs/api/fixtures
│   ├── .eslintrc.cjs · .prettierrc
│   └── Dockerfile
├── docs/
│   ├── api/openapi.yaml         # M1: contrato
│   ├── api/fixtures/            # M1: proyecto de ejemplo y reporte esperado
│   ├── EVM_GUIA.md · ARQUITECTURA.md · GITFLOW.md · reto.md
├── docker-compose.yml           # M12
├── AI_PROCESS.md
└── README.md
```

---

## 10. Decisiones de diseño registradas

Estas decisiones se tomaron al escribir este documento y quedan abiertas a que el autor las
confirme o cambie (los cambios se anotan en `AI_PROCESS.md`):

1. **Indicadores no persistidos, calculados por consulta.** Simplifica ediciones y evita
   estados inconsistentes. El costo (recalcular en cada GET) es despreciable para el volumen
   de una herramienta interna.
2. **Un único endpoint de reporte** (`GET /projects/{id}/evm`) en lugar de incrustar
   indicadores en cada respuesta de actividad. El frontend obtiene el dashboard completo con
   una llamada y la lógica vive en un solo lugar.
3. **`null` + estado `NOT_APPLICABLE` + `notes`** para indicadores no calculables. Ver
   justificación en `EVM_GUIA.md §5`.
4. **Contrato primero.** Es lo que habilita el paralelismo backend/frontend; su costo es un
   medio día al inicio.
5. **Frontend sin lógica EVM.** Cumple "la lógica de negocio no vive en los controladores"
   llevado al extremo: tampoco vive en la UI. Facilita cumplir la cobertura del 80 % donde
   importa.
6. **Porcentajes en escala 0–100 en la API** (como los ingresa un humano) y fracción 0–1 solo
   dentro del dominio.
