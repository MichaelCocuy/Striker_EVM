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

| Herramienta                                                     | Uso                                                                                                                                                                                                                                                                        | Por qué                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code** (CLI; modelos Claude Fable 5.1 y Claude Opus 5) | Asistente principal: lectura del enunciado, aprendizaje de EVM, propuesta de arquitectura, configuración del repositorio, generación y revisión de código, verificación del stack.                                                                                         | Trabaja directamente sobre el sistema de archivos y la terminal, así que cada prompt se traduce en archivos y commits verificables, y el proceso queda registrado tal como ocurrió en vez de reconstruido.                                                                                                                                                          |
| **Subagentes de Claude Code**, uno por módulo                   | Construcción en paralelo: cada módulo se desarrolló en su propia rama `feature/*` dentro de un _git worktree_ independiente, con instrucciones que fijaban su alcance de archivos, su contrato de interfaz y sus criterios de verificación.                                | Es lo que permitió que el plan de olas de `docs/ARQUITECTURA.md §8` fuera real: hasta cinco módulos avanzando a la vez. Yo actué como integrador: revisar el código, mergear los PR, resolver los cruces entre módulos y decidir qué aceptar.                                                                                                                       |
| **Claude Design**                                               | Diseño de la interfaz: el sistema visual Trycore (navy + teal, Poppins + Karla), las seis vistas de la plataforma y las siete visualizaciones del tablero. El resultado se exportó como _handoff_ y quedó en el repositorio, en `docs/Plataforma EVM gestión actividades`. | Necesitaba decidir la interfaz **antes** de implementarla, y decidirla viéndola. Diseñar en código habría mezclado dos discusiones distintas —cómo se ve y cómo se construye— y habría hecho más caro cambiar de opinión. El _handoff_ fija tokens, geometría y comportamiento, así que la implementación se pudo repartir en paralelo contra una referencia única. |

**Sobre el diseño.** El enunciado no pide un diseño elaborado, y por eso mismo quise hacerlo:
la herramienta la va a usar un líder de proyecto que no es técnico, así que la interfaz **es**
parte de la solución, no su decoración. El diseño completo, con sus tokens, sus assets y su
propio orden de implementación, está en
[`docs/Plataforma EVM gestión actividades`](docs/Plataforma%20EVM%20gesti%C3%B3n%20actividades/design_handoff_striker_evm/README.md);
dejé también la recreación del estado anterior del frontend, para poder comparar qué cambió.

Al implementarlo aparecieron cuatro cifras del prototipo que no se podían derivar de los datos
reales, y una contradicción interna del propio diseño (el degradado del CTA incumplía la regla de
contraste que el mismo documento enuncia). Todo eso quedó corregido y documentado en su commit,
que es justo la clase de decisión que quería poder mostrar: seguir un diseño no es copiarlo sin
mirar.

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
  `docs/ARQUITECTURA.md`, verificó con un script en Python (`Decimal`, redondeo _half up_)
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
- Lanzó la ola 1 de construcción en paralelo, cada módulo en su propio _git worktree_ y rama
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
`db` estaba _healthy_ y que los puertos se publicaban en IPv4 e IPv6. `curl` obtenía **200** en
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

### Prompt 9 — 2026-09-09 — Claude Code

```text
Entregame el acceso login de cada uno de los usuarios diseñados para la plataforma, en paralelo debemo hacer que el dashboard del revisor tenga una mejor experiencia de uduario, esto con el objetivo de que a primera vista entienda como va el proyecto bien o mal, es el objetivo del ejercicio [Image #1] enesta imagen te presento una idea de lo que diseñe para entender de manera rapida, en cuanto a graficas y de mas presentame una propuesta util que ayude a entender de manera sencilla estos calculos y mejoremos la distyribucion del dashboard
```

_(El prompt venía acompañado de una imagen: un diseño de la tabla de actividades con columnas
Actividad, Tendencia, Avance, EV, AC, CPI, SPI y EAC, con barra de progreso y los índices en
pastillas de color.)_

**Qué hizo la IA:** verificó los tres accesos contra el stack y los entregó; propuso y
construyó una nueva distribución del dashboard en cuatro bandas (veredicto → la foto →
dónde está el problema → detalle) para que el estado del proyecto se entienda de un vistazo.
Señaló que la columna "Tendencia" del diseño implica una serie de tiempo que el modelo de
datos no tiene (una sola fecha de corte), así que la implementó como desviación plan→real en
lugar de inventar un histórico.

---

### Prompt 10 — 2026-09-09 — Claude Code

```text
en la carpeta docs en la carpeta plataforma evm gestion actividades te deje un diseño realizado con claude design de lo que quiero implementar y como quiero que funcione la interfaz grafica, menu colores, tienes ahi los assets, asi que vamos a realizar dicha implementacion
```

**Qué hizo la IA:** leyó el _handoff_ de diseño (`docs/Plataforma EVM gestión actividades`), que
especifica el sistema Trycore (navy + teal, Poppins + Karla), seis vistas y siete
visualizaciones, con su propio orden de implementación. Empezó por la capa que lo habilita todo
—tokens, tema y tipografía— repuntando los nombres semánticos existentes a los valores Trycore
para no romper ninguna utilidad, y siguió con el resto de las vistas en paralelo. La curva S
queda fuera de esta entrega porque el propio diseño la marca como dependiente de un histórico de
cortes que el modelo de datos no tiene.

---

### Prompt 11 — 2026-09-09 — Claude Code

```text
[Imagen del login] deberemos mejorar esta implementacion del login ya que como observas en imagen esta no se encuentra distrubuida de manera adecuada en la pantalla
```

**Qué hizo la IA:** la captura mostraba el contenido pegado al borde superior con la mitad
inferior del degradado vacía. La causa: el contenedor exterior tenía alto de pantalla completa
pero la rejilla interior solo ocupaba el alto de su contenido, así que quedaba anclada arriba
(`items-center` centra los ítems dentro de su fila, no la rejilla dentro de la pantalla).

Para verificarlo consiguió por fin medir el navegador: los flags de proxy (`--proxy-server=direct://`
con `--proxy-bypass-list=*`) desbloquearon el navegador headless que hasta entonces devolvía
`ERR_EMPTY_RESPONSE` en puertos locales. Con eso midió por el protocolo de DevTools el centrado
(265 px arriba y 265 abajo a 1920×1058) y el desbordamiento horizontal a 360, 640, 900 y 1920 px.

De paso descubrió dos cosas que solo aparecen al medir: que las capturas headless estrechas
engañan —el navegador maqueta a ~800 px y recorta la imagen, así que el texto _parece_ cortado
sin estarlo— y que el valor literal del handoff, `minmax(340px, 1fr)`, sí desborda por debajo de
~388 px de viewport, porque la pista nunca baja de 340 px.

---

_Aquí cierro la bitácora de prompts. Las secciones que siguen las escribí yo, y desde este punto
el trabajo continuó sin añadir entradas nuevas: lo que valía la pena documentar quedó en los
mensajes de commit y en los Pull Requests._

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
   usando `decimal.Decimal` y redondeo _half up_, y comparé campo por campo con la tabla de
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

Aquí fueron varias. El enunciado pedía netamente la herramienta, y yo quise ir más allá: una
plataforma donde participen los distintos roles del equipo. Que sea el equipo el que registre
sus actividades, y que el revisor —el que toma las decisiones— analice el resultado y se
comunique con el equipo para mejorar la situación.

Eso es lo que agrega valor de verdad, y es lo que deja ver que entiendo el tema: una
implementación limpia, pensada en la funcionalidad y en los resultados de la solución.

También sé que la prueba no exige el máximo diseño, pero yo sí lo necesitaba, por dos razones.
La primera es dominio: si sé cómo mostrar la información, sé cómo mostrarla mejor y cómo
implementar mejoras. La segunda son las habilidades blandas, sobre todo la comunicación:
entender cómo un usuario que no es técnico va a interactuar con mi plataforma, y saber
enseñarle cuál es la mejor solución para su producto.

Puestas como decisiones concretas, con lo que la IA propuso y lo que hice en su lugar:

**Decisión 1 — Los roles.** La IA me propuso una arquitectura sin usuarios: proyectos y
actividades, y cualquiera podía editar cualquier cosa. Tenía su lógica, porque el enunciado no
pide autenticación. Decidí lo contrario: dos roles, registrador y revisor. En un proyecto real
quien reporta el avance y quien lo evalúa no son la misma persona, y un dato de avance sin dueño
no vale nada. Me costó un módulo completo de autenticación y bastante más superficie de pruebas,
y lo pagué a gusto. El detalle está en la sección 6.

**Decisión 2 — El diseño no es decoración.** La IA se quedaba en lo que pedía el enunciado: un
tablero claro y nada más. Yo diseñé la plataforma aparte, en Claude Design, y después la
implementamos contra ese diseño. La razón es simple: esta herramienta la va a usar un líder de
proyecto que no es técnico. Si no entiende la pantalla en cinco segundos, el cálculo sobra.

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
   definida (2 decimales en dinero, 4 en índices) y modo _half up_ explícito. Esto atrapó una
   decisión que un `assertAlmostEqual` habría escondido: `0.90625` redondea a `0.9063` con
   _half up_ y a `0.9062` con el modo por defecto de Python (_banker's rounding_).
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
6. **Contrato y dominio comparados entre sí.** Las _fixtures_ del contrato
   (`docs/api/fixtures/evm-report.json`) se validaron con un recálculo independiente y luego
   se alinearon con las constantes de texto del dominio, de modo que el test de integración
   pueda comparar la respuesta HTTP completa contra el mismo oráculo.

Resultado en el momento de escribir esto: dominio EVM con 49 pruebas unitarias y 100 % de
cobertura; capa de negocio del backend por encima del 80 % exigido.

---

## 6. Decisión de arquitectura tomada de forma independiente

**Roles: quién registra y quién revisa.** La decidí yo, en el Prompt 3, sin que la IA la
propusiera: su arquitectura inicial no tenía usuarios ni roles.

- **Qué decidí:** la herramienta distingue dos roles. El **registrador** (`REGISTRAR`)
  es quien ejecuta el trabajo y reporta el avance real y el costo de _sus_ actividades. El
  **revisor** (`REVIEWER`) administra los proyectos, asigna responsables y revisa el estado
  consolidado (indicadores EVM) para saber cómo va el proyecto.
- **Por qué:** en un proyecto real quien registra el avance y quien lo evalúa no son la
  misma persona; separar los roles hace que el dato de avance tenga un dueño responsable y
  que el reporte EVM llegue a quien toma decisiones. También refleja cómo funciona la
  herramienta interna que describe el enunciado (líderes que registran, dirección que
  revisa).
- **Lo que me costó:** un módulo adicional de autenticación (JWT) y autorización en el
  backend, una pantalla de login y vistas por rol en el frontend, y usuarios semilla en el
  script de base de datos. El detalle del diseño está en `docs/ARQUITECTURA.md §11`.

---

## 7. Reflexión: qué haría diferente

**Lo que funcionó.** Escribir la guía de EVM y resolver el ejemplo a mano **antes** de tocar
código. Ese documento terminó siendo dos cosas: el oráculo de las pruebas y mi guion para el
video. Si lo hubiera escrito después, habría sido una descripción de lo que implementé en lugar
de una verificación independiente, y no me habría servido para nada. Lo otro que funcionó fue
congelar el contrato del API antes de abrir las ramas: es lo que permitió que backend y frontend
avanzaran a la vez sin rehacer nada al integrar.

**Lo que haría diferente.** Dos cosas grandes, y las dos las dejé fuera por tiempo, no porque
no supiera que faltaban.

1. **La arquitectura, para poder guardar histórico.** Hoy el sistema solo conoce el último
   estado de cada actividad: los indicadores se calculan al leer y no se persisten. Eso está
   bien para responder «cómo va el proyecto hoy», pero deja fuera la pregunta que un líder hace
   enseguida: «¿vamos mejorando o empeorando?». Para contestarla hace falta una tabla de cortes
   —un `activity_snapshot` con su fecha— y un endpoint que devuelva el consolidado por fecha
   reutilizando las mismas reglas del dominio, sin duplicar la fórmula. Con eso se activan la
   curva S acumulada, los _sparklines_ de tendencia y la historia de cada actividad, que hoy no
   están precisamente porque no quise inventar datos que el modelo no soporta. En la misma
   línea, el portafolio pide hoy un reporte por proyecto (N+1 peticiones): con más tiempo
   habría un endpoint que devuelva el consolidado de todos de una vez.
2. **El sistema de notificaciones.** Es lo que le falta para que el software esté completo, y no
   es un adorno: cierra el ciclo que justifica los roles. Diseñé la plataforma para que el
   equipo registre y el revisor analice **y se comunique con el equipo** para corregir el rumbo.
   Ese último paso hoy no existe. La campana está en la barra superior y el panel dice
   «aquí aparecerán las actividades críticas de los proyectos que sigues», pero detrás no hay
   nada: el contrato no tiene un endpoint de alertas. Lo dejé así a propósito, diciendo la
   verdad en pantalla en lugar de fingir avisos. Con más tiempo, un CPI que cruza el umbral o
   una actividad que se atrasa dispararía un aviso al responsable y al revisor, y la
   conversación empezaría sola en vez de esperar a que alguien mire el tablero.

Y cinco lecciones más pequeñas, de proceso:

3. **Fijar los contratos entre módulos antes de lanzarlos, no después.** El andamiaje del
   frontend se construyó sin el contrato OpenAPI disponible, porque iban en paralelo, así que
   sus tipos se escribieron a mano y después hubo que reconciliarlos: `Project.createdBy` era un
   string y el contrato decía objeto, faltaba `expiresIn`, `EvmReport` no tenía `generatedAt`.
   Media hora de trabajo evitable. La lección la apliqué más adelante con las props del tablero:
   ahí fijé el contrato primero y los tres módulos de UI no se pisaron.
4. **Definir desde el principio dónde vive el texto que ve el usuario.** Las notas de los
   indicadores que no se pueden calcular se escribieron dos veces, con redacciones distintas, y
   hubo que alinearlas. Con una regla explícita desde el arranque —el dominio es el dueño de
   esos textos— no habría pasado.
5. **Entregar las piezas compartidas de UI antes de repartir los módulos.** Tres módulos
   escribieron su propio diálogo modal, su propio campo de formulario y su propio ayudante de
   sesión para las pruebas. Eso costó una pasada de consolidación completa que me habría
   ahorrado un `components/ui` más armado en el andamiaje.
6. **Usar la aplicación de verdad antes, no al final.** Dos errores solo aparecieron al mirar la
   pantalla: la animación escalonada que nunca se aplicaba porque un componente descartaba el
   atributo que la dispara, y los semáforos que conservaban los colores del tema anterior al
   cambiar de tema. Ninguno lo atrapó una prueba unitaria, y los dos se veían en cinco segundos
   de uso real.
7. **No poner fechas fijas en pruebas que validan expiración.** Una prueba congelaba el reloj a
   las 12:00 UTC y luego decodificaba el token verificando la expiración: pasó toda la mañana y
   empezó a fallar por la tarde, cuando la hora real cruzó las 20:00. Verde no es lo mismo que
   correcto.

**Sobre trabajar con IA.** Lo más útil no fue que escribiera código, sino que me obligara a
escribir el razonamiento primero: la guía de EVM, el contrato, el grafo de dependencias. Donde
tuve que poner la atención fue en revisar. La IA propone cosas razonables que están mal en este
contexto: un validador de correo que habría roto el login con el dominio `.local` de los usuarios
de prueba, textos largos que rompían la comparación del test de integración, dos métodos idénticos
con nombres distintos en la misma interfaz. Aceptar todo eso me habría dado un repositorio que
compila y una arquitectura peor.

Y la parte que más me sirvió aprender: la IA es buena proponiendo y mala decidiendo qué importa.
Las decisiones que le dan valor a esto —los roles, el diseño pensado para alguien que no es
técnico, no inventar una curva de avance que los datos no soportan— las tomé yo, y son justamente
las que no estaban en el enunciado.
