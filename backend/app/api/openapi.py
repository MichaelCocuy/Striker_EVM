"""App-level OpenAPI metadata and post-processing of the generated document.

The routers describe their own operations; this module holds what belongs to the document as a
whole (summary, description, tags, servers, contact, license) and removes the `422` responses
FastAPI adds by default: `register_error_handlers` turns every request validation failure into
the contract's `400 VALIDATION_ERROR`, so a `422` never leaves the application.
"""

from http import HTTPStatus
from typing import Any

from fastapi import FastAPI

REPOSITORY_URL = "https://github.com/MichaelCocuy/Striker_EVM"
CONTRACT_URL = f"{REPOSITORY_URL}/blob/develop/docs/api/openapi.yaml"

APP_SUMMARY = "API de Striker EVM: avance, costo e indicadores de Valor Ganado (EVM)."

APP_DESCRIPTION = f"""
API REST de **Striker EVM**: registro del avance y del costo real de las actividades de un
proyecto y cálculo de sus indicadores de **Earned Value Management** (Valor Ganado).

EVM convierte el trabajo a dinero y compara cuatro magnitudes para responder *dónde estoy* y *en
qué voy a terminar*: **BAC** (presupuesto total), **PV** (valor planificado, `%plan * BAC`),
**EV** (valor ganado, `%real * BAC`) y **AC** (costo real). De ahí salen las varianzas
(`CV = EV - AC`, `SV = EV - PV`), los índices (`CPI = EV / AC`, `SPI = EV / PV`) y los
pronósticos (`EAC = BAC / CPI`, `VAC = BAC - EAC`).

## Cómo funciona el API

- De cada actividad se registran solo **datos crudos**: BAC, % planificado, % real y costo real.
- Los indicadores **no se persisten**: se calculan en cada lectura de
  `GET /projects/{{projectId}}/evm`, así que el reporte siempre refleja los datos actuales.
- **Escalas**: dinero con 2 decimales, índices con 4 y porcentajes en escala de 0 a 100, con
  redondeo *half up*. Viajan como números JSON, que no llevan ceros de relleno (`10000.00` se
  serializa como `10000.0`); el cliente decide el formato de presentación.
- Un indicador **no calculable** (división por cero) se devuelve como `null`, con estado
  `NOT_APPLICABLE` y el motivo en `notes`. Nunca se inventan valores (ni 0, ni 1, ni infinito).
- Todas las respuestas de error (4xx/5xx) comparten el cuerpo `{{code, message, details}}`.

## Autenticación y roles

Todos los endpoints salvo `GET /health` y `POST /auth/login` exigen la cabecera
`Authorization: Bearer <JWT>`, que se obtiene en `POST /auth/login` (HS256, 8 horas). En esta
página, botón **Authorize**. Sin token válido responden `401`; con un rol sin permiso, `403`.

- **`REGISTRAR`**: ve proyectos y reportes; crea actividades (queda como responsable) y edita o
  elimina **solo las suyas**.
- **`REVIEWER`**: todo lo anterior, más listar usuarios, administrar proyectos y editar o
  eliminar cualquier actividad.

El contrato canónico del API es [`docs/api/openapi.yaml`]({CONTRACT_URL}); un test de la suite
comprueba que este documento y ese contrato sigan de acuerdo.
"""

APP_CONTACT = {"name": "Michael Cocuy (autor del reto técnico)", "url": REPOSITORY_URL}
APP_LICENSE = {"name": "Uso interno - reto técnico Trycore Colombia", "url": REPOSITORY_URL}

# The generated paths already carry the `/api/v1` prefix, so the servers point at the host root
# (the canonical contract instead puts that prefix in its single relative server).
APP_SERVERS = [
    {"url": "/", "description": "Mismo host que sirve esta documentación."},
    {"url": "http://localhost:8000", "description": "Entorno local (Docker Compose o uvicorn)."},
]

OPENAPI_TAGS = [
    {"name": "health", "description": "Verificación de salud del servicio y de la base de datos."},
    {"name": "auth", "description": "Obtención del JWT y consulta del usuario autenticado."},
    {
        "name": "users",
        "description": "Consulta de usuarios para asignar responsables de actividades.",
    },
    {
        "name": "projects",
        "description": "Administración de proyectos, los contenedores de actividades.",
    },
    {
        "name": "activities",
        "description": "Administración de actividades y de sus datos crudos de avance y costo.",
    },
    {
        "name": "evm",
        "description": (
            "Indicadores de Valor Ganado por actividad y consolidados por proyecto, "
            "con su interpretación."
        ),
    },
]

UNPROCESSABLE_ENTITY = str(HTTPStatus.UNPROCESSABLE_ENTITY.value)
FRAMEWORK_VALIDATION_SCHEMAS = ("HTTPValidationError", "ValidationError")
HTTP_METHODS = frozenset({"get", "put", "post", "delete", "options", "head", "patch", "trace"})


def build_openapi(application: FastAPI) -> dict[str, Any]:
    """Return the OpenAPI document of the application, generated once and then cached."""
    if application.openapi_schema is None:
        application.openapi_schema = _without_framework_validation_errors(
            FastAPI.openapi(application)
        )
    return application.openapi_schema


def _without_framework_validation_errors(document: dict[str, Any]) -> dict[str, Any]:
    """Drop the `422` responses and schemas FastAPI adds; the API answers `400` instead."""
    for path_item in document["paths"].values():
        for method, operation in path_item.items():
            if method in HTTP_METHODS:
                operation["responses"].pop(UNPROCESSABLE_ENTITY, None)
    schemas = document["components"]["schemas"]
    for name in FRAMEWORK_VALIDATION_SCHEMAS:
        schemas.pop(name, None)
    return document
