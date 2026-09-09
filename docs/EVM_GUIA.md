# Earned Value Management (Valor Ganado) — guía para entenderlo y explicarlo

Este documento tiene dos objetivos:

1. Que puedas **explicar EVM en el video sin leer**: la idea, el significado de cada
   indicador y por qué funciona.
2. Servir de **oráculo para las pruebas**: el ejemplo de tres actividades está resuelto a
   mano, número por número, para que los tests unitarios se verifiquen contra él.

---

## 1. La idea en una frase

> Valor Ganado responde a una sola pregunta: **¿lo que he gastado y el tiempo que ha pasado
> se corresponden con el trabajo que realmente he terminado?**

Mirar el gasto solo, o el avance solo, engaña. Un proyecto que gastó el 60 % del presupuesto
parece "normal" si vas por la mitad del cronograma. Pero si solo completó el 40 % del
trabajo, ese 60 % es una alarma. EVM pone las tres cosas (plan, trabajo hecho, dinero
gastado) **en la misma unidad: dinero**, para poder compararlas.

### Analogía para el video

Contratas a alguien para construir una casa por **100 millones** en **10 meses**. Vas a
mirar la obra en el mes 5.

- El plan decía que al mes 5 debía estar el 50 % de la casa. Ese 50 % "vale" 50 millones.
  Eso es el **Valor Planificado (PV)**: lo que *debería* estar hecho, en plata.
- Caminas la obra y solo está el 40 %. Según el presupuesto, ese 40 % vale 40 millones. Eso
  es el **Valor Ganado (EV)**: lo que *sí* está hecho, en plata del presupuesto.
- Revisas las facturas: ya pagaste 60 millones. Eso es el **Costo Real (AC)**: lo que
  *salió* de tu bolsillo.

Con esos tres números ya sabes todo: hiciste menos de lo planeado (40 < 50, vas atrasado) y
pagaste más de lo que vale lo hecho (60 > 40, vas sobre presupuesto). El resto de EVM son
formas de cuantificar eso.

---

## 2. Los tres valores base

Cada actividad registra cinco datos de entrada:

| Dato | Símbolo | Qué es |
|---|---|---|
| Presupuesto total planificado | **BAC** (Budget at Completion) | Cuánto debería costar la actividad completa, al 100 %. |
| % de avance planificado a la fecha de corte | %plan | Qué porcentaje del trabajo *debería* estar hecho hoy según el cronograma. |
| % de avance real | %real | Qué porcentaje del trabajo *está* hecho hoy. |
| Costo real incurrido | **AC** (Actual Cost) | Cuánto dinero se ha gastado hasta hoy en esa actividad. |
| Nombre | — | Identificación. |

Con eso se construyen los tres valores base:

### PV — Planned Value (Valor Planificado)

```
PV = %plan × BAC
```

"Cuánto trabajo debería haber hecho a hoy, expresado en dinero." No tiene nada que ver con
lo gastado; sale del plan. Si la actividad cuesta 10 000 y a hoy debía ir al 50 %, PV = 5 000.

### EV — Earned Value (Valor Ganado)

```
EV = %real × BAC
```

"Cuánto trabajo he hecho de verdad, expresado en dinero **del presupuesto**." Si hice el
40 % de una actividad de 10 000, gané 4 000 de valor. **Sin importar lo que pagué por ese
40 %.**

### AC — Actual Cost (Costo Real)

```
AC = lo que dice la contabilidad
```

Es un dato de entrada, no se calcula. Cuánto dinero salió realmente.

### Por qué EV **no** es el dinero gastado

Esta es la confusión más común y la pregunta que probablemente te hagan.

- **AC** mide **esfuerzo/dinero consumido**. Se lo lleva el contador.
- **EV** mide **resultado producido**, valorado al precio que el plan le asignó a ese
  resultado. Se lo lleva quien inspecciona la obra.

Ejemplo directo: una actividad de BAC = 10 000. Hiciste el 40 %, gastaste 6 000.

- EV = 0.40 × 10 000 = **4 000**. El trabajo hecho "vale" 4 000 según el plan.
- AC = **6 000**. Pagaste 6 000 por conseguir trabajo que valía 4 000.

Si EV fuera igual al gasto, jamás podrías detectar ineficiencia: siempre "habrías ganado"
exactamente lo que pagaste. EV existe precisamente para tener algo contra qué comparar el
gasto. Frase para el video: **"AC es lo que pagué; EV es lo que recibí a cambio, medido con
la regla del presupuesto."**

---

## 3. Los indicadores derivados

Todos comparan EV con PV (cronograma) o EV con AC (costo). Fíjate que **EV está en todas**:
es el centro del método.

### Varianzas (en dinero: "cuánto")

| Indicador | Fórmula | Pregunta que responde | Lectura |
|---|---|---|---|
| **CV** — Cost Variance | `EV − AC` | ¿Lo que hice vale más o menos de lo que pagué? | > 0 ahorro · = 0 exacto · < 0 sobrecosto |
| **SV** — Schedule Variance | `EV − PV` | ¿Hice más o menos de lo que debía a hoy? | > 0 adelantado · = 0 al día · < 0 atrasado |

Truco: en ambas **EV va primero**; positivo = bueno, negativo = malo. SV se mide en dinero,
no en días, porque toda la metodología convierte el trabajo a dinero.

### Índices (relativos: "qué tan grave")

| Indicador | Fórmula | Pregunta que responde | Lectura |
|---|---|---|---|
| **CPI** — Cost Performance Index | `EV / AC` | ¿Cuánto valor recibo por cada peso que gasto? | > 1 bajo presupuesto (eficiente) · = 1 en presupuesto · < 1 sobre presupuesto |
| **SPI** — Schedule Performance Index | `EV / PV` | ¿A qué ritmo avanzo respecto al plan? | > 1 adelantado · = 1 en cronograma · < 1 atrasado |

Por qué existen si ya tengo CV y SV: una varianza de −4 000 es grave en una actividad de
10 000 y trivial en una de 4 000 000. El índice normaliza. CPI = 0.8 significa "por cada
peso que gasto, recibo 80 centavos de trabajo". SPI = 0.8 significa "avanzo al 80 % del
ritmo planeado".

Interpretación que el API debe devolver:

| Valor | CPI | SPI |
|---|---|---|
| > 1 | Bajo presupuesto | Adelantado |
| = 1 | En presupuesto | En cronograma |
| < 1 | Sobre presupuesto | Atrasado |
| no calculable | No aplica (ver casos borde) | No aplica (ver casos borde) |

### Pronósticos (hacia el futuro: "en qué va a terminar")

| Indicador | Fórmula | Pregunta que responde | Lectura |
|---|---|---|---|
| **EAC** — Estimate at Completion | `BAC / CPI` | Si sigo con esta eficiencia, ¿cuánto me costará terminar todo? | Compararlo con BAC |
| **VAC** — Variance at Completion | `BAC − EAC` | ¿Cuánto me voy a desviar del presupuesto al final? | > 0 terminaré por debajo · < 0 terminaré por encima |

Intuición de EAC: si mi CPI es 0.8, cada peso de presupuesto me está costando 1/0.8 = 1.25
pesos reales. Entonces todo el presupuesto (BAC) me costará BAC × 1.25 = BAC / 0.8.

Hay otras fórmulas de EAC en la literatura del PMI (por ejemplo `AC + (BAC − EV)`, que asume
que el resto del trabajo irá según plan). **El reto fija `EAC = BAC / CPI`**, que asume que
la eficiencia actual se mantiene. Es la que se implementa. Dato útil para verificar: `BAC /
CPI` es algebraicamente igual a `AC + (BAC − EV) / CPI`; sirve como comprobación cruzada.

---

## 4. Consolidado por proyecto: se suman valores, **no** índices

Regla de oro: para el proyecto se **suman los valores en dinero** de todas las actividades y
sobre esas sumas se recalculan varianzas, índices y pronósticos.

```
BAC_proyecto = Σ BAC_i          PV_proyecto = Σ PV_i
EV_proyecto  = Σ EV_i           AC_proyecto = Σ AC_i

CV  = EV_p − AC_p               SV  = EV_p − PV_p
CPI = EV_p / AC_p               SPI = EV_p / PV_p
EAC = BAC_p / CPI               VAC = BAC_p − EAC
```

**Nunca se promedian los CPI ni los SPI de las actividades.** Un promedio simple le daría el
mismo peso a una actividad de 1 000 que a una de 1 000 000. Al sumar dinero, cada actividad
pesa lo que cuesta. En el ejemplo de la sección 6 se ve cómo el promedio de CPI diría que el
proyecto va bien cuando en realidad va mal.

Nota: el % de avance del proyecto **no** es un dato de entrada; si se quiere mostrar, se
deriva: `%plan_p = PV_p / BAC_p` y `%real_p = EV_p / BAC_p`.

---

## 5. Casos borde (los que rompen las divisiones)

Todas las divisiones son `EV / AC`, `EV / PV` y `BAC / CPI`. Cualquier denominador en cero
es un caso borde. Decisión de diseño adoptada: **cuando un indicador no es matemáticamente
calculable, el API devuelve `null` en el número y una interpretación explícita de "no
aplica" con su motivo**. No se inventan valores (ni 0, ni 1, ni infinito), porque cualquiera
de ellos se leería como un dato real y engañaría al líder de proyecto.

### 5.1 AC = 0 con avance (EV > 0): trabajo hecho sin costo registrado

Ejemplo: BAC = 1 000, %plan = 50, %real = 20, AC = 0.

- PV = 500 · EV = 200 · CV = 200 · SV = −300 · SPI = 0.4 (atrasado)
- CPI = 200 / 0 → **no calculable** (`null`). Matemáticamente tendería a infinito
  ("eficiencia infinita"), lo cual es absurdo: casi siempre significa que los costos aún no
  se han cargado.
- EAC = BAC / CPI → **no calculable**. VAC → **no calculable**.
- Interpretación de costo: **"No aplica: sin costo registrado"**.

Qué decir en el video: "Si aún no hay facturas, no puedo opinar sobre la eficiencia del
gasto; sí puedo opinar sobre el cronograma."

### 5.2 AC = 0 y EV = 0: actividad no iniciada

Ejemplo: BAC = 1 000, %plan = 0, %real = 0, AC = 0.

- PV = 0 · EV = 0 · CV = 0 · SV = 0
- CPI = 0 / 0 → `null` · SPI = 0 / 0 → `null` · EAC → `null` · VAC → `null`
- Interpretación: **"No aplica: actividad no iniciada"** en costo y cronograma.

Variante: %plan = 30 pero %real = 0 y AC = 0. Entonces PV = 300, SV = −300, **SPI = 0 /
300 = 0 → atrasado** (se calcula, es cero legítimo). CPI sigue siendo `null` (0/0).

### 5.3 Avance real = 0 con gasto (EV = 0, AC > 0): se gastó sin producir nada

Ejemplo: BAC = 1 000, %plan = 30, %real = 0, AC = 150.

- PV = 300 · EV = 0 · CV = −150 · SV = −300
- CPI = 0 / 150 = **0** → sobre presupuesto (es un número válido, el peor posible).
- SPI = 0 / 300 = **0** → atrasado.
- EAC = 1 000 / 0 → **no calculable** (`null`). Con eficiencia cero, el pronóstico es "nunca
  termina"; devolver infinito no aporta. VAC → `null`.
- Interpretación: costo **"Sobre presupuesto"**, cronograma **"Atrasado"**, EAC **"No
  aplica: sin avance real, no se puede proyectar"**.

### 5.4 PV = 0 con avance (EV > 0): trabajo adelantado a lo programado

Ejemplo: BAC = 1 000, %plan = 0, %real = 10, AC = 80.

- PV = 0 · EV = 100 · AC = 80 · CV = 20 · SV = +100
- CPI = 100 / 80 = 1.25 → bajo presupuesto · EAC = 800 · VAC = 200
- SPI = 100 / 0 → `null`. Interpretación de cronograma: **"No aplica: actividad no
  programada a la fecha de corte"**. El SV positivo ya cuenta la historia (va adelantada).

### 5.5 Proyecto sin actividades

- BAC = PV = EV = AC = 0 · CV = SV = 0
- CPI, SPI, EAC, VAC → `null`
- Interpretación: **"Sin datos: el proyecto no tiene actividades"**.
- La lista de actividades vuelve vacía (`[]`), nunca error 404 ni 500.

### 5.6 BAC = 0

Una actividad con presupuesto cero produce PV = EV = 0 sin importar los porcentajes; cae en
5.2 o 5.3 según AC. Recomendación: **validar BAC > 0 en la entrada** y rechazarla con 400.
Sí se aceptan AC = 0 y porcentajes 0, que son estados legítimos.

### 5.7 Actividad terminada (100 %) con sobrecosto

BAC = 1 000, %plan = 100, %real = 100, AC = 1 200.

- PV = EV = 1 000 · CV = −200 · SV = 0 · CPI = 0.8333 · SPI = 1 (en cronograma)
- EAC = 1 000 / 0.8333… = **1 200 = AC**. Comprobación de cordura: si ya terminó, el costo
  estimado al terminar es exactamente lo que costó. VAC = −200.

### 5.8 Índice exactamente igual a 1

CPI = 1 → "En presupuesto"; SPI = 1 → "En cronograma". La comparación con 1 se hace sobre el
valor **redondeado a 4 decimales**, para que 0.99999999 por ruido de coma flotante no salga
como "sobre presupuesto".

### Resumen para los tests de casos borde

| Caso | BAC | %plan | %real | AC | PV | EV | CV | SV | CPI | SPI | EAC | VAC | Costo | Cronograma |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5.1 sin costo | 1 000 | 50 | 20 | 0 | 500 | 200 | 200 | −300 | null | 0.4 | null | null | No aplica | Atrasado |
| 5.2 no iniciada | 1 000 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | null | null | null | null | No aplica | No aplica |
| 5.2 var. | 1 000 | 30 | 0 | 0 | 300 | 0 | 0 | −300 | null | 0 | null | null | No aplica | Atrasado |
| 5.3 gasto sin avance | 1 000 | 30 | 0 | 150 | 300 | 0 | −150 | −300 | 0 | 0 | null | null | Sobre presupuesto | Atrasado |
| 5.4 no programada | 1 000 | 0 | 10 | 80 | 0 | 100 | 20 | 100 | 1.25 | null | 800 | 200 | Bajo presupuesto | No aplica |
| 5.7 terminada | 1 000 | 100 | 100 | 1 200 | 1 000 | 1 000 | −200 | 0 | 0.8333 | 1 | 1 200 | −200 | Sobre presupuesto | En cronograma |
| 5.5 sin actividades | 0 | — | — | 0 | 0 | 0 | 0 | 0 | null | null | null | null | Sin datos | Sin datos |

---

## 6. Ejemplo completo con tres actividades, resuelto paso a paso

Proyecto **"Portal de clientes"**, fecha de corte: hoy. Este es el proyecto que debe usarse en
la demo del video (pide al menos un proyecto con tres actividades) y en las pruebas.

### 6.1 Datos de entrada

| # | Actividad | BAC | %plan | %real | AC |
|---|---|---|---|---|---|
| 1 | Diseño | 10 000 | 100 % | 100 % | 9 000 |
| 2 | Desarrollo | 40 000 | 50 % | 40 % | 20 000 |
| 3 | Pruebas | 10 000 | 20 % | 30 % | 2 500 |

Lectura intuitiva antes de calcular (esto es lo que un buen líder "ve" sin fórmulas):

- Diseño: terminó y costó menos de lo presupuestado. Bien.
- Desarrollo: debía ir a la mitad y va al 40 %; además ya gastó la mitad del presupuesto
  habiendo hecho solo el 40 %. Atrasado **y** caro. Es la actividad grande, así que arrastra
  al proyecto.
- Pruebas: arrancó antes de lo planeado y barato. Bien.

Ahora comprobamos que los números dicen lo mismo.

### 6.2 Actividad 1 — Diseño

```
PV  = 1.00 × 10 000 = 10 000
EV  = 1.00 × 10 000 = 10 000
AC  = 9 000
CV  = EV − AC = 10 000 − 9 000 = 1 000        (> 0: ahorro)
SV  = EV − PV = 10 000 − 10 000 = 0           (= 0: al día)
CPI = EV / AC = 10 000 / 9 000 = 1.1111       (> 1: bajo presupuesto)
SPI = EV / PV = 10 000 / 10 000 = 1.0000      (= 1: en cronograma)
EAC = BAC / CPI = 10 000 / 1.1111… = 9 000    (igual a AC: ya terminó, lógico)
VAC = BAC − EAC = 10 000 − 9 000 = 1 000
```

### 6.3 Actividad 2 — Desarrollo

```
PV  = 0.50 × 40 000 = 20 000
EV  = 0.40 × 40 000 = 16 000
AC  = 20 000
CV  = 16 000 − 20 000 = −4 000                (< 0: sobrecosto)
SV  = 16 000 − 20 000 = −4 000                (< 0: atrasado)
CPI = 16 000 / 20 000 = 0.8000                (< 1: sobre presupuesto)
SPI = 16 000 / 20 000 = 0.8000                (< 1: atrasado)
EAC = 40 000 / 0.8 = 50 000                   (costará 10 000 más de lo previsto)
VAC = 40 000 − 50 000 = −10 000
```

Lectura: por cada peso gastado recibe 80 centavos de trabajo, y avanza al 80 % del ritmo
planeado. Si sigue así, la actividad costará 50 000 en vez de 40 000.

### 6.4 Actividad 3 — Pruebas

```
PV  = 0.20 × 10 000 = 2 000
EV  = 0.30 × 10 000 = 3 000
AC  = 2 500
CV  = 3 000 − 2 500 = 500                     (> 0: ahorro)
SV  = 3 000 − 2 000 = 1 000                   (> 0: adelantado)
CPI = 3 000 / 2 500 = 1.2000                  (> 1: bajo presupuesto)
SPI = 3 000 / 2 000 = 1.5000                  (> 1: adelantado)
EAC = 10 000 / 1.2 = 8 333.33
VAC = 10 000 − 8 333.33 = 1 666.67
```

### 6.5 Tabla por actividad (valores esperados para los tests)

| Actividad | PV | EV | AC | CV | SV | CPI | SPI | EAC | VAC | Costo | Cronograma |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Diseño | 10 000.00 | 10 000.00 | 9 000.00 | 1 000.00 | 0.00 | 1.1111 | 1.0000 | 9 000.00 | 1 000.00 | Bajo presupuesto | En cronograma |
| Desarrollo | 20 000.00 | 16 000.00 | 20 000.00 | −4 000.00 | −4 000.00 | 0.8000 | 0.8000 | 50 000.00 | −10 000.00 | Sobre presupuesto | Atrasado |
| Pruebas | 2 000.00 | 3 000.00 | 2 500.00 | 500.00 | 1 000.00 | 1.2000 | 1.5000 | 8 333.33 | 1 666.67 | Bajo presupuesto | Adelantado |

### 6.6 Consolidado del proyecto

Paso 1: sumar los valores en dinero.

```
BAC_p = 10 000 + 40 000 + 10 000 = 60 000
PV_p  = 10 000 + 20 000 +  2 000 = 32 000
EV_p  = 10 000 + 16 000 +  3 000 = 29 000
AC_p  =  9 000 + 20 000 +  2 500 = 31 500
```

Paso 2: recalcular sobre las sumas.

```
CV  = 29 000 − 31 500 = −2 500                (sobrecosto)
SV  = 29 000 − 32 000 = −3 000                (atrasado)
CPI = 29 000 / 31 500 = 0.920634… → 0.9206    (sobre presupuesto)
SPI = 29 000 / 32 000 = 0.90625   → 0.9063    (atrasado)
EAC = 60 000 / 0.920634… = 65 172.413… → 65 172.41
VAC = 60 000 − 65 172.41 = −5 172.41
```

Comprobación cruzada de EAC con la forma alternativa:
`AC + (BAC − EV) / CPI = 31 500 + (60 000 − 29 000) / 0.920634… = 31 500 + 33 672.41 =
65 172.41`. Coincide.

Sin redondeos intermedios, `EAC = BAC × AC / EV = 60 000 × 31 500 / 29 000 = 65 172.4138`.
Esa es la forma más precisa de obtener el valor esperado en un test.

| Proyecto | BAC | PV | EV | AC | CV | SV | CPI | SPI | EAC | VAC | Costo | Cronograma |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Portal de clientes | 60 000.00 | 32 000.00 | 29 000.00 | 31 500.00 | −2 500.00 | −3 000.00 | 0.9206 | 0.9063 | 65 172.41 | −5 172.41 | Sobre presupuesto | Atrasado |

### 6.7 Por qué no se promedian los índices (demostración)

Si alguien promediara los CPI de las actividades:

```
(1.1111 + 0.8000 + 1.2000) / 3 = 1.0370  → "bajo presupuesto"  ✗
```

Diría que el proyecto va bien. Pero el consolidado real es CPI = 0.9206: va **mal**. La razón
es que Desarrollo pesa 40 000 de los 60 000 (dos tercios del proyecto) y el promedio simple
la trata igual que las otras dos. Sumar dinero respeta el peso de cada actividad. Este es un
buen ejemplo para la sección de "decisión difícil" o "verificación de que los números
tienen sentido" en el video.

### 6.8 Lectura ejecutiva del proyecto (lo que ve el líder)

- Va **atrasado**: hizo 29 000 de trabajo cuando debía llevar 32 000 (SPI 0.91, un 9 % más
  lento que el plan).
- Va **sobre presupuesto**: pagó 31 500 por trabajo que vale 29 000 (CPI 0.92; cada peso
  rinde 92 centavos).
- Si no corrige, terminará costando **65 172** en lugar de 60 000: **5 172 por encima**.
- La causa está en **Desarrollo**; Diseño y Pruebas están sanas.

---

## 7. Convenciones numéricas para la implementación y los tests

- **Porcentajes**: el usuario los ingresa de 0 a 100. Internamente se convierten a fracción
  (`/ 100`) antes de multiplicar por BAC. Validar `0 ≤ % ≤ 100`.
- **Dinero** (BAC, AC, PV, EV, CV, SV, EAC, VAC): tipo decimal exacto (`Decimal` /
  `BigDecimal` / `NUMERIC`), nunca `float` binario. Se presenta con **2 decimales**.
- **Índices** (CPI, SPI): **4 decimales**.
- **Redondeo**: *half up* (0.90625 → 0.9063). Con *banker's rounding* saldría 0.9062, así que
  el modo debe fijarse explícitamente en el código y en los tests.
- **Cuándo redondear**: solo al final, al construir la respuesta. Los cálculos intermedios
  (en particular EAC = BAC / CPI) se hacen con el CPI sin redondear. Por eso la tabla del
  proyecto muestra CPI 0.9206 pero EAC 65 172.41 y no 60 000 / 0.9206 = 65 174.89.
- **No calculable**: `null` en el valor numérico más una interpretación explícita.
- En los tests, comparar dinero con exactitud a 2 decimales e índices a 4; si el lenguaje
  obliga a `float`, usar tolerancia `1e-9` sobre el valor sin redondear.

---

## 8. Guion mental para el video (sin leer)

Tres preguntas, en este orden, con la casa de la analogía:

1. **¿Cuánto debía haber hecho hoy?** → PV. Sale del plan.
2. **¿Cuánto hice de verdad, medido con la plata del plan?** → EV. Sale de la inspección.
3. **¿Cuánto gasté?** → AC. Sale de las facturas.

Luego dos comparaciones:

- **EV contra PV** → cronograma (SV en dinero, SPI en ritmo).
- **EV contra AC** → costo (CV en dinero, CPI en eficiencia).

Y una proyección: **si sigo con esta eficiencia, ¿en cuánto termino?** → EAC = BAC / CPI, y
VAC es la diferencia con lo presupuestado.

Cierre: "El proyecto consolida sumando plata, no promediando índices, porque una actividad
grande pesa más que una pequeña. Y cuando algo no se puede dividir, el sistema lo dice en
vez de inventar un número."

---

## 9. Los proyectos de demostración: un caso por proyecto

El script de inicialización de la base de datos (`backend/db/init.sql`) carga ocho proyectos
elegidos para que cada uno muestre una situación distinta. Al levantar la aplicación se pueden
abrir uno por uno y comprobar la teoría contra la pantalla, sin teclear datos.

| Proyecto | Caso que ilustra | CPI | SPI | Lectura |
|---|---|---|---|---|
| Portal de clientes | El ejemplo de §6, resuelto a mano en este documento | 0.9206 | 0.9063 | Sobre presupuesto y atrasado |
| Migración a la nube | Los dos indicadores por encima de 1 | 1.1636 | 1.1130 | Bajo presupuesto y adelantado |
| Integración de pagos | CPI < 1 con SPI > 1 | 0.7712 | 1.3000 | Adelantado pero caro |
| Rediseño del intranet | CPI > 1 con SPI < 1 | 1.2136 | 0.7353 | Barato pero atrasado |
| Cumplimiento normativo | Índices exactamente en 1 (§5.8) | 1.0000 | 1.0000 | En presupuesto y en cronograma |
| App móvil de campo | Los casos borde de §5.1 a §5.4 en sus cuatro actividades | 1.8125 | 0.3452 | Ver la advertencia de abajo |
| Certificación ISO 27001 | Actividad terminada con sobrecosto (§5.7) | 0.8929 | 1.0000 | Terminado a tiempo, EAC = AC = 56 000 |
| Tablero de indicadores | Proyecto sin actividades (§5.5) | no calculable | no calculable | Sin datos que evaluar |

### Los dos que enseñan más

**Rediseño del intranet** es la razón de ser de EVM. Gastó 10 300 de un presupuesto de 30 000 y
su CPI es 1.21: por el gasto solo, parece un proyecto ejemplar. Pero debía llevar 17 000 de
trabajo hecho y solo lleva 12 500, así que su SPI es 0.74. **El ahorro no viene de eficiencia,
viene de no haber hecho el trabajo.** Es exactamente el error que EVM evita: mirar el dinero
gastado sin compararlo con lo producido.

**App móvil de campo** enseña lo contrario: cómo un indicador puede engañar incluso siendo
correcto. Su CPI consolidado es 1.81, el mejor de los ocho, y no significa nada bueno: el
proyecto apenas arrancó y casi no tiene costos cargados (AC total de 1 600 sobre un presupuesto
de 43 000). Sus cuatro actividades muestran los casos borde uno al lado del otro:

| Actividad | Situación | CPI | SPI | EAC |
|---|---|---|---|---|
| Diseño de pantallas | Hay avance pero aún no hay facturas (§5.1) | no calculable | 0.4000 | no calculable |
| Backend de sincronización | No iniciada (§5.2) | no calculable | no calculable | no calculable |
| Pruebas en campo | Se gastó sin producir nada (§5.3) | 0.0000 | 0.0000 | no calculable |
| Publicación en tiendas | Trabajo adelantado a lo programado (§5.4) | 1.2500 | no calculable | 4 000.00 |

Y muestra la decisión de diseño: donde el indicador no es calculable, el API devuelve `null` con
el motivo en `notes` ("No aplica: sin costo registrado", "No aplica: actividad no iniciada"…) en
lugar de un cero que se leería como un dato real.

**Para el video:** abrir *Rediseño del intranet* después de *Portal de clientes* es la forma más
rápida de explicar por qué no basta con mirar el gasto, y *App móvil de campo* es la forma más
rápida de explicar por qué el sistema dice "no aplica" en vez de inventar un número.
