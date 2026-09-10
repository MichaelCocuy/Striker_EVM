# Handoff: Striker EVM · rediseño del tablero de valor ganado

## Overview

Striker EVM es una herramienta interna donde los líderes de proyecto registran el avance de sus
actividades y ven, en tiempo real, si el proyecto va bien o mal en cronograma y presupuesto usando
**Earned Value Management** (EVM / valor ganado, estándar del PMI).

El repositorio base (`Striker_EVM`) ya tiene backend completo (FastAPI + PostgreSQL, 306 pruebas,
100 % de cobertura del dominio) y un frontend funcional (React 18 + TypeScript + Vite + Tailwind 4
+ GSAP + Recharts). **Lo que este paquete entrega es el rediseño de la capa de presentación**: la
identidad visual pasa del indigo genérico actual al sistema de diseño Trycore (navy + teal,
Poppins + Karla), y el tablero pasa de dos gráficas a un conjunto de siete visualizaciones que
responden preguntas distintas.

Alcance del rediseño: seis vistas (login, portafolio, tablero del proyecto, detalle de actividad,
mis actividades, panel de registro de avance).

## About the Design Files

Los archivos de `design/` son **referencias de diseño escritas en HTML** — prototipos que muestran
la apariencia y el comportamiento buscados, **no código de producción para copiar**. Usan un
runtime propio (`support.js`) que no existe en el repositorio de Striker EVM y que no debe
importarse.

La tarea es **recrear estos diseños dentro del entorno que ya existe en el repositorio**: React 18
+ TypeScript estricto, Tailwind CSS 4 con tokens en `src/styles/tokens.css`, GSAP para movimiento y
Recharts para gráficas. Se conservan la arquitectura, el enrutado, el cliente API tipado, la matriz
de permisos y el contrato de `docs/api/openapi.yaml`. Lo que cambia son los tokens, los componentes
de presentación y el conjunto de gráficas.

**Regla de oro del dominio, que el rediseño no altera:** el frontend nunca calcula un indicador
EVM. Todos los valores (PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC) llegan calculados desde
`GET /projects/{id}/evm`. Un indicador no calculable llega como `null` con estado
`NOT_APPLICABLE`, y **se muestra como `—`, nunca como cero**. La única excepción propuesta está
documentada abajo (previsualización del panel de registro) y viene con su advertencia.

## Fidelity

**Alta fidelidad (hifi).** Colores, tipografía, espaciados, radios, sombras y geometría de las
gráficas son finales y están tomados del sistema de diseño Trycore. Los valores hex de este
documento son normativos. Recréelo píxel a píxel usando los tokens del sistema, no aproximaciones.

Las cifras de los prototipos son **datos reales** del proyecto de ejemplo: salen de
`backend/db/init.sql` y de `frontend/src/mocks/fixtures/evm-report.json`. No son inventadas; sirven
para verificar a mano que la implementación muestra lo mismo.

---

## Design Tokens

Reemplazan por completo el bloque de marca de `src/styles/tokens.css`. El semáforo EVM y la
estructura de superficies se mantienen conceptualmente; cambian los valores.

### Color — marca

| Token | Valor | Uso |
|---|---|---|
| `--tc-primary` | `#00A19A` | Teal de acción. **Nunca bajo texto ni como color de texto** (3,2:1). Bordes, foco, marcadores activos, trazos de gráfica, barras de avance. |
| `--tc-primary-strong` | `#007F7A` | El teal cuando toca texto: relleno de botón bajo blanco, y teal como color de letra sobre blanco (4,9:1). |
| `--tc-primary-strong-hover` | `#006B67` | Hover del anterior. |
| `--tc-primary-top` | `#06C8BE` | Extremo claro de los degradados. |
| `--tc-navy` | `#1D2751` | Autoridad: sidebar, encabezados, bandas de alto contraste. |
| `--tc-teal` | `#64C2C8` | Teal claro para hover/activo sobre navy. |
| `--tc-blue` | `#5C82F2` | H3 y etiquetas secundarias. |

Regla de una línea: **si hay letras encima, o el color *son* las letras → `#007F7A`.**

### Color — texto y superficies

| Token | Valor |
|---|---|
| `--tc-text-h` (encabezados) | `#1D2751` |
| `--tc-text-b` (cuerpo) | `#424242` |
| `--tc-text-m` (labels, metadata) | `#4A5568` |
| `--tc-text-s` (captions, placeholders) | `#9CA3AF` |
| `--tc-bg-canvas` | `#F9F9F9` |
| `--tc-bg-sidebar` | `#1D2751` |
| `--tc-card` | `#FFFFFF` |
| `--tc-accent` (bloques de énfasis) | `#E8F6F7` |
| `--tc-bg-subtle` (chips, tags) | `#F3F4F6` |
| `--tc-border` | `#E5E7EB` |
| `--tc-border-s` (inputs) | `#D1D5DB` |

Jerarquía de profundidad, en cuatro planos claramente distintos: `0` canvas `#F9F9F9` · `1` sidebar
navy · `2` cards blanco puro con `--tc-sh-2` · `3` modales blanco con `--tc-sh-3`. Nunca apilar dos
superficies casi blancas sin borde ni sombra; el sidebar oscuro es lo que permite que el canvas sea
casi blanco.

### Color — semáforo EVM

Sustituye el bloque `--evm-*` actual. Cuatro tonos, idénticos en tarjetas, tabla y gráficas.

| Estado | Tinta (texto y trazo) | Fondo suave |
|---|---|---|
| Favorable (bajo presupuesto / adelantado) | `#15803D` | `#DFF0D8` |
| En meta (en presupuesto / en cronograma) | `#B45309` | `#FCF8E3` |
| Desfavorable (sobre presupuesto / atrasado) | `#A64242` | `#F2DEDE` |
| No aplica | `#4A5568` | `#F3F4F6` |

Mapeo desde el API, tal como ya lo hace `src/evm/tone.ts` (solo cambian los valores):

- `costStatus`: `UNDER_BUDGET` → favorable · `ON_BUDGET` → en meta · `OVER_BUDGET` → desfavorable · `NOT_APPLICABLE` → no aplica.
- `scheduleStatus`: `AHEAD_OF_SCHEDULE` → favorable · `ON_SCHEDULE` → en meta · `BEHIND_SCHEDULE` → desfavorable · `NOT_APPLICABLE` → no aplica.

Etiquetas en español, ya existentes en el repositorio: `Bajo presupuesto` / `En presupuesto` /
`Sobre presupuesto` / `No aplica`, y `Adelantado` / `En cronograma` / `Atrasado` / `No aplica`.

### Degradados

Reservados y específicos. Nada de degradados decorativos.

```css
--tc-grad-brand:   linear-gradient(180deg, #06C8BE 0%, #00A19A 100%);  /* brand mark */
--tc-grad-cta:     linear-gradient(135deg, #06C8BE 0%, #009490 100%);  /* CTA primario */
--tc-grad-sidebar: linear-gradient(175deg, #1D2751 0%, #111C42 60%, #0D1835 100%);
```

La banda de lectura del tablero usa `linear-gradient(175deg, #1D2751 0%, #111C42 100%)`.

### Tipografía

Dos familias, cargadas desde `_ds/.../tokens/fonts.css` (Poppins y Karla).

| Token | Valor |
|---|---|
| `--tc-font-heading` | `'Poppins', 'Helvetica Neue', Arial, sans-serif` |
| `--tc-font-body` | `'Karla', 'Helvetica Neue', Arial, sans-serif` |
| `--tc-fs-h1` | `30px` |
| `--tc-fs-h2` | `22px` |
| `--tc-fs-h3` | `17px` |
| `--tc-fs-body` | `15px` |
| `--tc-fs-small` | `13px` |
| `--tc-fs-caption` | `12px` |
| `--tc-fs-badge` | `10px` |
| `--tc-lh-h1 / h2 / h3 / body` | `1.25 / 1.30 / 1.35 / 1.60` |
| `--tc-ls-heading` | `-0.01em` |
| `--tc-ls-label` | `0.55px` |

Poppins para encabezados (700/600, navy), Karla para cuerpo (400/500, `#424242`).
`-webkit-font-smoothing: antialiased` en `html`.

**Overline** (el rótulo pequeño sobre cada título de card): Poppins 700, `10px`, tracking `1.1px`,
mayúsculas, color `#007F7A`.

**Cifras**: Poppins 700 con `font-variant-numeric: tabular-nums` siempre. Escala usada:
`30px` para la cifra dominante de un KPI, `28px` para la tira de KPIs del portafolio, `24px` para
EAC/VAC en la banda navy, `19px` para la tira de valores base, `18px` para las fichas del detalle.
Tracking `-0.02em` a `-0.03em` en las cifras grandes.

**Casing**: sentence case para labels y títulos. MAYÚSCULAS solo en overlines pequeños, cabeceras de
tabla y CTAs, siempre con tracking. `trycore` va en minúscula cuando es wordmark; `TRYCORE` en
mayúscula solo cuando se nombra dentro de texto corrido.

### Forma

| Token | Valor |
|---|---|
| `--tc-r-sm` | `2px` |
| `--tc-r-md` | `4px` |
| `--tc-r-lg` | `6px` |
| `--tc-r-pill` | `999px` |

**Los radios topan en 6px** en superficies rectangulares. Esto es un cambio importante frente al
diseño actual, que usa 8/12/18/26px. La píldora `999px` se reserva a CTAs, chips y badges.

### Espaciado y layout

Escala base 4px: `4 · 8 · 12 · 16 · 18 · 24 · 32 · 40`.
`--tc-sp-5: 18px` es el padding estándar de card; `--tc-sp-6: 24px` el del área de contenido.

| Token | Valor |
|---|---|
| `--tc-sidebar-w` | `252px` |
| `--tc-topbar-h` | `66px` |

### Sombras y movimiento

```css
--tc-sh-1: rgba(0,0,0,.1) 0 1px 3px, rgba(0,0,0,.06) 0 1px 2px;  /* KPI, baja */
--tc-sh-2: 0 4px 12px rgba(0,0,0,.08);                            /* card, media */
--tc-sh-3: 0 12px 32px rgba(0,0,0,.14);                           /* modal, alta */
--tc-sh-focus: 0 0 0 3px rgba(100,194,200,.35);                   /* ring teal en inputs */
--tc-glow-brand: 0 2px 8px rgba(0,161,154,.45);                   /* brand mark */
--tc-glow-cta:   0 5px 16px rgba(0,161,154,.42);                  /* CTA hover */
--tc-ease: cubic-bezier(.4, 0, .2, 1);
--tc-dur-fast: .12s;  --tc-dur: .15s;  --tc-dur-slow: .25s;
```

Sombras neutrales, sin tinte de color. El halo teal solo en el brand mark y en el hover del CTA.

Movimiento restringido: fundidos, elevaciones de 1–2px, empujón de 2px en el hover de nav, pop de
modal (`scale .95→1`, `.18s`), entrada de toast. Sin rebotes, sin bucles infinitos. Todo respeta
`prefers-reduced-motion` — la infraestructura ya existe en `src/motion/`.

### Iconografía

**Lucide**, solo línea (`fill: none`), `stroke-width` **1.6** en sidebar y UI ligera, **2.0** en
alertas y énfasis, `currentColor`. Tamaño base 16px en sidebar, 18px en contenido.

Nunca mezclar glifos Unicode (`▣ ▦ ◷`) ni emoji como iconos de navegación o acción.

Iconos usados en el rediseño: `layout-dashboard` (portafolio), `bar-chart-2` (tablero),
`file-text` (mis actividades), `plus` (registrar avance / nueva actividad), `search`, `bell`,
`arrow-right` (afordancia de fila), `arrow-left` (volver), `x` (cerrar), `triangle-alert`
(alerta de actividad crítica).

### Formato de números — locale es-CO

Ya implementado en `src/lib/format.ts`, se conserva tal cual:

- Dinero: dos decimales, separador de miles `.`, decimal `,` → `32.000,00`
- Índices: cuatro decimales → `0,9206`
- Porcentajes: sin decimales → `40 %`
- No calculable: `—`

En ejes de gráfica el dinero va compacto: `20 mil`, `40 mil`, `60 mil`.

---

## Screens / Views

Seis vistas. Las tres primeras reemplazan pantallas existentes; el detalle de actividad y el panel
de registro son nuevos.

### Shell de la aplicación (envuelve las vistas 2 a 5)

Reemplaza `src/features/layout/AppLayout.tsx`, `Sidebar.tsx` y `Topbar.tsx`.

**Layout**: `display: flex` a pantalla completa. Sidebar de `252px` con `flex-shrink: 0`; a su
derecha una columna `flex: 1; min-width: 0` con topbar sticky y `<main>`.

**Sidebar** — el ancla de identidad corporativa.

- Fondo `--tc-grad-sidebar`, sombra `4px 0 20px rgba(0,0,0,.25)`.
- Cabecera: padding `17px 18px`, borde inferior `1px solid rgba(100,194,200,.15)`. Tesela de
  `34×34px`, radio `6px`, fondo `--tc-grad-brand`, sombra `--tc-glow-brand`, padding interno `6px`,
  con `assets/symbol-trycore.svg` en blanco (`filter: brightness(0) invert(1)`). Al lado,
  «Striker EVM» en Poppins 700 `14px` blanco y «Valor ganado» en `10px`,
  `rgba(255,255,255,.5)`, mayúsculas, tracking `.5px`.
- Grupos de navegación con título en Poppins 600 `10px`, mayúsculas, tracking `1.1px`, color
  `rgba(100,194,200,.5)`, padding `14px 16px 4px`. Dos grupos: **Seguimiento** (Portafolio, Tablero
  del proyecto) y **Mi trabajo** (Mis actividades, Registrar avance).
- Ítem de nav: `display: flex`, gap `9px`, padding `8px 10px`, margen `1px 8px`, radio `4px`,
  `14px`.
  - Reposo: `color: rgba(255,255,255,.68)`, fondo transparente.
  - Hover: fondo `rgba(255,255,255,.09)`, color `#fff`, `transform: translateX(2px)`.
  - Activo: fondo `rgba(100,194,200,.16)`, color `#7FDCD8`, peso 600, sombra
    `inset 0 0 0 1px rgba(100,194,200,.22), 0 2px 8px rgba(0,161,154,.18)`.
- Ficha de fecha de corte al pie del área de nav: margen `0 8px 12px`, padding `12px`, radio `4px`,
  fondo `rgba(100,194,200,.1)`, borde `1px solid rgba(100,194,200,.18)`. Contiene el overline
  «Fecha de corte» en `#7FDCD8`, la fecha en Poppins 600 `15px` blanco, y «Periodo 5 de 8» en
  `11px` `rgba(255,255,255,.5)`.
- Pie: `Trycore S.A.S. · Striker EVM`, `11px`, `rgba(255,255,255,.32)`, borde superior
  `1px solid rgba(255,255,255,.08)`.

**Topbar** — blanca con acento teal.

- `border-top: 3px solid #00A19A`, `border-bottom: 1px solid #E5E7EB`, sombra `--tc-sh-2`.
- Fondo `linear-gradient(90deg, rgba(0,161,154,.055) 0%, #FFFFFF 38%)`.
- Padding `12px 26px`, `display: flex`, `justify-content: space-between`, gap `16px`, sticky.
- Bloque izquierdo: `flex: 0 1 auto; min-width: 0; overflow: hidden`. Migaja en `11px`, mayúsculas,
  tracking `.7px`, `#9CA3AF`; título en Poppins 700 `19px` navy, tracking `-0.02em`. Ambos con
  `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
- Clúster derecho: `flex: 1 1 auto; min-width: 0; justify-content: flex-end`, gap `12px`.
  - Buscador: `flex: 1 1 0; min-width: 0; max-width: 220px; overflow: hidden`, borde
    `1px solid #E5E7EB`, radio `4px`, padding `7px 12px`, con el icono `search` en `#9CA3AF` y un
    `<input>` con `min-width: 0`. **Este es el elemento elástico de la barra**: es lo que evita
    que la topbar desborde en anchos estrechos.
  - Botón de campana: `36×36px`, radio `4px`, sin borde, `flex-shrink: 0`. Hover: fondo `#F3F4F6`,
    color navy.
  - Ficha de usuario: `flex-shrink: 0`, borde `1px solid #E5E7EB`, radio `999px`, padding
    `5px 12px 5px 5px`. Avatar circular de `30px` con fondo `#E8F6F7`, iniciales en Poppins 700
    `12px` `#007F7A`. Nombre en Poppins 600 `13px` navy; rol en `11px` `#4A5568`.
  - Botón «Salir»: Poppins 600 `12px` `#4A5568`, `flex-shrink: 0`.

**`<main>`**: `padding: 24px 26px 40px`, `display: flex; flex-direction: column; gap: 18px`,
`min-width: 0`.

**Card estándar** (se repite en todas las vistas): fondo `#FFFFFF`, borde `1px solid #E5E7EB`,
radio `6px`, sombra `--tc-sh-2`, padding `18px`, `display: flex; flex-direction: column; gap: 14px`.
Cabecera con overline teal → H3 Poppins 600 `17px` navy → párrafo Karla `13px` `#424242`
`line-height 1.5`.

**Botones.**

- **Primario**: fondo `--tc-grad-cta`, texto blanco, radio `999px`, Poppins 600 `11.5px`,
  mayúsculas, tracking `1.2px`, padding `10px 18px`. Hover: sombra `--tc-glow-cta`. Press:
  `translateY(1px)`.
- **Secundario**: borde `1.5px solid #1D2751`, fondo transparente, texto navy, mismas medidas.
  Hover: fondo `#E8F6F7`.
- **Terciario/cancelar**: borde `1.5px solid #D1D5DB`, texto `#4A5568`.

**Inputs**: borde `1px solid #D1D5DB`, radio `4px`, padding `10px 12px`, Karla `15px` `#424242`.
Foco: `border-color: #00A19A` + `box-shadow: --tc-sh-focus`. Label en Poppins 600 `12px` `#4A5568`.

---

### 1 · Login

**Propósito**: autenticarse. Dos roles: `REVIEWER` (revisor) y `REGISTRAR` (registrador).

**Layout**: pantalla completa sobre `--tc-grad-sidebar`. Rejilla de dos columnas
`repeat(auto-fit, minmax(340px, 1fr))`, gap `48px`, padding `56px 48px`, `max-width: 1180px`
centrado. En anchos estrechos las columnas se apilan.

**Columna izquierda — mensaje de marca.**

- Detrás, la **Frecuencia Orbitacional**: SVG absoluto de `420×420px` en `left: -110px; top: -70px`,
  `opacity: .5`, `pointer-events: none`. Tres círculos concéntricos de 1px en
  `rgba(100,194,200,.18 / .14 / .12)` — el del medio punteado `3 6` — y dos nodos (`r 5` en
  `#00CCC2`, `r 4` en `#64C2C8`) sobre las órbitas. La geometría orbita el contenido; nunca es
  fondo decorativo suelto.
- Wordmark: tesela de `40px` con `--tc-grad-brand` y el símbolo, «Striker EVM» en Poppins 700
  `15px` blanco, y `trycore` en minúscula `13px` `rgba(100,194,200,.75)` separado por
  `border-left: 1px solid rgba(255,255,255,.18)` con `padding-left: 12px`.
- Titular como pregunta, patrón de la marca: **«¿Sabes hoy si el proyecto va bien, o solo cuánto
  llevas gastado?»** — Poppins 700 `44px`, `line-height 1.12`, tracking `-0.02em`, blanco,
  `max-width: 15ch`.
- Subcopy en **Poppins 400** (no Karla) `17px`, `line-height 1.5`, `rgba(255,255,255,.72)`,
  `max-width: 44ch`: «Valor ganado calculado sobre lo que registran tus líderes. Costo y cronograma
  en la misma lectura, sin hojas de cálculo intermedias.»
- Dos chips: `PMI · EARNED VALUE` en fondo `#1FE0D7` con tinta navy `#011955` (blanco sobre ese
  teal da 1,65:1 y es ilegible), y `CPI · SPI · EAC · VAC` con borde
  `1.5px solid rgba(255,255,255,.35)` y texto `rgba(255,255,255,.8)`. Ambos Poppins 600 `11px`,
  mayúsculas, tracking `1.2px`, padding `7px 14px`, radio `999px`.

**Columna derecha — formulario.** Card blanca, radio `6px`, sombra `--tc-sh-3`, padding `32px`,
gap `20px`. Overline «Acceso» → H2 Poppins 700 `22px` navy «Inicia sesión» → campo de correo →
campo de contraseña → botón primario a ancho completo «Entrar como revisor» → separador con «o» →
botón secundario «Entrar como registrador» → nota en `12px` `#9CA3AF` con las credenciales de
demostración.

En producción hay **un solo** botón «Entrar»; los dos botones del prototipo existen para que el
evaluador entre con cualquiera de los dos roles sin teclear. El destino tras autenticar lo decide
el rol, como ya lo hace `RootRedirect`: `REVIEWER` → `/projects`, `REGISTRAR` → `/my-activities`.

**Errores**: `401` → «Correo o contraseña incorrectos». Otro error del API → su mensaje. Fallo de
red → «No fue posible iniciar sesión. Intenta de nuevo.» El mensaje va en un bloque
`role="alert"` con fondo `#F2DEDE`, texto `#A64242`, radio `4px`, padding `14px 16px`.

---

### 2 · Portafolio (`/projects`, rol REVIEWER)

**Propósito**: ver el estado consolidado de todos los proyectos y detectar cuál necesita atención.

Reemplaza `src/features/projects/ProjectsPage.tsx` y `ProjectCard.tsx`. La rejilla de tarjetas
grandes actual se cambia por una tira de KPIs, un cuadrante y una lista densa: con ocho proyectos,
la lista permite comparar; las tarjetas grandes obligan a recordar.

**Layout**: columna con gap `18px`. Primero la tira de KPIs; debajo, una rejilla
`repeat(auto-fit, minmax(420px, 1fr))` con gap `14px` y `align-items: start`, donde entran el
cuadrante y la lista de proyectos.

**Tira de KPIs**: `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`, gap `14px`. Cuatro
cards de sombra `--tc-sh-1`, padding `16px 18px`, gap `6px`: overline teal, cifra en Poppins 700
`28px` tracking `-0.03em` tabular, y leyenda en `12px` `#9CA3AF`.

| Overline | Cifra | Leyenda |
|---|---|---|
| Presupuesto total | `313.000` | BAC sumado · 7 proyectos con actividades |
| Valor ganado | `165.750` | EV consolidado a la fecha de corte |
| Proyectos en rojo | `3` en `#A64242` | Sobre presupuesto o atrasados |
| Desviación proyectada | `+9.973` en `#15803D` | VAC sumado · dominado por un solo proyecto |

Las cuatro se derivan sumando los reportes de los proyectos visibles. La leyenda de la última es
deliberada: el `+9.973` es engañoso si no se dice que un proyecto lo domina.

**Cuadrante CPI × SPI** (nuevo). Card estándar. Overline «Cuadrante», título «CPI frente a SPI,
proyecto por proyecto», bajada «El tamaño de la burbuja es el presupuesto. Arriba a la derecha es
barato y a tiempo; abajo a la izquierda, caro y atrasado.»

Geometría, `viewBox="0 0 460 360"`:

- Área de trazado x `60…440`, y `30…310`. Referencias: SPI = 1,0 en `x = 212`; CPI = 1,0 en
  `y = 170`.
- Bandas: `rect` verde `#DFF0D8` `opacity .35` en y `30…170` (CPI sobre 1) y roja `#F2DEDE`
  `opacity .28` en y `170…310`.
- Ejes en `#E5E7EB`; las dos referencias en `#1D2751` con `stroke-dasharray="4 4"`.
- Escalas: `x = 212 + (SPI − 1) × 232`, `y = 170 − (CPI − 1) × 172`. Los factores están elegidos
  para que el caso más extremo (SPI 0,3452 y CPI 1,8125 de App móvil de campo) quepa sin recortar.
- Radio de burbuja proporcional al BAC, con tope bajo (`8…11px` para el rango 30.000–60.000). El
  tope bajo es lo que evita que dos proyectos de índices parecidos se tapen.
- Relleno al 18–20 % de la tinta del semáforo, trazo `1.5px` de la tinta plena. Número del proyecto
  centrado, Poppins 700 `9px`, en la tinta del semáforo.
- Los proyectos que caen sobre una línea de referencia llevan un círculo blanco de fondo (halo)
  para que el número se lea.
- App móvil de campo lleva trazo `stroke-dasharray="3 3"`: su CPI es alto por falta de costos
  cargados, no por buen desempeño, y la línea punteada dice «no te fíes de este punto».
- Rótulos: `SPI 1,0` a `x 216, y 26`; `CPI 1,0` **dentro** del área de trazado a `x 66, y 165` — no
  a la izquierda del eje, donde chocaría con el título rotado. `BARATO` arriba a la derecha en
  `#15803D`, `CARO` abajo a la derecha en `#A64242`. Títulos de eje: `SPI · cronograma` centrado
  abajo, `CPI · costo` rotado `-90°` en `x 20`.
- Debajo del SVG, dos párrafos de `12px` `#9CA3AF`: uno que explica cómo leer las bandas y el
  número, y otro sobre el punteado de App móvil de campo.

Coordenadas exactas de los siete proyectos con actividades:

| # | Proyecto | CPI | SPI | cx | cy | r | Tono |
|---|---|---|---|---|---|---|---|
| 01 | Portal de clientes | 0,9206 | 0,9063 | 190 | 184 | 11 | desfavorable |
| 02 | Migración a la nube | 1,1636 | 1,1130 | 238 | 142 | 9 | favorable |
| 03 | Integración de pagos | 0,7712 | 1,3000 | 282 | 209 | 10 | desfavorable |
| 04 | Rediseño del intranet | 1,2136 | 0,7353 | 151 | 133 | 8 | en meta |
| 05 | Cumplimiento normativo | 1,0000 | 1,0000 | 212 | 170 | 9 | teal `#007F7A` |
| 06 | App móvil de campo | 1,8125 | 0,3452 | 72 | 44 | 9 | en meta, punteado |
| 07 | Certificación ISO 27001 | 0,8929 | 1,0000 | 212 | 188 | 10 | desfavorable |

Tablero de indicadores (proyecto sin actividades) **no se dibuja**: sin índices no hay punto. Va
en la lista con el estado «No aplica».

**Lista de proyectos**. Encabezado con «8 proyectos» en Poppins 600 `17px` navy y el botón primario
«Nuevo proyecto» a la derecha (solo si `can('project:create')`).

Cada fila es un `<article>` clicable que navega a `/projects/{id}`: fondo blanco, borde
`1px solid #E5E7EB`, radio `6px`, sombra `--tc-sh-1`, padding `14px 16px`,
`grid-template-columns: 22px minmax(0, 1fr) auto`, gap `14px`, `align-items: center`.
Hover: sombra `--tc-sh-2` + `translateY(-1px)`.

- Columna 1: número `01`…`08` en Poppins 700 `11px` `#9CA3AF`, alineado a la derecha. Es la clave
  que amarra la fila con la burbuja del cuadrante.
- Columna 2: nombre en Poppins 600 `14.5px` navy; debajo, los dos chips del semáforo (Poppins 600
  `10.5px`, tracking `.4px`, radio `999px`, padding `3px 9px`, fondo suave + tinta del tono) y el
  conteo de actividades en `11px` `#9CA3AF`.
- Columna 3: CPI y SPI, cada uno con su rótulo en Poppins 700 `10px` tracking `1px` `#9CA3AF` y el
  valor en Poppins 700 `16px` **en la tinta de su propio semáforo** (CPI toma el tono de costo, SPI
  el de cronograma), tabular. Al final el icono `arrow-right` en `#9CA3AF`.

Editar y eliminar salen de la fila: viven en el tablero del proyecto. La fila entera es un objetivo
de navegación; dos botones destructivos dentro de un objetivo clicable es una trampa.

**Estado vacío**: card con overline «Portafolio vacío», título «Todavía no hay proyectos» y, si el
rol puede crear, el botón primario. Si no puede: «Cuando un revisor cree un proyecto, aparecerá
aquí con su estado.»

**Carga**: skeletons con la forma de la tira de KPIs (4) y de las filas (8), fondo `#F3F4F6` con el
barrido que ya existe en `src/styles/base.css`.

---

### 3 · Tablero del proyecto (`/projects/:projectId`, ambos roles)

**Propósito**: leer el estado del proyecto y saber dónde intervenir.

Reemplaza `ProjectDashboardPage.tsx`, `ProjectSummary.tsx`, `EvmChart.tsx` y `ActivitiesTable.tsx`.
Se conserva intacto el contrato de datos: **una sola petición** a `GET /projects/{id}/evm` alimenta
todo, y cualquier mutación dispara `onDataChanged` → refetch, de modo que las siete
visualizaciones se actualizan a la vez.

Orden de lectura, de conclusión a detalle: banda de lectura → curva S → puente de varianzas →
barras por actividad → cuadrante → mapa de calor → tabla.

#### 3.1 Banda de lectura (sustituye el panel «Consolidado»)

Franja navy `linear-gradient(175deg, #1D2751 0%, #111C42 100%)`, radio `6px`, padding `20px 22px`,
`grid-template-columns: repeat(auto-fit, minmax(210px, 1fr))`, gap `20px`, `position: relative;
overflow: hidden`.

Detrás, la Frecuencia Orbitacional: SVG de `300×300px` en `right: -60px; top: -90px`,
`opacity: .35`, con dos anillos en `rgba(100,194,200,.25 / .18)` — el interior punteado — y un nodo
`#00CCC2`.

Cuatro celdas:

1. **Conclusión en palabras.** Overline «Lectura del corte» en `#7FDCD8`; frase en Poppins 600
   `21px` `line-height 1.3` blanco: «Gasta más de lo que avanza, y el atraso es lo que empuja el
   sobrecosto.»; y una línea de `13px` `rgba(255,255,255,.68)`: «Desarrollo concentra el 100 % de
   la desviación: sin esa actividad el proyecto cerraría bajo presupuesto.»
   Esta frase se **compone a partir de `costStatus` y `scheduleStatus`** (cuatro combinaciones más
   el caso no aplica), no se calcula nada nuevo. La segunda línea nombra la actividad de mayor
   `|VAC|` con su participación en el BAC.
2. **Gauge de CPI.** `viewBox="0 0 200 118"`. Arco semicircular
   `M 14 108 A 86 86 0 0 1 186 108`, escala 0–2 para que la referencia 1,0 caiga exactamente
   arriba. Pista `rgba(255,255,255,.14)` de `10px`; arco de valor del mismo grosor en la tinta del
   semáforo en versión clara sobre navy (`#F08585` desfavorable, `#86D45F` favorable, `#F2D24A`
   en meta, `#9BA4C7` no aplica), revelado con `pathLength="1"` y
   `stroke-dasharray="{fracción} 1"` donde `fracción = clamp(valor / 2, 0, 1)`. Marca de referencia:
   línea de `x1 100 y1 30` a `x2 100 y2 16` en `rgba(255,255,255,.6)`, con el rótulo `1,0` en
   `9px` `rgba(255,255,255,.55)` a `y 12`. El valor va **dentro** del arco: Poppins 700 `30px`
   blanco, `text-anchor: middle`, `x 100 y 100`, tracking `-1`. Debajo del SVG, el overline
   «CPI · sobre presupuesto» en `#7FDCD8`.
   Un índice `null` **no se dibuja como cero**: arco vacío, valor `—`, rótulo «no aplica».
3. **Gauge de SPI**, idéntico.
4. **Pronóstico.** `border-left: 1px solid rgba(255,255,255,.14)`, `padding-left: 20px`. Dos
   bloques: `EAC · costo al terminar` con la cifra en Poppins 700 `24px` blanco, y
   `VAC · desviación al cierre` con la cifra en la tinta clara del signo (`#F08585` si es negativa,
   `#86D45F` si es positiva). Overlines en Poppins 700 `10px` tracking `1.1px`
   `rgba(255,255,255,.5)`.

Los diez indicadores siguen accesibles: los cuatro valores base van en la tira bajo la curva S, las
varianzas en el puente, y CPI/SPI/EAC/VAC en esta banda. Nada se pierde; deja de estar todo al
mismo peso visual.

#### 3.2 Curva S acumulada — **propuesta, requiere backend**

Card estándar. Overline «Curva S acumulada», título «Plan, avance y gasto a lo largo del
proyecto», bajada «Las tres curvas empiezan juntas y se separan en el periodo 3. Desde el corte, la
proyección extiende el gasto al ritmo actual.» En la esquina, un chip en Poppins 700 `10px`
mayúsculas `#B45309` sobre `#FCF8E3`, radio `999px`: **«Propuesta · requiere histórico de
cortes»**.

Leyenda en HTML (no dentro del SVG): cuatro entradas con una barra de `16×3px` radio `2px` y
etiqueta de `12px` `#4A5568` — PV `#4A5568`, EV `#00A19A`, AC `#B45309`, y la proyección EAC como
barra punteada `repeating-linear-gradient(90deg, #A64242 0 5px, transparent 5px 9px)`.

Geometría, `viewBox="0 0 740 300"`:

- Ocho periodos en x `56, 148, 240, 332, 424, 516, 608, 700` (paso 92). El corte es el periodo 5
  (`x = 424`).
- Escala y: `y = 250 − valor / 70000 × 220`. Líneas de rejilla en 0 / 20 mil / 40 mil / 60 mil →
  `y = 250 / 187.1 / 124.3 / 61.4`. La primera en `#E5E7EB`, el resto en `#F3F4F6`. Rótulos a la
  izquierda en Karla `11px` `#9CA3AF`.
- Línea de BAC: la de 60 mil, repetida en `#1D2751` con `stroke-dasharray="2 5"`, rotulada
  `BAC 60.000` en Poppins 700 `10px` a `x 240, y 55` (dentro del trazado, no en el borde).
- Zona posterior al corte: `rect` de `x 424` a `716`, `rgba(29,39,81,.03)`, con una línea vertical
  `1.5px` navy en `x 424` y el rótulo `CORTE · PERIODO 5` en Poppins 700 `10px` tracking `1`.
- PV recorre los ocho periodos (es el plan completo); EV y AC se detienen en el corte.
- Trazos: PV `#4A5568` `2px`, AC `#B45309` `2.5px`, EV `#00A19A` `3px` — el valor ganado es la
  serie protagonista y lleva el trazo más grueso. `stroke-linecap`/`linejoin: round`.
- Marcadores en el corte: círculo `r 4` para PV y AC; para EV, `r 5` con
  `stroke: #FFFFFF; stroke-width: 2`.
- Animación de entrada: `stroke-dasharray: 1400` + `@keyframes` de `stroke-dashoffset` 1400 → 0,
  `1.1s cubic-bezier(.4,0,.2,1)`, con retardos escalonados de `0 / .1s / .2s`. Bajo
  `prefers-reduced-motion` se salta al estado final.
- Proyección (bajo la bandera `showForecast`): banda `rgba(166,66,66,.12)` entre el escenario
  optimista y el pesimista desde el corte hasta el cierre, y la línea de EAC en `#A64242` `2.5px`
  con `stroke-dasharray="6 5"`, terminada en un círculo `r 4` y el rótulo `EAC 65.172` en Poppins
  700 `11px`.
- Eje x con los meses en Karla `11px` `#9CA3AF`; el mes del corte en Poppins 700 navy.

Datos del prototipo, consistentes con el reporte real (PV 32.000 / EV 29.000 / AC 31.500 /
EAC 65.172,41 en el periodo 5):

| Periodo | Mes | PV | EV | AC |
|---|---|---|---|---|
| 1 | May | 3.000 | 2.500 | 3.000 |
| 2 | Jun | 9.000 | 8.000 | 9.500 |
| 3 | Jul | 18.000 | 15.000 | 17.000 |
| 4 | Ago | 26.000 | 22.000 | 24.500 |
| 5 | Sep (corte) | 32.000 | 29.000 | 31.500 |
| 6 | Oct | 43.000 | — | — |
| 7 | Nov | 53.000 | — | — |
| 8 | Dic | 60.000 | — | — |

Bajo la curva, una tira de cuatro valores separada por `border-top: 1px solid #E5E7EB` con
`padding-top: 14px`: PV al corte, EV al corte, AC al corte y BAC, cada uno con overline Poppins 700
`10px` `#9CA3AF` y cifra Poppins 700 `19px` navy tabular. Estos cuatro **sí** vienen del reporte.

**Lo que falta en el backend.** Hoy solo existe el último estado de cada actividad; los indicadores
se calculan al leer y no se persisten. Para que esta gráfica sea real hace falta un snapshot por
fecha de corte:

- Tabla nueva, p. ej. `activity_snapshot(id, activity_id, cutoff_date, planned_progress_percent,
  actual_progress_percent, actual_cost, created_at)`, con índice único en
  `(activity_id, cutoff_date)`.
- Un endpoint `GET /projects/{id}/evm/history?from=&to=` que devuelva, por fecha de corte, el
  consolidado (PV, EV, AC acumulados) con las **mismas reglas del dominio** que ya están en
  `app/domain/` — sin duplicar la fórmula.
- Al guardar una actividad, escribir el snapshot del corte vigente (upsert por `cutoff_date`), de
  modo que registrar dos veces en el mismo periodo corrija en lugar de duplicar.

Mientras eso no exista, **la gráfica no debe implementarse con datos sintéticos sin el chip de
advertencia**. Un tablero que muestra una curva inventada es peor que uno que no la muestra.

#### 3.3 Puente de varianzas (nuevo)

Card estándar. Overline «Puente de varianzas», título «De lo planificado a lo gastado», bajada
«Dos saltos separan el plan del gasto: lo que no se hizo (SV) y lo que se pagó de más por lo que sí
se hizo (CV).»

Es un waterfall de cinco columnas que descompone la distancia entre PV y AC. Ambos saltos vienen
del reporte: `scheduleVariance` y `costVariance`. No se calcula nada.

Geometría, `viewBox="0 0 600 250"`: línea base en `y = 200`; escala `1.000 → 4.6875px`
(32.000 = 150px). Barras de `72px` de ancho en x `46, 164, 282, 400, 518`, radio `2px`, unidas por
líneas `#D1D5DB` con `stroke-dasharray="3 3"` al nivel que comparten.

| Columna | Rol | x | y | alto | Color | Cifra |
|---|---|---|---|---|---|---|
| PV | ancla, desde cero | 46 | 50 | 150 | `#4A5568` | 32.000 |
| SV | salto flotante | 164 | 50 | 14,1 | `#A64242` | −3.000 |
| EV | ancla, desde cero | 282 | 64,1 | 135,9 | `#00A19A` | 29.000 |
| CV | salto flotante | 400 | 52,4 | 11,7 | `#A64242` | −2.500 |
| AC | ancla, desde cero | 518 | 52,4 | 147,6 | `#B45309` | 31.500 |

CV es negativa (AC > EV), así que su barra **sube** desde el nivel de EV hasta el de AC. Un salto
favorable bajaría, en la tinta `#15803D`.

Cifra encima de cada barra en Poppins 700 `12px` en el color de la barra; debajo, la sigla en
Poppins 600 `11px` `#4A5568` y su glosa en Karla `10.5px` `#9CA3AF`: `planificado`, `trabajo no
hecho`, `trabajo hecho`, `sobrecosto`, `gastado`.

#### 3.4 Barras PV/EV/AC por actividad (rediseño de la gráfica existente)

Card estándar. Overline «Comparación», título «PV, EV y AC por actividad», bajada «Barras a la
misma escala de dinero. La marca vertical señala el presupuesto total de cada actividad.»

Cambio de orientación: de barras verticales agrupadas a **barras horizontales**. Los nombres de
actividad se leen sin truncar y sin rotar, y el eje de dinero queda compartido.

Geometría, `viewBox="0 0 540 250"`: eje en `x = 70`; escala `10.000 → 110px`. Rejilla vertical en
10/20/30/40 mil (`x = 180, 290, 400, 510`) con la primera en `#E5E7EB` y el resto en `#F3F4F6`;
rótulos abajo en Karla `11px` `#9CA3AF`.

Por actividad, tres barras de `9px` de alto separadas `3px`, radio `2px`, en el orden PV `#4A5568`
→ EV `#00A19A` → AC `#B45309`. Nombre a la izquierda del eje, `text-anchor: end`, Poppins 600
`12px` navy. Una línea vertical navy `1.5px` con `stroke-dasharray="3 2"` marca el BAC del grupo,
extendida `4px` por encima y por debajo de las tres barras.

Bandas del prototipo: Diseño en y `40/52/64` (BAC en `x 180`), Desarrollo en `100/112/124`
(BAC en `x 510`), Pruebas en `160/172/184` (BAC en `x 180`).

Leyenda en HTML bajo el SVG, separada por `border-top`, con cuatro entradas: PV, EV, AC (muestras
de `12×8px` radio `2px`) y BAC (una barra vertical de `2×12px` navy).

Verde y rojo quedan reservados al semáforo y **nunca** codifican una serie: el plan es tinta neutra
porque es la línea base, lo ganado toma el teal de marca y el gasto el ámbar.

**Accesibilidad**: el SVG lleva `role="img"` y `aria-label`. Además se mantiene la tabla oculta con
las mismas cifras que ya implementa `ActivityValuesTable` — un gráfico es una imagen, y la única
forma en que un lector de pantalla lo lee es como texto.

#### 3.5 Cuadrante por actividad (nuevo)

Card estándar. Overline «Cuadrante por actividad», título «Dónde está el problema», bajada «Cada
burbuja es una actividad; el diámetro es su presupuesto. Desarrollo es grande y está en el cuadrante
equivocado.»

Mismo lenguaje que el cuadrante del portafolio, `viewBox="0 0 440 340"`: trazado x `50…400`,
y `40…290`; referencias en `x = 190` (SPI 1,0) y `y = 147` (CPI 1,0); bandas verde `40…147` y roja
`147…290`.

Aquí el radio sí puede crecer, porque son tres puntos: `r = 10 + BAC / 40.000 × 14`.

| Actividad | CPI | SPI | BAC | cx | cy | r |
|---|---|---|---|---|---|---|
| Diseño | 1,1111 | 1,0000 | 10.000 | 190 | 94 | 13,5 |
| Desarrollo | 0,8000 | 0,8000 | 40.000 | 114 | 242 | 24 |
| Pruebas | 1,2000 | 1,5000 | 10.000 | 380 | 52 | 13,5 |

El **nombre va fuera** de la burbuja, `22px` por encima del borde superior, Poppins 700 `11.5px` en
la tinta del semáforo; el monto va dentro, Poppins 700 `8–10px`. Diseño cae sobre la línea SPI = 1
y lleva círculo blanco de fondo.

`CPI 1,0` va dentro del trazado a `x 56, y 142`; el título rotado `CPI · costo` a `x 16`.

#### 3.6 Mapa de calor de riesgo (nuevo, bajo la bandera `showRiskHeatmap`)

Card estándar. Overline «Mapa de calor», título «Riesgo por actividad y dimensión», bajada «Una fila
por actividad, una columna por lo que puede fallar. Sirve para decidir dónde intervenir primero.»

Rejilla CSS (no SVG): `grid-template-columns: minmax(90px, 1.2fr) repeat(4, minmax(64px, 1fr))`,
gap `4px`, Poppins.

Cabeceras en Poppins 700 `10px` tracking `.8px` mayúsculas `#9CA3AF`, centradas, con
`padding-bottom: 4px`: **Costo** (CPI), **Plazo** (SPI), **Cierre** (VAC), **Peso**.

Celdas: radio `4px`, padding `12px 6px`, centradas, Poppins 700 `12px`, fondo suave + tinta del
tono correspondiente. La columna «Peso» es neutra: `#F3F4F6` con `#4A5568`, y `#E5E7EB` con navy
cuando pasa del 50 % — una actividad que concentra la mitad del presupuesto merece leerse distinto.

| Actividad | Costo | Plazo | Cierre | Peso |
|---|---|---|---|---|
| Diseño | 1,11 favorable | 1,00 en meta | +1.000 favorable | 17 % |
| Desarrollo | 0,80 desfavorable | 0,80 desfavorable | −10.000 desfavorable | 67 % destacado |
| Pruebas | 1,20 favorable | 1,50 favorable | +1.667 favorable | 17 % |

Nota al pie en `12px` `#9CA3AF`: «Peso = participación de la actividad en el presupuesto total. Un
rojo con peso alto es lo único que mueve el consolidado.»

`Peso = indicators.budgetAtCompletion de la actividad / BAC del proyecto`. Es la única razón que se
calcula en el cliente, y es aritmética de presentación sobre dos cifras que ya vienen del reporte,
no un indicador EVM.

#### 3.7 Tabla de actividades (rediseño)

Card estándar con el botón primario «Nueva actividad» en la cabecera (si
`can('activity:create')`).

Las trece columnas actuales bajan a nueve. BAC, PV, CV, SV y VAC salen de la vista por defecto: ya
están en el puente, en las barras y en el mapa de calor. Quien necesite el número exacto entra al
detalle de la actividad.

`overflow-x: auto` con `min-width: 900px`. Cabeceras en Poppins 700 `10px` tracking `1px`
mayúsculas `#9CA3AF`, `padding: 0 10px 10px`, `border-bottom: 1px solid #E5E7EB`. Filas con
`border-bottom: 1px solid #F3F4F6`, `cursor: pointer`, hover `background: #F9F9F9`, navegación al
detalle.

| Columna | Contenido |
|---|---|
| Actividad | nombre en Poppins 600 `13.5px` navy; debajo, responsable en `11.5px` `#9CA3AF` |
| Tendencia | sparkline de `72×24px`: `polyline` de cinco puntos, `stroke-width 2`, `linecap`/`linejoin: round`, en la tinta del semáforo de costo. **Requiere el histórico** de 3.2; sin él, la columna no se pinta |
| Avance | barra apilada: pista `#F3F4F6` de `6px` radio `999px`, el planificado en `#D1D5DB` y el real en `#00A19A` encima, ambos como `width: {porcentaje}%`; al lado, el porcentaje real en `12px` tabular. Deja ver de un golpe si el real va por detrás del plan |
| EV | dinero, tabular, alineado a la derecha |
| AC | dinero, tabular, alineado a la derecha |
| CPI | chip Poppins 700 `12px`, radio `999px`, padding `3px 9px`, fondo suave + tinta del tono de costo |
| SPI | igual, con el tono de cronograma |
| EAC | dinero, tabular, alineado a la derecha |
| — | icono `arrow-right` en `#9CA3AF` |

Las notas del cálculo (`indicators.notes`) se muestran bajo el nombre de la actividad en `11px`
`#9CA3AF`, como ya se hace hoy.

Editar y eliminar dejan de ser botones en cada fila: viven en el detalle de la actividad. Trece
columnas más dos botones por fila es la razón por la que la tabla actual necesita scroll
horizontal en cualquier pantalla.

**Estado vacío**: «Este proyecto todavía no tiene actividades.» más el botón secundario «Crear la
primera actividad» si el rol lo permite.

**Proyecto sin actividades**: el reporte llega con dinero en cero, índices `null` y ambos estados
`NOT_APPLICABLE`. En ese caso la banda de lectura muestra «Todavía no hay nada que evaluar» con la
explicación, y **las seis visualizaciones no se dibujan**. El sistema dice que no hay nada que
evaluar en lugar de inventar ceros.

---

### 4 · Detalle de actividad (`/projects/:projectId/activities/:activityId`) — vista nueva

**Propósito**: entender una actividad y su historia sin salir a buscar el número a otra pantalla.
Es el destino del clic en cualquier fila de la tabla.

Ruta nueva. Puede resolverse con el reporte que ya se tiene en memoria (`report.activities.find`)
sin una petición adicional; solo el histórico requeriría el endpoint de 3.2.

**Layout**: botón «Volver al tablero» arriba (icono `arrow-left` + texto Poppins 600 `12px`
`#007F7A`, sin fondo, `align-self: flex-start`), y debajo una rejilla
`repeat(auto-fit, minmax(300px, 1fr))` con gap `16px` y `align-items: start`.

**Card izquierda — la actividad.**

- Overline «Actividad · {nombre del proyecto}», H3 Poppins 700 `22px` navy con el nombre, y una
  línea de `13px`: «Responsable: {nombre} · BAC {cifra}».
- **Alerta**, solo si la actividad concentra desviación: fondo `#F2DEDE`, radio `4px`, padding
  `14px 16px`, `display: flex; gap: 12px`. Icono `triangle-alert` de `18px`, `stroke-width 1.8`,
  `#A64242`, `flex-shrink: 0`. Título en Poppins 600 `13.5px` `#A64242` y cuerpo en `12.5px`
  `#A64242` `line-height 1.5`. Texto del prototipo: «Esta actividad explica toda la desviación del
  proyecto» / «Con CPI 0,80 y SPI 0,80, terminará en 50.000,00: 10.000,00 por encima de su
  presupuesto.»
- Cuatro fichas en `repeat(auto-fit, minmax(120px, 1fr))`, gap `12px`: fondo `#F9F9F9`, radio
  `4px`, padding `12px`, overline Poppins 700 `10px` `#9CA3AF` y cifra Poppins 700 `18px` tabular.
  PV, EV, AC y EAC — el EAC en la tinta de su semáforo.
- Barra de avance: encabezado con «Avance planificado {n} %» a la izquierda y «Avance real {n} %»
  a la derecha en `12px` `#4A5568`; debajo, la barra apilada de `10px` (pista `#F3F4F6`,
  planificado `#D1D5DB`, real `#00A19A`), radio `999px`.
- Botón primario «Registrar avance», visible solo si `can('activity:edit', activity)`. Junto a él
  van «Editar» (secundario) y «Eliminar» (terciario en `#A64242`) según
  `can('activity:delete', activity)`.

**Card derecha — historia.** Overline «Historia de la actividad», título «Curva de la actividad y
registros».

- Curva propia de la actividad, `viewBox="0 0 480 220"`: base en `y = 180`, rejilla en 0/10 mil/20
  mil (`y = 180 / 120 / 60`), cinco periodos en x `60, 160, 260, 360, 440`. Mismos tres trazos y
  grosores que la curva S; marcador `r 4.5` con borde blanco en el último punto de EV. El mes del
  corte en Poppins 700 navy.
- Lista de registros: `<ul>` sin viñetas, cada `<li>` con `display: flex; gap: 12px`, padding
  `11px 0`, `border-bottom: 1px solid #F3F4F6` (el último sin borde). Fecha en Poppins 700 `11px`
  `#9CA3AF` con `width: 74px; flex-shrink: 0`; descripción en Karla `13px` `#424242` con el valor
  nuevo en `<strong>` navy. Máximo dos niveles de negrita en un mismo bloque.

Tanto la curva como la lista **dependen del histórico de cortes**. Sin ese endpoint, esta card se
reduce a la lista con el único registro conocido (`updated_at` de la actividad), o no se muestra.

---

### 5 · Mis actividades (`/my-activities`, rol REGISTRAR)

**Propósito**: el registrador ve solo lo suyo y actualiza avance y costo.

Reemplaza `MyActivitiesPage.tsx`. La tabla de trece columnas se cambia por tarjetas: el registrador
no compara indicadores, actualiza dos números.

**Tira de KPIs**: `repeat(auto-fit, minmax(220px, 1fr))`, gap `14px`, tres cards con sombra
`--tc-sh-1`, padding `16px 18px`. Overline teal, cifra Poppins 700 `28px` tracking `-0.03em`,
leyenda `12px` `#9CA3AF`.

| Overline | Cifra | Leyenda |
|---|---|---|
| A mi cargo | `2` | actividades en 1 proyecto |
| Sin actualizar | `1` en `#B45309` | Pruebas · último registro hace 21 días |
| Mi aporte al EV | `13.000` | de 29.000 del proyecto |

«Sin actualizar» necesita `updated_at` de la actividad, que el API ya tiene. «Mi aporte al EV» es
la suma de `earnedValue` de las actividades propias sobre el EV del proyecto.

**Lista de actividades**: card estándar con overline «Asignadas», título «Actividades a mi cargo» y
bajada «Actualiza el avance real y el costo. Los indicadores los recalcula el servidor al guardar.»

Cada actividad es un `<article>` con borde `1px solid #E5E7EB`, radio `6px`, padding `14px 16px`,
`grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))`, gap `14px`, `align-items: center`:

1. Nombre en Poppins 600 `14.5px` navy y proyecto en `12px` `#9CA3AF`.
2. Barra de avance apilada de `8px` con «Plan {n} %» y «Real {n} %» en `11.5px` `#4A5568` encima.
3. Dos chips: `CPI {valor}` y `SPI {valor}`, Poppins 700 `11px`, radio `999px`, padding `4px 10px`,
   fondo suave + tinta del tono.
4. Botón secundario «Registrar», alineado a la derecha.

El registrador solo ve sus actividades y solo puede editarlas si
`activity.owner.id === user.id`. La regla ya está en `src/features/auth/permissions.ts` y el
backend responde `403` de todos modos.

**Estado vacío**: «No tienes actividades asignadas.»

---

### 6 · Panel de registro de avance — vista nueva

**Propósito**: registrar avance real y costo real viendo, antes de guardar, cómo queda la lectura.
Reemplaza el `ActivityFormDialog` centrado por un panel lateral.

Se abre desde: el ítem «Registrar avance» del sidebar, el botón «Registrar avance» del detalle de
actividad, y el botón «Registrar» de cada tarjeta en Mis actividades.

**Estructura — importante.** El fondo oscuro y el panel son **hermanos**, no anidados:

```
fondo:  position: fixed; inset: 0; background: rgba(10,16,40,.6); z-index: 80;  → onClick cierra
panel:  position: fixed; top: 0; right: 0; bottom: 0; z-index: 81;
        width: min(520px, 100%); background: #FFFFFF; overflow-y: auto;
        box-shadow: --tc-sh-3; display: flex; flex-direction: column;
```

Si el panel es hijo del fondo, cada clic dentro del panel burbujea al manejador de cierre y el
panel desaparece al tocar el deslizador. Con `stopPropagation` en el panel también funciona, pero
la estructura hermana no depende de que nadie olvide el handler.

**Cabecera**: `border-top: 3px solid #00A19A`, padding `20px 24px 16px`,
`border-bottom: 1px solid #E5E7EB`. Overline «{Proyecto} · {Actividad}», H3 Poppins 700 `20px`
navy «Registrar avance», y el botón de cierre (icono `x` de `20px`, `#9CA3AF`) arriba a la derecha.

**Cuerpo**: padding `20px 24px`, gap `18px`.

1. Bloque de contexto: fondo `#E8F6F7`, radio `4px`, padding `14px 16px`, texto `13px` navy
   `line-height 1.55`: «Solo se registran datos crudos: avance real y costo. El cálculo del valor
   ganado ocurre en el servidor, así que lo que veas abajo es la lectura que quedará en el
   tablero.»
2. **Avance real (%)**: label Poppins 600 `12px` `#4A5568`, `<input type="range" min="0" max="100">`
   con `accent-color: #00A19A` a ancho completo. Debajo, el valor en Poppins 700 `30px` navy
   tabular tracking `-0.03em` con el `%` en Poppins 600 `15px` `#9CA3AF`, y a la derecha
   «Planificado a la fecha: {n} %» en `12px` `#9CA3AF`. El deslizador es el control principal
   porque el dato es un porcentaje acotado; el número exacto se lee al lado.
3. **Costo real acumulado (AC)**: `<input type="number">` con el estilo de input estándar y la
   ayuda «Dinero ya gastado en la actividad. Presupuesto total: {BAC}».
4. **Previsualización**: separada por `border-top: 1px solid #E5E7EB`, `padding-top: 16px`.
   Overline «Cómo queda la actividad». Cuatro fichas en `repeat(auto-fit, minmax(110px, 1fr))`,
   gap `10px`, fondo `#F9F9F9`, radio `4px`, padding `12px`: EV, CPI, SPI y EAC — CPI y SPI en la
   tinta de su semáforo. Debajo, una lectura en palabras, `12.5px` `#424242` `line-height 1.55`,
   con las cinco variantes:
   - CPI no calculable (AC = 0): «Sin costo registrado el CPI no es calculable: el sistema lo marca
     como no aplica en vez de mostrar cero.»
   - CPI < 1 y SPI < 1: «Con estos datos la actividad queda cara y atrasada: cada peso gastado
     produce menos de un peso de trabajo y el avance va por detrás del plan.»
   - CPI ≥ 1 y SPI ≥ 1: «Con estos datos la actividad queda bajo presupuesto y al día. Es el único
     escenario en que ambos semáforos quedan en verde.»
   - CPI ≥ 1 y SPI < 1: «Barata pero atrasada: el ahorro viene de trabajo que todavía no se ha
     hecho, no de eficiencia.»
   - CPI < 1 y SPI ≥ 1: «Adelantada pero cara: avanzar rápido no significa avanzar bien.»

**Pie**: `margin-top: auto`, `border-top: 1px solid #E5E7EB`, padding `16px 24px`,
`justify-content: flex-end`, gap `10px`. «Cancelar» (terciario) y «Guardar avance» (primario).

> **Decisión pendiente sobre la previsualización.** El prototipo calcula EV, CPI, SPI y EAC en el
> cliente para mostrar el efecto en vivo, y eso **duplica la fórmula del dominio** — exactamente lo
> que el repositorio evita a propósito (306 pruebas comparan contra los valores resueltos a mano en
> `docs/EVM_GUIA.md`, no contra la implementación). Tres salidas, en orden de preferencia:
>
> 1. **Endpoint de simulación**: `POST /projects/{id}/activities/{aid}/evm:preview` que reciba el
>    input propuesto y devuelva los indicadores sin persistir, reutilizando `app/domain/`. Una
>    petición con debounce de ~250 ms mientras se mueve el deslizador. Es la única opción con una
>    sola fuente de verdad.
> 2. **Quitar la previsualización numérica** y dejar solo la barra de avance planificado vs. real,
>    que no requiere cálculo.
> 3. **Aceptar el cálculo en el cliente** solo para esta previsualización, marcado en la UI como
>    estimación y cubierto por pruebas que comparen contra las mismas fixtures del dominio.
>
> Fórmulas, si se toma el camino 3: `EV = BAC × avanceReal / 100` · `PV = BAC × avancePlan / 100` ·
> `CPI = AC === 0 ? null : EV / AC` · `SPI = PV === 0 ? null : EV / PV` ·
> `EAC = CPI === null ? null : BAC / CPI`. Redondeo a 4 decimales en índices y 2 en dinero, y
> `null` — nunca cero ni infinito — cuando el denominador es cero.

**Al guardar**: `PUT /projects/{id}/activities/{aid}` con `{ name, budgetAtCompletion,
plannedProgressPercent, actualProgressPercent, actualCost }`, cerrar el panel, disparar
`onDataChanged` y mostrar un toast. Toda la infraestructura existe en `useActivityMutation` y
`ActivityFormDialog`.

**Validación** (ya implementada en `activity-form.ts`, se conserva): nombre obligatorio con tope de
longitud; porcentajes entre 0 y 100; costo ≥ 0; BAC > 0. Errores de campo bajo el input en `12px`
`#A64242`; errores generales del servidor en el bloque `role="alert"`. `400` con detalle de campo se
mapea al campo correspondiente; `403` muestra «No tienes permiso para editar esta actividad».

---

## Interactions & Behavior

**Navegación** (rutas de `src/constants/routes.ts`, más una nueva):

| Origen | Destino |
|---|---|
| Login → según rol | `/projects` (REVIEWER) · `/my-activities` (REGISTRAR) |
| Fila del portafolio | `/projects/{id}` |
| Fila de la tabla de actividades | `/projects/{id}/activities/{aid}` ← **ruta nueva** |
| «Volver al tablero» | `/projects/{id}` |
| Sidebar | `/projects` · `/projects/{id}` · `/my-activities` |
| «Registrar avance» / «Registrar» | abre el panel lateral sin cambiar de ruta |

`RequireAuth` recuerda la ruta de origen y `RequireRole` redirige a `/` cuando el rol no
corresponde. Ambos se conservan.

**Transiciones**: entrada de vista con fundido y desplazamiento (`usePageTransition`, ya existe);
entrada escalonada de tarjetas y filas (`useStaggerReveal`); contador que anima hacia el nuevo
valor en cada cifra (`useCountUp` / `AnimatedNumber`); cross-fade del color del semáforo cuando
cambia el tono (`useStatusColorTween`). Duraciones 120–250 ms con `--tc-ease`. La UI nunca espera a
una animación, y todo salta al estado final bajo `prefers-reduced-motion`.

**Trazado de curvas**: `stroke-dasharray` + `stroke-dashoffset` animado, `1.1s`, escalonado
`0 / .1s / .2s`. Es la única animación que dura más de 250 ms y se justifica porque dibuja el dato;
también se salta bajo `prefers-reduced-motion`.

**Panel lateral**: entra desde la derecha con `transform: translateX(100%) → 0` en `.25s`
`--tc-ease`; el fondo oscuro entra con fundido. Cierra con clic en el fondo, con el botón `x`, con
«Cancelar» y con `Escape`. Foco atrapado dentro del panel mientras está abierto, y devuelto al
elemento que lo abrió al cerrar.

**Hover**: cards interactivas suben `1px` con sombra de `--tc-sh-1` a `--tc-sh-2`; filas de tabla
toman fondo `#F9F9F9`; ítems de nav se desplazan `2px` con fondo `rgba(255,255,255,.09)`; CTAs
toman `--tc-glow-cta`. Press: `translateY(1px)`, sin inversión de color.

**Foco**: `outline: 2px solid #00A19A` con `offset: 2px` en cualquier elemento interactivo; los
inputs además toman `--tc-sh-focus`. Todas las filas clicables deben ser alcanzables por teclado
(usar `<a>` o `<button>`, o `role` + `tabIndex` + manejador de `Enter`).

**Carga**: skeletons con la forma del contenido cargado — nunca un spinner centrado. Fondo
`#F3F4F6`, radio `2px`, con el barrido que ya existe. Las gráficas muestran un rectángulo de su
altura final para que el layout no salte.

**Error**: bloque con fondo `#F2DEDE`, radio `4px`, padding `14px 16px`, icono `triangle-alert`,
mensaje y un botón «Reintentar» que llama al `refetch` de la consulta. Un `401` cierra la sesión y
redirige al login, como ya lo hace el cliente API.

**Responsive**: el shell es de escritorio. Por debajo de `900px` el sidebar colapsa a un cajón
disparado desde la topbar, la tira de KPIs pasa a dos columnas, las rejillas de gráficas a una, y
las tablas mantienen `overflow-x: auto`. El panel lateral pasa a ancho completo
(`width: min(520px, 100%)` ya lo hace). Los SVG son fluidos: `width: 100%; height: auto` sobre el
`viewBox`, sin unidades de viewport.

**Accesibilidad**: cada SVG con `role="img"` y `aria-label` descriptivo; la tabla oculta con las
cifras se conserva junto a cada gráfica; el semáforo nunca comunica solo por color — siempre lleva
su etiqueta en texto («Sobre presupuesto», no solo un punto rojo); contraste mínimo 4,5:1 en texto,
que es la razón de la división `#00A19A` / `#007F7A`.

---

## State Management

Sin cambios de arquitectura. Lo que ya existe se conserva:

- `AuthProvider` guarda `{ accessToken, user }` en memoria y `sessionStorage`; el cliente API
  inyecta `Authorization: Bearer` y cierra sesión ante un `401`.
- `useApiQuery` / `useEvmReport` / `usePortfolio` para lectura; `useActivityMutation` para
  escritura.
- El tablero es dueño de **una** petición del reporte y la reparte a las siete visualizaciones y a
  la tabla. Cualquier mutación llama a `onDataChanged` → `refetch`, y todo se actualiza a la vez.
  Esta es la propiedad que hace que el rediseño escale a siete gráficas sin siete peticiones.

Estado local nuevo, todo de UI:

| Estado | Dónde | Para qué |
|---|---|---|
| `registerPanel: { activityId, projectId } \| null` | tablero, detalle, mis actividades | panel lateral abierto y sobre qué actividad |
| `draft: { actualProgressPercent, actualCost }` | panel de registro | valores del formulario en curso |
| `showForecast: boolean` | tablero | mostrar la banda de proyección EAC (por defecto `true`) |
| `showRiskHeatmap: boolean` | tablero | mostrar el mapa de calor (por defecto `true`) |

Las dos banderas existen como props tweakables en el prototipo; en producción pueden ser
preferencias del usuario persistidas en `localStorage`, o simplemente quedar fijas en `true`.

**Datos que hoy no existen**, resumidos:

1. **Histórico por fecha de corte** — necesario para la curva S (3.2), los sparklines de la tabla
   (3.7) y la historia de la actividad (4). Propuesta de tabla y endpoint en 3.2.
2. **Simulación de indicadores sin persistir** — necesaria para la previsualización del panel de
   registro (6) sin duplicar el dominio. Propuesta de endpoint en el recuadro de 6.

Todo el resto del rediseño se implementa con el contrato actual de
`docs/api/openapi.yaml`, sin tocar el backend.

---

## Assets

| Archivo | Origen | Uso |
|---|---|---|
| `design/assets/symbol-trycore.svg` | sistema de diseño Trycore | símbolo orbital en la tesela de marca (sidebar y login), en blanco vía `filter: brightness(0) invert(1)` |
| `design/assets/logo-trycore-mono-white.svg` | sistema de diseño Trycore | logotipo a una tinta, para fondos navy plenos |
| Poppins, Karla | Google Fonts, cargadas por `design/_ds/.../tokens/fonts.css` | tipografía del sistema |
| Iconos | **Lucide** (MIT) | los paths exactos, con `stroke-width` correcto, están en el sistema de diseño en `ui_kits/trysynergy/Icons.jsx` |

No hay fotografía en el producto. Toda la geometría orbital de los prototipos son círculos y nodos
SVG de 1px, no ilustración: si hace falta imaginería de marca, se pide a diseño.

Los tokens del sistema van en `design/_ds/trycore-design-system-c9f19ad5-3b9a-484e-84ad-01ba3bfa5eb0/`
— cópielos a `src/styles/` o expóngalos como variables CSS y mapéelos al `@theme inline` de
Tailwind, tal como hoy hace `src/styles/theme.css` con los tokens actuales. Ese archivo es el punto
de cambio: al reapuntar los `--color-*` a los nuevos valores, todas las utilidades
(`bg-surface`, `text-ink-muted`, `shadow-card`) siguen funcionando.

---

## Files

**Referencias de diseño**, en `design/`:

| Archivo | Qué es |
|---|---|
| `Striker EVM · Rediseño.dc.html` | **El entregable.** Las seis vistas, navegables. Se abre en el navegador. Entrar por cualquiera de los dos botones del login. |
| `Striker EVM · Estado actual.dc.html` | Recreación 1:1 del frontend actual (login, portafolio, tablero, mis actividades) con sus tokens exactos. Sirve de línea base para comparar qué cambia. |
| `support.js` | Runtime de los prototipos. **No se usa en la implementación.** |
| `assets/` | Símbolo y logotipo de Trycore. |
| `_ds/trycore-design-system-.../` | Tokens del sistema de diseño: `tokens/colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css`, `identity.css`, `base.css`, más `styles.css` y el bundle de componentes React. |

**Archivos del repositorio que cambian** (`frontend/`):

| Ruta | Acción |
|---|---|
| `src/styles/tokens.css` | reemplazar el bloque de marca y el semáforo EVM por los tokens Trycore |
| `src/styles/theme.css` | reapuntar el `@theme inline` a los nuevos tokens |
| `src/styles/base.css` | Poppins/Karla en lugar de Inter; `--tc-ease` como easing canónico |
| `src/evm/tone.ts` | mismos cuatro tonos, valores nuevos |
| `src/features/layout/*` | shell nuevo: sidebar navy con grupos, topbar con acento teal |
| `src/components/ui/*` | Button, Card, StatusPill, TextField, PageHeader con la forma y los radios nuevos |
| `src/features/projects/ProjectsPage.tsx`, `ProjectCard.tsx` | tira de KPIs + cuadrante + lista densa |
| `src/features/projects/ProjectDashboardPage.tsx` | orden nuevo de secciones |
| `src/features/summary/*` | banda de lectura navy en lugar del panel de indicadores |
| `src/features/chart/*` | curva S, puente, barras horizontales, cuadrante, mapa de calor, gauges |
| `src/features/activities/ActivitiesTable.tsx` | nueve columnas, sparkline, barra de avance |
| `src/features/activities/ActivityFormDialog.tsx` | panel lateral con previsualización |
| `src/features/activities/MyActivitiesPage.tsx` | tarjetas en lugar de tabla |
| `src/app/router.tsx`, `src/constants/routes.ts` | ruta nueva de detalle de actividad |

**Archivos del repositorio que NO cambian**: todo `backend/` salvo lo indicado en las dos
propuestas de endpoint; `src/api/*` (el contrato es el mismo); `src/features/auth/*` (la matriz de
permisos no se toca); `src/motion/*` (los hooks sirven tal cual); `src/mocks/*` (las fixtures son
las mismas). Las 117 pruebas del frontend que verifican comportamiento y accesibilidad deben seguir
pasando; las que aserten clases de Tailwind o valores hex antiguos hay que actualizarlas.

---

## Orden de implementación sugerido

1. **Tokens y shell.** `tokens.css`, `theme.css`, `base.css`, sidebar y topbar. Con esto la
   aplicación entera cambia de identidad y todo lo demás se construye encima. Verificar que
   `scrollWidth === clientWidth` en la topbar a 900px de ancho: el buscador es el elemento
   elástico.
2. **Primitivas de UI.** Button, Card, StatusPill, inputs, chips. Los radios bajan a 6px y las
   sombras se vuelven neutrales.
3. **Portafolio.** Tira de KPIs, lista densa y cuadrante. El cuadrante introduce el lenguaje de
   dispersión que luego se reutiliza por actividad.
4. **Tablero, sin las piezas que necesitan histórico.** Banda de lectura, puente, barras
   horizontales, cuadrante por actividad, mapa de calor y tabla de nueve columnas. Aquí el tablero
   ya es utilizable.
5. **Detalle de actividad y panel de registro.** Ruta nueva y panel lateral. Decidir antes cuál de
   las tres salidas de la previsualización se toma.
6. **Mis actividades.**
7. **Histórico de cortes.** Tabla, endpoint y snapshot al guardar. Solo entonces se activan la curva
   S sin su chip de advertencia, los sparklines y la historia de la actividad.

## Qué verificar al terminar

- Los diez indicadores del reporte siguen visibles en alguna parte del tablero.
- Un indicador `null` se muestra como `—` en todas partes, y ningún arco, barra ni burbuja lo dibuja
  como cero.
- Un proyecto sin actividades muestra «Todavía no hay nada que evaluar» y ninguna gráfica.
- Los ocho proyectos de `init.sql` se leen correctamente, incluidos los cuatro casos borde de
  `App móvil de campo` y el `EAC = AC` de `Certificación ISO 27001`.
- Un `REGISTRAR` no ve acciones sobre actividades ajenas, y el backend sigue respondiendo `403` si
  se intentan por otra vía.
- Ninguna topbar ni tabla desborda el viewport a 900px.
- Con `prefers-reduced-motion`, ninguna animación corre y todo aparece en su estado final.
- El semáforo se entiende sin color: cada tono lleva su etiqueta en texto.
