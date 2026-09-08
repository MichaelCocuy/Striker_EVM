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
| **Claude Code** (CLI, modelo Claude Fable 5.1) | Asistente principal: lectura del enunciado, aprendizaje de EVM, propuesta de arquitectura, configuración del repositorio, generación y revisión de código. | Trabaja directamente sobre el sistema de archivos y la terminal, lo que permite que cada prompt se traduzca en archivos y commits verificables. Permite registrar el proceso tal como ocurrió. |

_(Se agregarán otras herramientas si se usan.)_

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

---

## 3. Cómo aprendí EVM y cómo validé las fórmulas

_Pendiente de completar a medida que avance el aprendizaje. Punto de partida: el Prompt 1
pidió una explicación conceptual (no solo fórmulas) y un ejemplo resuelto a mano con tres
actividades, que servirá como oráculo para las pruebas unitarias. Ver
[`docs/EVM_GUIA.md`](docs/EVM_GUIA.md)._

---

## 4. Decisiones donde no seguí a la IA

_Pendiente. Se registrarán aquí al menos dos decisiones: qué propuso la IA, qué se hizo en
su lugar y por qué._

---

## 5. Cómo verifiqué que los cálculos son correctos

_Pendiente. Estrategia prevista: el ejemplo de tres actividades de `docs/EVM_GUIA.md` se
resolvió a mano antes de escribir código; las pruebas unitarias usan esos mismos números
como valores esperados, y la interpretación (sobre/bajo presupuesto, adelantado/atrasado)
se contrasta con la intuición del caso._

---

## 6. Decisión de arquitectura tomada de forma independiente

_Pendiente._

---

## 7. Reflexión: qué haría diferente

_Pendiente. Se escribe al final del ejercicio._
