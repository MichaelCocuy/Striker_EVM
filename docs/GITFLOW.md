# Flujo de trabajo Git (Gitflow)

El historial del repositorio es parte de la entrega. Estas son las reglas que se aplican
desde el primer commit.

## Ramas

| Rama | Propósito | Recibe cambios desde | Vía |
|---|---|---|---|
| `main` | Producción. Solo código liberado. | `release/*` (y `hotfix/*` si hiciera falta) | Pull Request |
| `develop` | Integración. Rama por defecto del repositorio. | `feature/*` | Pull Request |
| `feature/<modulo>` | Una funcionalidad o módulo. Nace de `develop`. | trabajo local | commits |
| `release/<version>` | Preparación de la versión (README final, versión, ajustes menores). Nace de `develop`. | trabajo local | commits |

Reglas:

- **Nunca** se hace commit directo en `main` ni en `develop`. La única excepción es el
  commit inicial que crea `main`.
- Cada `feature/*` entra a `develop` mediante Pull Request, aunque el autor sea el único
  desarrollador. El PR se mergea con *merge commit* (no squash) para conservar el historial
  de la rama.
- Antes del merge final a `main` existe al menos una rama `release/*`. Al cerrarla se
  mergea a `main` (PR) y se etiqueta (`v1.0.0`); luego `main` se vuelve a mergear en
  `develop` para que ambas queden alineadas.
- Una rama `feature/*` por módulo, con el nombre del módulo definido en
  [`ARQUITECTURA.md`](ARQUITECTURA.md). Ejemplos: `feature/backend-evm-domain`,
  `feature/frontend-activities-table`.

## Mensajes de commit

- En **imperativo** e **inglés**, describiendo qué hace el cambio: `Add EVM calculation
  service`, `Fix CPI edge case when AC is zero`, `Document Gitflow branching rules`.
- Una línea de asunto de hasta ~72 caracteres. Si hace falta contexto, cuerpo separado por
  una línea en blanco.
- No se aceptan mensajes como `fix`, `cambios`, `wip`, `update`.

## Comandos de referencia

```bash
# Crear una feature desde develop
git checkout develop && git pull
git checkout -b feature/backend-evm-domain

# Publicar y abrir el PR hacia develop
git push -u origin feature/backend-evm-domain
gh pr create --base develop --title "Add EVM domain calculations" --body "..."

# Mergear conservando historial y borrar la rama remota
gh pr merge --merge --delete-branch

# Release
git checkout develop && git pull
git checkout -b release/1.0.0
# ... ajustes finales, commit ...
git push -u origin release/1.0.0
gh pr create --base main --title "Release 1.0.0"
gh pr merge --merge
git checkout main && git pull && git tag -a v1.0.0 -m "Release 1.0.0" && git push --tags
git checkout develop && git merge main && git push
```

## Protecciones configuradas en GitHub

- Rama por defecto: `develop` (los PR apuntan ahí por omisión).
- `main` protegida: requiere Pull Request, sin push directo.
