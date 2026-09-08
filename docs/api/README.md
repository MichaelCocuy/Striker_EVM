# Contrato del API (v1) y fixtures compartidas

Esta carpeta es la **fuente de verdad** de la interfaz HTTP de Striker EVM (módulo M1 de
[`ARQUITECTURA.md`](../ARQUITECTURA.md)). Backend y frontend se construyen en paralelo contra
estos archivos; si ambos los respetan, la integración final no requiere rehacer nada.

| Archivo | Qué es |
|---|---|
| [`openapi.yaml`](openapi.yaml) | Contrato OpenAPI 3.1: rutas bajo `/api/v1`, esquemas, códigos de respuesta, roles, catálogo de errores y ejemplos. |
| [`fixtures/`](fixtures/) | JSON de ejemplo, con UUID fijos, que ambos lados usan tal cual (ver tabla abajo). |
| [`../../redocly.yaml`](../../redocly.yaml) | Configuración del linter; `.redocly.lint-ignore.yaml` documenta la única excepción (`GET /health` no tiene respuesta 4xx). |

## Ver el contrato

```bash
# Documentación navegable con recarga en caliente (Node 24)
npx @redocly/cli preview-docs docs/api/openapi.yaml

# Validar (debe terminar en "Your API description is valid")
npx @redocly/cli lint
```

También puede pegarse el archivo en <https://editor.swagger.io>. Cuando el backend esté
levantado, la misma documentación se sirve en `/api-docs`.

## Fixtures

Todas describen el proyecto **"Portal de clientes"** de [`EVM_GUIA.md` §6](../EVM_GUIA.md)
(actividades Diseño, Desarrollo y Pruebas) y los usuarios semilla de
[`ARQUITECTURA.md` §11](../ARQUITECTURA.md). Los UUID son fijos para que los tests del backend
y los mocks del frontend hablen de los mismos objetos:

| Entidad | UUID |
|---|---|
| Laura Revisora (`REVIEWER`) | `11111111-1111-4111-8111-000000000001` |
| Carlos Registrador (`REGISTRAR`) | `11111111-1111-4111-8111-000000000002` |
| Ana Registradora (`REGISTRAR`) | `11111111-1111-4111-8111-000000000003` |
| Proyecto "Portal de clientes" | `22222222-2222-4222-8222-000000000001` |
| Proyecto sin actividades | `22222222-2222-4222-8222-000000000002` |
| Actividad Diseño (Carlos) | `33333333-3333-4333-8333-000000000001` |
| Actividad Desarrollo (Ana) | `33333333-3333-4333-8333-000000000002` |
| Actividad Pruebas (Carlos) | `33333333-3333-4333-8333-000000000003` |

| Fixture | Esquema | Uso |
|---|---|---|
| `users.json` | `User[]` | Respuesta de `GET /users`; usuarios que `db/init.sql` debe sembrar con estos mismos ids. |
| `login-response.json` | `LoginResponse` | Respuesta de `POST /auth/login` para Laura. El token es un JWT de forma válida firmado con una clave de desarrollo; no sirve contra el backend real. |
| `project.json` | `Project` | Respuesta de `GET /projects/{id}` y elemento de `GET /projects`. |
| `activities.json` | `Activity[]` | Respuesta de `GET /projects/{id}/activities` (datos crudos, sin indicadores). |
| `evm-report.json` | `EvmReport` | Respuesta de `GET /projects/{id}/evm` con los **valores exactos** de `EVM_GUIA.md` §6.5 y §6.6. Es el oráculo del test de integración del reporte. |
| `evm-report-empty-project.json` | `EvmReport` | Proyecto sin actividades (§5.5): ceros, `null`, `NOT_APPLICABLE` y una nota. |
| `evm-edge-cases.json` | `{case, title, scope, input \| activities, expected: EvmIndicators}[]` | Filas de la tabla de casos borde de `EVM_GUIA.md` §5 (más el caso 5.8 de índice = 1). Sirve para tests parametrizados del dominio y para probar la UI con `null`. |
| `error-validation.json`, `error-unauthorized.json`, `error-forbidden.json`, `error-not-found.json` | `Error` | Cuerpos de 400 / 401 / 403 / 404. |

### Cómo debe usarlas cada lado

- **Backend.** El script de inicialización siembra los usuarios con los ids de `users.json`.
  Los tests de integración cargan el proyecto y las actividades de `project.json` /
  `activities.json`, llaman a `GET /projects/{id}/evm` y comparan la respuesta con
  `evm-report.json` campo por campo (ignorando `generatedAt`, y `createdAt`/`updatedAt` donde
  aplique). Los tests unitarios del dominio se parametrizan con `evm-edge-cases.json`. Los
  textos de `notes` de las fixtures son los canónicos: el dominio debe producir exactamente
  esos.
- **Frontend.** Los *handlers* de MSW devuelven estas fixtures sin modificarlas; el cliente
  tipado se genera desde `openapi.yaml`. Nunca se recalcula un indicador en la UI: lo que se
  muestra es lo que trae `evm-report.json`.

### Convenciones numéricas (resumen de `EVM_GUIA.md` §7)

- Dinero con 2 decimales; índices con 4; redondeo *half up* solo al construir la respuesta.
- Un indicador no calculable viaja como `null`, con estado `NOT_APPLICABLE` y motivo en
  `notes`. Nunca 0, 1 ni infinito en su lugar.
- Los porcentajes viajan en escala 0–100.

## Regla de cambios

El contrato se **congela** al mergear M1. Durante la construcción de backend y frontend
`openapi.yaml` y las fixtures son artefactos inmutables: cualquier cambio (un campo nuevo,
un código de respuesta, un texto de `notes`) se hace en un **Pull Request propio** hacia
`develop`, con el linter en verde y avisando a ambos lados para que actualicen cliente,
mocks y tests en la misma ola.
