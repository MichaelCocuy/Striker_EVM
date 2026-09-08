"""Summary, description and response text of every v1 operation, in Spanish.

Each `OperationDoc` says what the operation does and *who may call it*; `documented()` turns one
of them, plus the statuses the operation can answer, into the keyword arguments of a route. The
texts live here so the routers stay readable and so the wording of the whole API can be reviewed
in one place.
"""

from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from app.api.v1.docs.errors import error_responses


@dataclass(frozen=True)
class OperationDoc:
    """User-facing text of one operation: what it does, for whom, and what a success means."""

    summary: str
    description: str
    response_description: str


def documented(doc: OperationDoc, *errors: HTTPStatus) -> dict[str, Any]:
    """Route keyword arguments: the user-facing text plus the errors the operation can answer."""
    return {
        "summary": doc.summary,
        "description": doc.description,
        "response_description": doc.response_description,
        "responses": error_responses(*errors),
    }


HEALTH = OperationDoc(
    summary="Verificar la salud del servicio y de la base de datos",
    description=(
        "Comprueba que el servicio responde y que la base de datos acepta una consulta trivial "
        "(`SELECT 1`). Es **público**: no requiere token. Lo usan el *healthcheck* de Docker "
        "Compose y el frontend para mostrar el estado de conexión.\n\n"
        "Si el API contesta, `status` es `ok`; `database` vale `ok` o `unavailable`, de modo que "
        "una base de datos caída se reporta con `200` y no como un error del servicio."
    ),
    response_description="El servicio responde; `database` indica el estado de la base de datos.",
)

LOGIN = OperationDoc(
    summary="Iniciar sesión y obtener un JWT",
    description=(
        "Valida email y contraseña y devuelve un JWT (HS256, 8 horas) junto con los datos del "
        "usuario autenticado. Es **público**: es el único endpoint, junto con `/health`, que no "
        "exige token.\n\n"
        "Un email desconocido y una contraseña incorrecta responden el mismo `401 UNAUTHORIZED`, "
        "para no revelar qué correos existen."
    ),
    response_description="Autenticación correcta: token, su vigencia y el usuario.",
)

CURRENT_USER = OperationDoc(
    summary="Obtener el usuario autenticado",
    description=(
        "Devuelve el usuario dueño del token y su rol. Disponible para **cualquier usuario "
        "autenticado**; el frontend lo llama al recargar la página para restaurar la sesión."
    ),
    response_description="Usuario dueño del token.",
)

LIST_USERS = OperationDoc(
    summary="Listar los usuarios del sistema",
    description=(
        "Lista todos los usuarios ordenados por nombre, para que un `REVIEWER` pueda elegir el "
        "responsable (`ownerId`) de una actividad. Solo rol **`REVIEWER`**: un `REGISTRAR` "
        "recibe `403`."
    ),
    response_description="Usuarios ordenados por nombre.",
)

LIST_PROJECTS = OperationDoc(
    summary="Listar los proyectos",
    description=(
        "Devuelve todos los proyectos, cada uno con su conteo de actividades y su creador, del "
        "más reciente al más antiguo. Disponible para **ambos roles**."
    ),
    response_description="Proyectos ordenados por fecha de creación descendente.",
)

CREATE_PROJECT = OperationDoc(
    summary="Crear un proyecto",
    description=(
        "Crea un proyecto vacío, al que después se le agregan actividades. Solo rol "
        "**`REVIEWER`**; el usuario autenticado queda registrado como `createdBy`."
    ),
    response_description="Proyecto creado.",
)

GET_PROJECT = OperationDoc(
    summary="Obtener un proyecto",
    description=(
        "Devuelve un proyecto por su identificador, con su conteo de actividades y su creador. "
        "Disponible para **ambos roles**."
    ),
    response_description="Proyecto encontrado.",
)

UPDATE_PROJECT = OperationDoc(
    summary="Reemplazar un proyecto",
    description=(
        "Reemplaza el nombre y la descripción del proyecto; el resto de los campos son de solo "
        "lectura. Solo rol **`REVIEWER`**."
    ),
    response_description="Proyecto actualizado.",
)

DELETE_PROJECT = OperationDoc(
    summary="Eliminar un proyecto",
    description=(
        "Elimina el proyecto y, **en cascada, todas sus actividades**. Solo rol **`REVIEWER`**. "
        "La operación no es reversible."
    ),
    response_description="Proyecto eliminado; la respuesta no tiene cuerpo.",
)

LIST_ACTIVITIES = OperationDoc(
    summary="Listar las actividades de un proyecto",
    description=(
        "Devuelve las actividades del proyecto con sus **datos crudos** (presupuesto, "
        "porcentajes de avance y costo real) y su responsable, de la más antigua a la más "
        "reciente. No incluye indicadores: para eso está `GET /projects/{projectId}/evm`.\n\n"
        "Disponible para **ambos roles**. Un proyecto sin actividades responde `200` con `[]`; "
        "un proyecto inexistente, `404`."
    ),
    response_description="Actividades ordenadas por fecha de creación ascendente.",
)

CREATE_ACTIVITY = OperationDoc(
    summary="Crear una actividad en un proyecto",
    description=(
        "Agrega una actividad al proyecto. Disponible para **ambos roles**, con esta regla de "
        "responsable:\n\n"
        "- `REGISTRAR`: `ownerId` es opcional y la actividad queda a su nombre; enviar el id de "
        "otro usuario responde `403`.\n"
        "- `REVIEWER`: `ownerId` es **obligatorio** y debe corresponder a un usuario existente "
        "(si falta o no existe, `400`).\n\n"
        "Los datos crudos deben cumplir las reglas del dominio EVM: `budgetAtCompletion` mayor "
        "que 0, `actualCost` de 0 en adelante y los dos porcentajes entre 0 y 100."
    ),
    response_description="Actividad creada.",
)

UPDATE_ACTIVITY = OperationDoc(
    summary="Reemplazar una actividad",
    description=(
        "Reemplaza los datos de la actividad; es la operación con la que se registra el avance "
        "y el costo real.\n\n"
        "- `REVIEWER`: puede editar cualquier actividad y reasignar su `ownerId`.\n"
        "- `REGISTRAR`: solo las actividades de las que es responsable, y no puede cambiar el "
        "responsable (`403` en cualquier otro caso).\n\n"
        "La actividad debe pertenecer al proyecto de la ruta; si no, responde `404`."
    ),
    response_description="Actividad actualizada.",
)

DELETE_ACTIVITY = OperationDoc(
    summary="Eliminar una actividad",
    description=(
        "Elimina la actividad del proyecto. Un `REVIEWER` puede eliminar cualquiera; un "
        "`REGISTRAR`, solo las propias (`403` en caso contrario)."
    ),
    response_description="Actividad eliminada; la respuesta no tiene cuerpo.",
)

EVM_REPORT = OperationDoc(
    summary="Obtener el reporte EVM de un proyecto",
    description=(
        "Calcula y devuelve, en una sola llamada, los indicadores de Valor Ganado de **cada "
        "actividad** y el **consolidado del proyecto**, con su interpretación de costo y de "
        "cronograma. Es la única fuente de indicadores del sistema: el cliente no calcula nada.\n\n"
        "- Fórmulas: `PV = %plan * BAC`, `EV = %real * BAC`, `CV = EV - AC`, `SV = EV - PV`, "
        "`CPI = EV / AC`, `SPI = EV / PV`, `EAC = BAC / CPI`, `VAC = BAC - EAC`.\n"
        "- El consolidado **suma los valores en dinero** de las actividades y recalcula varianzas, "
        "índices y pronósticos sobre esas sumas; nunca promedia índices.\n"
        "- Los indicadores no se persisten: se calculan en cada consulta, así que el reporte "
        "siempre refleja los datos actuales.\n"
        "- Una división por cero devuelve el indicador como `null`, con estado `NOT_APPLICABLE` "
        "y el motivo en `notes`.\n\n"
        "Disponible para **ambos roles**. Un proyecto sin actividades responde `200` con "
        "`activities: []` y el consolidado en cero, `null` y `NOT_APPLICABLE`; un proyecto "
        "inexistente, `404`."
    ),
    response_description="Reporte EVM calculado en el momento de la consulta.",
)
