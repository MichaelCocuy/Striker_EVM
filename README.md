# Striker EVM

Herramienta interna para que líderes de proyecto registren el avance de sus actividades y
vean, en tiempo real, si el proyecto va bien o mal en cronograma y presupuesto usando
**Earned Value Management (EVM / Valor Ganado)**, estándar del PMI.

Desafío técnico para el cargo de Ingeniero de Desarrollo en Trycore Colombia. El
enunciado completo está en [`docs/reto.md`](docs/reto.md).

## Estado

En construcción. Este README se completa con las instrucciones de ejecución local y el
script de inicialización de base de datos cuando el backend y el frontend estén integrados.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/reto.md`](docs/reto.md) | Enunciado del desafío (transcripción del PDF original) |
| [`docs/EVM_GUIA.md`](docs/EVM_GUIA.md) | Qué es el Valor Ganado, qué significa cada indicador, casos borde y un ejemplo resuelto paso a paso |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Arquitectura, descomposición en módulos, dependencias y plan de construcción en paralelo |
| [`docs/GITFLOW.md`](docs/GITFLOW.md) | Reglas de ramas, Pull Requests y mensajes de commit |
| [`AI_PROCESS.md`](AI_PROCESS.md) | Proceso de trabajo con IA: herramientas, prompts textuales en orden, decisiones y reflexión |

## Flujo de trabajo

Gitflow estricto: `main` (producción), `develop` (integración), `feature/*` por módulo,
`release/*` antes de cada versión. Todo cambio entra a `develop` mediante Pull Request.
Detalles en [`docs/GITFLOW.md`](docs/GITFLOW.md).
