"""Descriptions of the fields that more than one schema publishes.

The raw measures of an activity appear in `Activity`, `ActivityInput` and in the `input` block of
the EVM report; the indicators appear both per activity and consolidated per project. Their
wording follows `docs/EVM_GUIA.md` section 3, so the API documents what each indicator *answers*
and not only its type. Money carries 2 decimals, the indices 4 and the percentages use the 0 to
100 scale; `null` always means "no calculable".
"""

# --------------------------------------------------------------- raw measures of an activity
ACTIVITY_NAME = "Nombre de la actividad, hasta 120 caracteres; se recortan los espacios sobrantes."
ACTIVITY_OWNER = "Usuario responsable de registrar el avance y el costo de la actividad."

BUDGET_AT_COMPLETION = (
    "**BAC**: presupuesto total planificado de la actividad al 100 % de avance. Dinero con 2 "
    "decimales; debe ser mayor que 0, porque es el denominador del método."
)
PLANNED_PROGRESS_PERCENT = (
    "Porcentaje de avance **planificado** a la fecha de corte, en escala de 0 a 100 con hasta 2 "
    "decimales."
)
ACTUAL_PROGRESS_PERCENT = (
    "Porcentaje de avance **real** a la fecha de corte, en escala de 0 a 100 con hasta 2 decimales."
)
ACTUAL_COST = (
    "**AC**: costo real incurrido hasta la fecha de corte. Dinero con 2 decimales; puede ser 0 "
    "(una actividad sin gasto registrado es un estado legítimo)."
)

# --------------------------------------------------------------------------- EVM indicators
INDICATOR_BUDGET_AT_COMPLETION = (
    "**BAC**: presupuesto total. En el consolidado del proyecto es la suma de los BAC de sus "
    "actividades."
)
PLANNED_VALUE = (
    "**PV** = `%plan * BAC`: valor del trabajo que **debería** estar hecho a la fecha de corte."
)
EARNED_VALUE = (
    "**EV** = `%real * BAC`: valor del trabajo **realmente hecho**, medido a precio de "
    "presupuesto. Es el centro del método: todos los indicadores lo comparan con PV o con AC."
)
INDICATOR_ACTUAL_COST = "**AC**: costo real incurrido; lo que de verdad se pagó."
COST_VARIANCE = (
    "**CV** = `EV - AC`: responde *¿lo que hice vale más o menos de lo que pagué?*. "
    "Mayor que 0 es ahorro, 0 es exacto y menor que 0 es sobrecosto."
)
SCHEDULE_VARIANCE = (
    "**SV** = `EV - PV`: responde *¿hice más o menos de lo que debía a hoy?*. Mayor que 0 es "
    "adelanto, 0 es al día y menor que 0 es atraso. Se mide en dinero, no en días."
)
COST_PERFORMANCE_INDEX = (
    "**CPI** = `EV / AC`: responde *¿cuánto valor recibo por cada peso que gasto?*. Índice con 4 "
    "decimales; mayor que 1 es eficiente, 1 es en presupuesto y menor que 1 es sobre presupuesto. "
    "`null` cuando AC es 0, porque no es calculable."
)
SCHEDULE_PERFORMANCE_INDEX = (
    "**SPI** = `EV / PV`: responde *¿a qué ritmo avanzo respecto al plan?*. Índice con 4 "
    "decimales; mayor que 1 es adelantado, 1 es en cronograma y menor que 1 es atrasado. "
    "`null` cuando PV es 0, porque no es calculable."
)
ESTIMATE_AT_COMPLETION = (
    "**EAC** = `BAC / CPI`: responde *si sigo con esta eficiencia, ¿cuánto costará terminar "
    "todo?*. Dinero con 2 decimales; se calcula con el CPI sin redondear. `null` cuando el CPI "
    "es `null` o 0."
)
VARIANCE_AT_COMPLETION = (
    "**VAC** = `BAC - EAC`: responde *¿cuánto me voy a desviar del presupuesto al final?*. "
    "Mayor que 0 significa terminar por debajo del presupuesto y menor que 0, por encima. "
    "`null` cuando el EAC es `null`."
)
COST_STATUS = (
    "Lectura del CPI: `UNDER_BUDGET` (mayor que 1), `ON_BUDGET` (igual a 1), `OVER_BUDGET` "
    "(menor que 1) o `NOT_APPLICABLE` cuando el CPI no es calculable."
)
SCHEDULE_STATUS = (
    "Lectura del SPI: `AHEAD_OF_SCHEDULE` (mayor que 1), `ON_SCHEDULE` (igual a 1), "
    "`BEHIND_SCHEDULE` (menor que 1) o `NOT_APPLICABLE` cuando el SPI no es calculable."
)
NOTES = (
    "Motivos, en lenguaje natural, de cada indicador que no se pudo calcular. Vacío cuando todos "
    "son calculables."
)
