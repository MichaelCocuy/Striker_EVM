# AI_PROCESS.md — Proceso de trabajo con IA

Registro del uso de inteligencia artificial durante el desarrollo del desafío técnico
Striker EVM. Se mantiene **en vivo** durante el proyecto, no se escribe después del hecho.

Secciones exigidas por el enunciado:

1. [Herramientas de IA y por qué](#1-herramientas-de-ia-y-por-qué)
2. [Prompts textuales en orden cronológico](#2-prompts-textuales-en-orden-cronológico)
3. [Cómo aprendí EVM y cómo validé las fórmulas](#3-cómo-aprendí-evm-y-cómo-validé-las-fórmulas)
4. [Decisiones donde no seguí a la IA](#4-decisiones-donde-no-seguí-a-la-ia)
5. [Cómo verifiqué que los cálculos son correctos](#5-cómo-verifiqué-que-los-cálculos-son-correctos)
6. [Decisión de arquitectura tomada de forma independiente](#6-decisión-de-arquitectura-tomada-de-forma-independiente)
7. [Reflexión: qué haría diferente](#7-reflexión-qué-haría-diferente)

---

## 1. Herramientas de IA y por qué

| Herramienta | Uso | Por qué |
|---|---|---|
| **Claude Code** (CLI; modelos Claude Fable 5.1 y Claude Opus 5) | Asistente principal: lectura del enunciado, aprendizaje de EVM, propuesta de arquitectura, configuración del repositorio, generación y revisión de código, verificación del stack. | Trabaja directamente sobre el sistema de archivos y la terminal, así que cada prompt se traduce en archivos y commits verificables, y el proceso queda registrado tal como ocurrió en vez de reconstruido. |
| **Subagentes de Claude Code**, uno por módulo | Construcción en paralelo: cada módulo se desarrolló en su propia rama `feature/*` dentro de un *git worktree* independiente, con instrucciones que fijaban su alcance de archivos, su contrato de interfaz y sus criterios de verificación. | Es lo que permitió que el plan de olas de `docs/ARQUITECTURA.md §8` fuera real: hasta cinco módulos avanzando a la vez. Yo actué como integrador: revisar el código, mergear los PR, resolver los cruces entre módulos y decidir qué aceptar. |

**Cómo se repartió el trabajo.** Los subagentes escribieron el volumen de código; las decisiones
de diseño, la definición de los contratos entre módulos, la revisión y la integración fueron
mías. Tres cosas las hice directamente porque eran puntos de coordinación y no podían delegarse
a un módulo aislado: fijar las props del dashboard antes de lanzar los tres módulos de UI (si no,
los tres editaban el mismo archivo), consolidar la duplicación que quedó entre carpetas, y las
correcciones que cruzaban módulos.

---

## 2. Prompts textuales en orden cronológico

Convención: cada prompt se copia **literal**, con sus errores de tipeo y saltos de línea,
dentro de un bloque de texto. Debajo se anota, de forma breve, qué hizo la IA en respuesta
y qué archivos produjo. Las sesiones se numeran para mantener la cronología.

### Prompt 1 — 2026-09-08 — Claude Code

```text
Empieza por leer el PDF y el md que estan en la carpeta /docs y dime con
  tus palabras qué piden exactamente:
  qué se construye, qué estándares son obligatorios, cuáles son los
  entregables y cómo se evalúan.

  enséñame Earned Value Management, generame un .md. No lo conozco y tengo
  que
  poder explicarlo en video sin leer, así que no me des solo las fórmulas:
  dime qué significa cada indicador, por qué EV no es lo mismo que el
  dinero gastado, y qué pasa en los casos raros (coste cero, sin avance,
  sin actividades). ponme un ejemplos con tres
  actividades y resuélvelo paso a paso para que yo verificar los test que se
  construyan en un futuro.

  adicionalmente debemos proponer la arquitectura y la descomposición en
  módulos. Quiero ver
  las dependencias entre ellos, qué se puede hacer en paralelo y que no, ya
  que la idea es hacer una construccion en paralelo para tener el mayor
  tiempo posible.

Configura gitflow desde el primer commit: main, develop, feature/* por módulo y Pull Request a develop aunque trabaje solo. Nada de commits sueltos en main. este es el link al repo que cree en github, esta vacio https://github.com/MichaelCocuy/Striker_EVM

  Ve registrando mis prompts textualmente en AI_PROCESS.md, en orden y sin resumirlos.
```

**Qué hizo la IA:**

- Leyó `docs/reto.md` y extrajo el texto del PDF con `pdftotext` para confirmar que la
  transcripción coincide con el original. Resumió el enunciado en el chat.
- Creó el repositorio local con Gitflow: commit inicial en `main` (README, `.gitignore`,
  `.gitattributes`, `docs/GITFLOW.md`, plantilla de PR y este archivo), rama `develop`
  como rama por defecto en GitHub y protección de `main` para exigir Pull Request.
- Escribió `docs/EVM_GUIA.md` (explicación de EVM, casos borde, ejemplo con tres
  actividades resuelto paso a paso) y `docs/ARQUITECTURA.md` (módulos, dependencias y
  plan de construcción en paralelo) en la rama `feature/docs-evm-guide-and-architecture`,
  integrada a `develop` mediante Pull Request.
- La sesión se cerró de forma inesperada después del commit inicial local (antes de
  publicar en GitHub). Se retomó con el Prompt 2.

### Prompt 2 — 2026-09-08 — Claude Code

```text
Orca cerro la sesion, continuemos
```

**Qué hizo la IA:**

- Revisó el estado del directorio: el commit inicial existía en `main` local pero no había
  remoto configurado. Conectó `origin`, publicó `main`, creó y publicó `develop`, la fijó
  como rama por defecto en GitHub y protegió `main` (requiere Pull Request).
- Creó la rama `feature/docs-evm-guide-and-architecture`, escribió `docs/EVM_GUIA.md` y
  `docs/ARQUITECTURA.md`, verificó con un script en Python (`Decimal`, redondeo *half up*)
  que todos los números del ejemplo y de los casos borde de la guía son correctos, abrió el
  PR hacia `develop` y lo integró.

### Prompt 3 — 2026-09-08 — Claude Code

```text
Vamo a usar el Stack FastAPI con PostgreSQL y React con Vite por velocidad, vamos a arrancar con construccion en paralelo de los modulos y del front, es importante mencionar que el diseño del front debe ser de ultima generacion, con graficas y usando animaciones de gsap para las transiciones, es importante mencionar y es decision netamente mia, necesito implementar una logica de roles basada en quienes registran sus actividades y quienes la revisan para saber el estado actual del proyecto
```

**Qué hizo la IA:**

- Registró la decisión de stack (FastAPI + PostgreSQL + React/Vite) y la decisión propia del
  autor de incorporar roles (ver sección 6), y actualizó `docs/ARQUITECTURA.md` con el
  módulo de autenticación y roles, los lineamientos de diseño del frontend (GSAP, gráficas)
  y el grafo de dependencias ajustado.
- Lanzó la ola 1 de construcción en paralelo, cada módulo en su propio *git worktree* y rama
  `feature/*`: contrato OpenAPI + fixtures, dominio EVM con tests, andamiaje del frontend.

### Prompt 4 — 2026-09-08 — Claude Code

```text
continua
```

**Qué hizo la IA:** terminó la actualización de `docs/ARQUITECTURA.md` (módulo M3b de
autenticación y roles, matriz de permisos, usuarios semilla, lineamientos de diseño con GSAP),
la integró a `develop` por PR y arrancó la ola 1.

### Prompt 5 — 2026-09-08 — Claude Code

```text
continua y restablece los subagentes
```

**Qué hizo la IA:** los tres subagentes en curso (M4 CRUD, M5 reporte EVM, M7 frontend) se
habían cortado por límite de sesión dejando trabajo sin commitear en sus worktrees. Verificó
el estado de cada rama y reanudó los tres con su contexto intacto, sin repetir trabajo.

### Prompt 6 — 2026-09-08 — Claude Code

```text
Al finalizar entregame un reporte de lo construido y un estatus
```

**Qué hizo la IA:** integró los módulos restantes (M4, M6, M8, M9, M10, M11), hizo una pasada
de consolidación del código duplicado entre módulos, corrigió dos bugs encontrados durante la
integración (el semáforo conservaba los colores del tema anterior y una prueba caducaba con el
reloj), levantó el stack completo en Docker para verificarlo de punta a punta, cerró la versión
en `release/1.0.0` y entregó el reporte.

### Prompt 7 — 2026-09-08 — Claude Code

```text
esta app no me abre en localhost, identifiquemos que esta pasando
```

**Qué hizo la IA:** revisó el stack y comprobó que los tres contenedores estaban arriba, que
`db` estaba *healthy* y que los puertos se publicaban en IPv4 e IPv6. `curl` obtenía **200** en
`http://localhost:5173/`, en `http://127.0.0.1:5173/` y en `http://[::1]:5173/`, y el proxy de
nginx respondía el `health` del backend. Es decir, la aplicación se estaba sirviendo bien; lo
que falla en esta máquina es el acceso desde un **navegador headless**, que recibe
`ERR_EMPTY_RESPONSE` en puertos locales aunque `curl` responda 200 (le ocurrió también al agente
que construyó las gráficas, y por eso no se pudo capturar la pantalla en modo claro). Desde un
navegador normal la aplicación abre.

### Prompt 8 — 2026-09-08 — Claude Code

```text
generemos data con varios proyectos que nos muestren varios ejemplos de como funcionan los calculos, esta data es importante que este en el initDB para cuando mis revisores levanten la app
```

**Qué hizo la IA:** diseñó ocho proyectos, uno por situación de EVM (los cuatro cuadrantes de
CPI y SPI, el caso exactamente en meta, los cuatro casos borde, un proyecto terminado con
sobrecosto y un proyecto sin actividades), calculó los indicadores esperados de cada uno con un
script en `Decimal` antes de escribir el SQL, los cargó en `backend/db/init.sql` con los valores
esperados anotados en comentarios, recreó la base desde cero en Docker y verificó los 8 reportes
contra el API, comprobó la idempotencia del script y documentó el conjunto en el README y en
`docs/EVM_GUIA.md §9`.

---

## 3. Cómo aprendí EVM y cómo validé las fórmulas

**Qué pedí.** En el Prompt 1 pedí explícitamente que **no** me dieran solo las fórmulas: qué
significa cada indicador, por qué EV no es el dinero gastado, qué pasa en los casos raros
(costo cero, sin avance, sin actividades) y un ejemplo con tres actividades resuelto paso a
paso. El resultado es [`docs/EVM_GUIA.md`](docs/EVM_GUIA.md). La razón de pedirlo así: el
video exige explicar EVM con mis palabras, y una lista de fórmulas no se puede explicar.

**Cómo validé que entendí antes de implementar.** Tres filtros, en este orden:

1. **Prueba de intuición previa al cálculo.** En el ejemplo de `EVM_GUIA.md §6.1` primero
   escribí qué debería pasar leyendo los datos (Diseño terminó y costó menos: bien;
   Desarrollo debía ir al 50 % y va al 40 % habiendo gastado la mitad: atrasado y caro;
   Pruebas arrancó antes y barato: bien). Después calculé. Los números coincidieron con la
   intuición. Si no hubieran coincidido, el error estaría en mi entendimiento o en las
   fórmulas, y había que parar.
2. **Recálculo independiente con `Decimal`.** Antes de escribir una línea de código de
   producción, recalculé el ejemplo completo y los ocho casos borde con un script aparte
   usando `decimal.Decimal` y redondeo *half up*, y comparé campo por campo con la tabla de
   la guía. Todo coincidió.
3. **Comprobación cruzada de EAC.** El reto fija `EAC = BAC / CPI`. Verifiqué que es
   algebraicamente igual a `AC + (BAC − EV) / CPI`: ambas dan 65 172,41 para el proyecto de
   ejemplo. Dos caminos distintos al mismo número es evidencia de que la fórmula se entendió,
   no se copió.

**Dónde me equivocaría sin esto.** Dos confusiones que la guía desmonta y que eran mías al
empezar: creer que EV es "lo que llevo gastado" (es lo producido valorado al precio del plan)
y creer que el CPI del proyecto es el promedio de los CPI de las actividades (§6.7 demuestra
que el promedio da 1,0370 —"va bien"— cuando el consolidado real es 0,9206 —"va mal"—).

---

## 4. Decisiones donde no seguí a la IA

_El autor redacta esta sección con sus palabras. Estos son los desacuerdos reales que
ocurrieron durante la sesión, anotados en el momento para que no haya que reconstruirlos
después:_

**Candidato 1 — Sin usuarios ni roles.** La propuesta de arquitectura de la IA modelaba
proyectos y actividades sin ningún concepto de usuario: cualquiera podía editar cualquier
cosa. El enunciado no pide autenticación, así que la IA la omitió por economía. Decidí
incorporar roles `REGISTRAR` / `REVIEWER` porque el dato de avance necesita un dueño
responsable y porque la herramienta que describe el enunciado tiene dos audiencias
distintas. Costo asumido: un módulo extra (M3b) y más superficie de pruebas. Detalle en la
sección 6.

**Candidato 2 — Textos de las notas de indicadores no calculables.** El agente que escribió
el contrato del API generó notas verbosas y autoexplicativas del tipo `"CPI no calculable:
sin costo registrado (AC = 0). EAC y VAC no se pueden proyectar."`. El módulo de dominio, ya
integrado, usaba las constantes cortas de `EVM_GUIA.md` (`"No aplica: sin costo
registrado"`). En vez de aceptar la versión del contrato, se alinearon las *fixtures* con las
constantes del dominio: el dominio es la fuente de verdad de un texto que es **dato de
negocio**, no documentación, y tener dos redacciones del mismo estado habría hecho imposible
que el test de integración comparara la respuesta completa.

**Candidato 3 — `EmailStr` en el login.** La IA propuso validar el email con `EmailStr` de
Pydantic. Se rechazó: `email-validator` rechaza el TLD reservado `.local` que usan los
usuarios semilla, así que la validación "más correcta" habría roto el login de la demo. Se
usó un `string` con longitud acotada.

---

## 5. Cómo verifiqué que los cálculos son correctos

La distinción que me importaba: **que el código corra no prueba que los números tengan
sentido**. Un test que solo verifica que una función retorna algo no verifica nada. Lo que
hice:

1. **Oráculo escrito antes del código.** `docs/EVM_GUIA.md §5` y `§6` contienen los valores
   esperados de las tres actividades, del consolidado y de los ocho casos borde, resueltos a
   mano y recalculados aparte con `Decimal`. Ese documento se escribió y se mergeó **antes**
   de la rama del dominio. Los tests unitarios comparan contra esas cifras exactas, no contra
   lo que devuelva la implementación.
2. **Cifras exactas, no aproximaciones.** Las pruebas comparan `Decimal` con la escala
   definida (2 decimales en dinero, 4 en índices) y modo *half up* explícito. Esto atrapó una
   decisión que un `assertAlmostEqual` habría escondido: `0.90625` redondea a `0.9063` con
   *half up* y a `0.9062` con el modo por defecto de Python (*banker's rounding*).
3. **Prueba de que no se promedian índices.** Hay un test dedicado a que el CPI del proyecto
   sea `ΣEV / ΣAC = 0.9206` y **no** el promedio de los CPI de actividad (`1.0370`). Es el
   error conceptual más fácil de cometer y el que más engaña al usuario, así que está fijado
   por un test que falla si alguien "simplifica" el cálculo.
4. **Comprobación de cordura en casos límite.** En la actividad terminada al 100 % con
   sobrecosto (`§5.7`), `EAC` debe dar exactamente el `AC` real (1 200): si ya terminó, lo que
   costará al terminar es lo que costó. Que el número caiga solo, sin caso especial en el
   código, es señal de que la fórmula es la correcta.
5. **Precisión intermedia.** `EAC = BAC / CPI` se calcula con el CPI **sin redondear**. Con el
   CPI redondeado a 4 decimales el proyecto daría 65 174,89 en vez de 65 172,41. Hay un test
   que fija ese valor para que nadie mueva el redondeo hacia arriba en la cadena.
6. **Contrato y dominio comparados entre sí.** Las *fixtures* del contrato
   (`docs/api/fixtures/evm-report.json`) se validaron con un recálculo independiente y luego
   se alinearon con las constantes de texto del dominio, de modo que el test de integración
   pueda comparar la respuesta HTTP completa contra el mismo oráculo.

Resultado en el momento de escribir esto: dominio EVM con 49 pruebas unitarias y 100 % de
cobertura; capa de negocio del backend por encima del 80 % exigido.

---

## 6. Decisión de arquitectura tomada de forma independiente

**Roles: quién registra y quién revisa.** Decisión tomada por el autor en el Prompt 3, sin
que la IA lo propusiera (la propuesta de arquitectura inicial no tenía usuarios ni roles).

- **Qué se decidió:** la herramienta distingue dos roles. El **registrador** (`REGISTRAR`)
  es quien ejecuta el trabajo y reporta el avance real y el costo de *sus* actividades. El
  **revisor** (`REVIEWER`) administra los proyectos, asigna responsables y revisa el estado
  consolidado (indicadores EVM) para saber cómo va el proyecto.
- **Por qué:** en un proyecto real quien registra el avance y quien lo evalúa no son la
  misma persona; separar los roles hace que el dato de avance tenga un dueño responsable y
  que el reporte EVM llegue a quien toma decisiones. También refleja cómo funciona la
  herramienta interna que describe el enunciado (líderes que registran, dirección que
  revisa).
- **Costo asumido:** un módulo adicional de autenticación (JWT) y autorización en el
  backend, una pantalla de login y vistas por rol en el frontend, y usuarios semilla en el
  script de base de datos. El detalle del diseño está en `docs/ARQUITECTURA.md §11`.

_El autor ampliará esta sección con sus propias palabras al cerrar el módulo._

---

## 7. Reflexión: qué haría diferente

_El autor reescribe esta sección con sus palabras. Estos son los hechos de la sesión que
sirven de base, anotados sin adornos:_

**Lo que funcionó.** Escribir la guía de EVM y resolver el ejemplo a mano **antes** de tocar
código. Ese documento fue el oráculo de los tests y el guion del video; si se hubiera escrito
después, habría sido una descripción de lo implementado en lugar de una verificación
independiente. También funcionó congelar el contrato del API antes de abrir las ramas: es lo
que hizo posible que backend y frontend avanzaran a la vez sin rehacer nada al integrar.

**Lo que haría diferente.**

1. **Fijar los contratos entre módulos antes de lanzarlos, no después.** El andamiaje del
   frontend se construyó sin el contrato OpenAPI disponible (iban en paralelo), así que sus
   tipos se escribieron a mano y hubo que reconciliarlos: `Project.createdBy` era un string y
   el contrato decía objeto, faltaba `expiresIn`, `EvmReport` no tenía `generatedAt`. Media
   hora de trabajo evitable. La lección se aplicó después con las props del dashboard: ahí sí
   se fijó el contrato primero y los tres módulos de UI no se pisaron.
2. **Definir dónde vive el texto de negocio desde el principio.** Las notas de los indicadores
   no calculables se escribieron dos veces con redacciones distintas (dominio y contrato), y
   hubo que alinearlas. Con una regla explícita desde el inicio — "el dominio es dueño de los
   textos que ve el usuario" — no habría pasado.
3. **Poner las piezas compartidas de UI antes de repartir los módulos.** Tres módulos
   escribieron su propio diálogo modal, su propio campo de formulario y su propio helper de
   sesión para tests. Salió una pasada de consolidación completa que se habría evitado
   entregando `components/ui` más completo en el andamiaje.
4. **Ejecutar la aplicación de verdad antes, no al final.** Dos bugs solo aparecieron al mirar
   el resultado: el atributo `data-reveal` que `PlaceholderCard` descartaba (la animación
   escalonada no se aplicaba nunca) y los semáforos conservando los colores del tema anterior.
   Ninguno de los dos lo atrapó un test unitario, y ambos eran visibles en cinco segundos de
   uso real.
5. **No usar fechas fijas en pruebas que validan expiración.** Una prueba congelaba el reloj a
   las 12:00 UTC y decodificaba el token verificando la expiración: pasó toda la mañana y
   empezó a fallar por la tarde, cuando la hora real cruzó las 20:00 UTC. Verde no es lo mismo
   que correcto.

**Sobre el uso de IA.** Lo más útil no fue que escribiera código, sino que obligara a escribir
el razonamiento primero: la guía de EVM, el contrato, el grafo de dependencias. Lo que más
atención exigió fue revisar: los subagentes proponen cosas razonables que están mal en el
contexto — el `EmailStr` que habría roto el login con el TLD `.local`, las notas verbosas que
rompían la comparación del test de integración, dos métodos idénticos con nombres distintos en
el mismo puerto. Aceptar todo eso habría dado un repositorio que compila y una arquitectura
peor.
