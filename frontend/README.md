# Striker EVM · Frontend

Dashboard de gestión del valor ganado (EVM). React 18 + TypeScript (strict) + Vite, Tailwind CSS 4,
GSAP para la capa de movimiento, Recharts para las gráficas y MSW para trabajar sin backend.

Este paquete es el andamiaje del módulo **M7** (`docs/ARQUITECTURA.md` §6): sistema de diseño,
shell de la aplicación, autenticación por roles, cliente API tipado y mocks. Los módulos M8–M11
rellenan los espacios (`*Placeholder`) del dashboard.

La fuente de verdad del API es `docs/api/openapi.yaml` (módulo M1). `src/api/types.ts` es su
espejo escrito a mano en un único módulo, pensado para sustituirse por tipos generados sin tocar
el código de las features.

## Requisitos

- Node ≥ 24 y npm ≥ 11 (versiones exactas de dependencias fijadas en `package.json`).

## Scripts

| Script                 | Qué hace                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Servidor Vite en `http://localhost:5173` (mocks activos por defecto) |
| `npm run build`        | Verifica tipos y genera `dist/`                                      |
| `npm run preview`      | Sirve `dist/` localmente                                             |
| `npm run typecheck`    | `tsc --noEmit` para la app y la configuración                        |
| `npm run lint`         | ESLint sin advertencias permitidas                                   |
| `npm run format:check` | Prettier en modo verificación (`npm run format` corrige)             |
| `npm run test`         | Vitest + React Testing Library (`npm run test:watch` en modo watch)  |
| `npm run check`        | lint + format:check + typecheck + test, en ese orden                 |

## Variables de entorno

| Variable            | Por defecto | Descripción                                                         |
| ------------------- | ----------- | ------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api/v1`   | Prefijo del API. En desarrollo Vite hace proxy de `/api` a `:8000`. |
| `VITE_USE_MOCKS`    | `false`     | `true` arranca un Service Worker (MSW) con datos en memoria.        |

Archivos:

- `.env.example`: plantilla documentada.
- `.env.development`: **versionado**, activa los mocks en `npm run dev`.
- `.env.development.local` (ignorado por git): crea uno con `VITE_USE_MOCKS=false` para trabajar
  contra el backend real de FastAPI.

## Mocks (modo demo)

Con `VITE_USE_MOCKS=true` la aplicación registra `public/mockServiceWorker.js` y todos los
endpoints de `docs/api/openapi.yaml` se sirven desde `src/mocks/handlers.ts` con estado en
memoria (se reinicia al recargar). Las reglas de rol se aplican igual que en el backend:
`401` sin token, `403` para un REGISTRAR que crea proyectos o edita actividades ajenas, `400` en
validaciones, `404` en recursos inexistentes.

Datos semilla (`src/mocks/seed.ts`):

| Email                        | Rol       | Nombre             | Contraseña     |
| ---------------------------- | --------- | ------------------ | -------------- |
| `revisor@striker.local`      | REVIEWER  | Laura Revisora     | `Striker2026!` |
| `registrador@striker.local`  | REGISTRAR | Carlos Registrador | `Striker2026!` |
| `registrador2@striker.local` | REGISTRAR | Ana Registradora   | `Striker2026!` |

Proyecto "Portal de clientes" con las actividades Diseño (Carlos), Desarrollo (Ana) y Pruebas
(Carlos), con los **UUID fijos** de `docs/api/README.md`, los mismos que usa el `init.sql` del
backend.

Los archivos de `src/mocks/fixtures/*.json` son **copias literales** de `docs/api/fixtures/`
(`users`, `project`, `activities`, `evm-report`, `evm-report-empty-project`); se copian en vez de
importarse desde `docs/` para que el paquete se construya solo, y `fixtures-sync.test.ts` falla si
alguna copia se desincroniza de su origen. `GET /projects/{id}/evm` devuelve `evm-report.json` tal
cual (CPI 0.9206, SPI 0.9063, EAC 65 172.41, VAC −5 172.41). El frontend no calcula EVM: los
proyectos creados en modo mock reciben los indicadores de `evm-report-empty-project.json`
(`NOT_APPLICABLE`) con una nota que lo explica.

## Estructura

```
frontend/
├── public/mockServiceWorker.js   # generado por `msw init`, no editar
├── src/
│   ├── api/            # types.ts (espejo de docs/api/openapi.yaml, reemplazable por tipos
│   │                   # generados), client.ts, endpoints.ts (una función por endpoint),
│   │                   # errors.ts, useApiQuery.ts
│   ├── lib/            # format (locale), initials
│   ├── app/            # router.tsx, RootRedirect (home por rol), NotFoundPage
│   ├── components/ui/  # Card, Button, TextField, Skeleton, PageHeader, RoleBadge, StatusPill,
│   │                   # AnimatedNumber, ThemeToggle, PlaceholderCard, ErrorState, BrandMark
│   ├── config/env.ts   # lectura tipada de import.meta.env
│   ├── constants/      # routes, storage-keys, http (sin strings ni números mágicos)
│   ├── evm/tone.ts     # mapeo estado EVM → tono del semáforo (presentación, sin cálculo)
│   ├── features/
│   │   ├── auth/       # LoginPage, AuthProvider, useAuth, useCan, RequireAuth, RequireRole,
│   │   │               # permissions.ts (matriz §11)
│   │   ├── layout/     # AppLayout, Sidebar, Topbar, UserChip, nav-items
│   │   ├── projects/   # ProjectsPage (M11), ProjectDashboardPage (shell con slots)
│   │   ├── summary/    # SummaryPlaceholder → M9
│   │   ├── chart/      # ChartPlaceholder, GaugePlaceholder → M10
│   │   └── activities/ # ActivitiesTablePlaceholder, MyActivitiesPage → M8
│   ├── mocks/          # MSW: handlers, db (estado), seed, fixtures/*.json (copias de
│   │                   # docs/api/fixtures), browser, server (tests)
│   ├── motion/         # GSAP: constants, reduced-motion, usePageTransition, useStaggerReveal,
│   │                   # useCountUp, useStatusColorTween
│   ├── session/        # session-store (token + usuario en memoria y sessionStorage)
│   ├── styles/         # tokens.css, theme.css (Tailwind @theme), base.css, index.css
│   ├── test/           # setup.ts (jest-dom, matchMedia), render.tsx (helpers)
│   └── theme/          # ThemeProvider, useTheme, theme-constants
├── eslint.config.js · .prettierrc.json · tsconfig*.json · vite.config.ts
└── .env.example · .env.development
```

## Sistema de diseño

Los tokens viven en `src/styles/tokens.css` como variables CSS y se exponen a Tailwind en
`src/styles/theme.css` (`@theme inline`), de modo que `bg-surface`, `text-ink-muted`,
`rounded-lg`, `shadow-card`, `text-kpi`, etc. leen de la misma fuente.

- **Tema**: claro por defecto, oscuro con `prefers-color-scheme` o forzado con
  `data-theme="light|dark"` en `<html>` (persistido en `localStorage`, `ThemeToggle`).
- **Superficies**: `--canvas`, `--surface`, `--surface-raised`, `--surface-sunken`, `--line`.
- **Texto**: `--ink`, `--ink-muted`, `--ink-subtle`, `--ink-inverse`.
- **Marca**: `--accent`, `--accent-hover`, `--accent-soft`, `--accent-ink`, `--focus-ring`.
- **Semáforo EVM** (idéntico en tarjetas, tabla y gráficas): `--evm-good` (verde: bajo
  presupuesto / adelantado), `--evm-neutral` (ámbar: en presupuesto / en cronograma), `--evm-bad`
  (rojo: sobre presupuesto / atrasado), `--evm-na` (gris: no aplica), cada uno con variante
  `-soft` para fondos. `src/evm/tone.ts` traduce `costStatus` / `scheduleStatus` a estos tonos.
- **Forma y profundidad**: `--radius-sm|md|lg|xl|pill`, `--shadow-card|raised|glow`.
- **Tipografía**: `--font-sans`, `--font-mono`, `--text-display`, `--text-kpi` (numerales grandes
  con `tabular-nums` mediante la utilidad `numeric`), utilidad `eyebrow` para rótulos.

## Movimiento (GSAP)

Reglas de `docs/ARQUITECTURA.md` §12 codificadas en `src/motion/constants.ts`: duraciones de
150–500 ms, la UI nunca espera a una animación y **todo respeta `prefers-reduced-motion`**
(salta al estado final).

| Hook                               | Uso                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `usePageTransition(key)`           | Entrada de vista (fade + desplazamiento) al cambiar de ruta              |
| `useStaggerReveal(ref, options)`   | Entrada escalonada de hijos marcados con `data-reveal` (tarjetas, filas) |
| `useCountUp(value, { decimals })`  | Contador que anima hacia el nuevo valor (`AnimatedNumber`)               |
| `useStatusColorTween(ref, tokens)` | Transición de color del semáforo (`StatusPill`)                          |

## Autenticación y roles

- `POST /auth/login` → `AuthProvider` guarda `{ accessToken, user }` en memoria y en
  `sessionStorage` (`src/session/session-store.ts`); el cliente API inyecta `Authorization:
Bearer` y cierra la sesión ante un `401`.
- `RequireAuth` redirige a `/login` recordando la ruta origen; `RequireRole` redirige a `/` cuando
  el rol no corresponde; `/` envía al REVIEWER a `/projects` y al REGISTRAR a `/my-activities`.
- `useCan()` implementa la matriz de permisos: `can('project:create')`,
  `can('activity:edit', activity)` (REVIEWER siempre; REGISTRAR solo si `activity.owner.id` es
  el usuario).

## Rutas

| Ruta                   | Rol       | Contenido                                                       |
| ---------------------- | --------- | --------------------------------------------------------------- |
| `/login`               | público   | Inicio de sesión                                                |
| `/`                    | ambos     | Redirección por rol                                             |
| `/projects`            | REVIEWER  | Portafolio (placeholder para M11)                               |
| `/projects/:projectId` | ambos     | Dashboard del proyecto con slots para resumen, gráficas y tabla |
| `/my-activities`       | REGISTRAR | Mis actividades (placeholder para M8/M11)                       |
