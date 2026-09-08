# Desafío técnico — Ingeniero de Desarrollo, Trycore Colombia

> Transcripción del PDF `Ingeniero de Desarrollo — Trycore Colombia.pdf` (5 páginas),
> extraída para poder trabajarla como texto. El PDF original es la fuente de verdad.

## Contexto

No les interesa si memorizas patrones de diseño ni si resuelves acertijos algorítmicos en
tiempo récord. Les interesa **cómo piensas** frente a un problema que no conoces, **cómo
tomas decisiones** cuando hay varias opciones válidas, y **cómo construyes software que
otra persona pueda entender y mantener**.

Plazo: **cinco días calendario**. Preguntar dudas bien formuladas suma.

## El problema

Herramienta interna para que los líderes de proyecto registren el avance de sus
actividades y entiendan, en tiempo real, si el proyecto va bien o mal en cronograma y
presupuesto. La metodología es **Earned Value Management (Valor Ganado)**, estándar del
PMI. Es intencional que no lo conozcas: hay que aprenderlo durante el desarrollo.

Idea central: no basta con saber cuánto has gastado ni cuánto has avanzado por separado;
lo que importa es la relación entre ambos. Gastar 60% del presupuesto habiendo completado
40% del trabajo es una señal de alerta.

## Qué debes construir

Aplicación fullstack que gestione proyectos y sus actividades y calcule automáticamente
los indicadores de Valor Ganado.

### Backend

API REST con operaciones para crear, editar y eliminar proyectos y actividades.

Cada actividad registra:

- Nombre
- Presupuesto total planificado (BAC — Budget at Completion)
- Porcentaje de avance planificado a la fecha de corte
- Porcentaje de avance real completado
- Costo real incurrido hasta la fecha (AC — Actual Cost)

Indicadores a calcular **por actividad y consolidados por proyecto**:

| Indicador | Fórmula |
|---|---|
| PV — Planned Value | % planificado × BAC |
| EV — Earned Value | % completado × BAC |
| CV — Cost Variance | EV − AC |
| SV — Schedule Variance | EV − PV |
| CPI — Cost Performance Index | EV / AC |
| SPI — Schedule Performance Index | EV / PV |
| EAC — Estimate at Completion | BAC / CPI |
| VAC — Variance at Completion | BAC − EAC |

El API también debe retornar la **interpretación** de CPI y SPI: bajo/sobre presupuesto,
adelantado/atrasado. CPI > 1 indica eficiencia en costos; CPI < 1 indica que se gasta más
de lo que se avanza. SPI aplica la misma lógica sobre el cronograma.

### Frontend

Dashboard donde el líder ingresa y edita actividades y ve el análisis en tiempo real:

- tabla de actividades con sus indicadores calculados
- indicadores consolidados del proyecto
- indicación visual del estado de CPI y SPI
- gráfica que compare PV, EV y AC por actividad

No piden diseño elaborado. Piden que la información sea clara y que quien la mire entienda
de un vistazo si el proyecto va bien o mal.

## Estándares obligatorios

**Pruebas unitarias.** Toda la lógica de cálculo EVM cubierta, incluidos casos borde: AC
igual a cero, sin actividades, avance real cero. Cobertura mínima **80% sobre la capa de
negocio**. Cada endpoint con al menos un **test de integración** que valide el contrato de
respuesta.

**Cero code smells.** Sin bloques comentados, sin variables sin usar, sin números o
strings mágicos. Nombres descriptivos. La lógica de negocio no vive en los controladores.
Una función que hace más de una cosa se divide. Lógica repetida más de dos veces se
abstrae. Recomiendan configurar un linter e incluir su configuración en el repositorio.

**Gitflow estricto.** El historial es parte de la entrega:

- `main` para producción
- `develop` como rama de integración
- ramas `feature/*` por cada funcionalidad
- al menos una rama `release/*` antes del merge final a `main`
- cada feature entra a `develop` mediante Pull Request, aunque trabajes solo
- commits descriptivos y en imperativo: `Add EVM calculation service`,
  `Fix CPI edge case when AC is zero`. Mensajes como `fix`, `cambios` o `wip` no se aceptan

**OpenAPI/Swagger.** Valorado positivamente. Si se implementa, accesible localmente en
`/api-docs` o `/swagger-ui`, con descripción por endpoint, esquemas de request y response,
y posibles códigos de error.

## Stack

Usa el stack que mejor domines. Preferencia: Java con Spring Boot o Python con FastAPI en
backend, base de datos relacional (PostgreSQL idealmente), Angular o React en frontend.
Si eliges algo diferente, hay que explicar por qué en el documento de proceso.

## Los tres entregables

### 1. El repositorio

En GitHub o GitLab — no aceptan comprimidos porque necesitan ver el historial de commits.
Debe incluir `README.md` con instrucciones para correr el proyecto localmente y el script
de inicialización de la base de datos.

### 2. El documento AI_PROCESS.md

Tan importante como el código. Debe incluir:

- Las herramientas de IA que usaste y por qué elegiste esas.
- **Todos los prompts que enviaste, copiados textualmente y en orden cronológico** — sin
  resumir ni parafrasear.
- Cómo aprendiste EVM: qué le preguntaste a la IA, cómo validaste que entendiste las
  fórmulas antes de implementarlas.
- **Dos decisiones donde no seguiste lo que la IA sugirió**, explicando qué propuso y por
  qué tomaste otro camino. Cómo verificaste que los cálculos son correctos: no solo que el
  código funciona, sino que los números tienen sentido.
- Una decisión de arquitectura tomada de forma independiente.
- Una reflexión honesta sobre qué harías diferente si repitieras el ejercicio.

No esperan un documento perfecto. Esperan uno honesto.

### 3. El video

- Máximo diez minutos, grabando pantalla, sin edición elaborada.
- Explicar con tus propias palabras qué es el Valor Ganado y cómo funciona, como si se lo
  explicaras a un colega que nunca lo ha escuchado.
- Luego: la arquitectura de la solución, una decisión técnica difícil, una demo con al
  menos **un proyecto y tres actividades**, y cómo se ve tu flujo de trabajo con IA en el
  documento de proceso.

La fluidez al explicar algo aprendido durante el ejercicio les dice más que cualquier
algoritmo memorizado.

## Cómo evalúan

> El mayor peso de la evaluación está en **el video y en el documento de proceso, no en el
> código**. Un código impecable producido sin comprensión real vale menos que un código
> más modesto respaldado por razonamiento claro.

Buscan un ingeniero que use la IA para pensar mejor, no para evitar pensar; que sepa
cuándo la IA tiene razón y cuándo no; que escriba código legible y mantenible; que
entienda lo que construyó lo suficientemente bien como para explicarlo sin leer.

No quieren ver: un documento de proceso genérico escrito después del hecho, un video donde
el candidato lee en lugar de explicar, o pruebas unitarias que solo verifican que las
funciones retornan algo.

## Pendiente administrativo

Queda pendiente **confirmar la recepción del documento** al equipo de Trycore.
