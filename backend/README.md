# Striker EVM — backend

Python backend for Striker EVM. This package currently contains the pure EVM domain
(`app/domain/evm`) and its unit tests; the FastAPI application and persistence layers are
added by later modules.

## Requirements

- Python 3.12 or newer.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows (Git Bash); on Linux/macOS: source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e .[dev]
```

## Run the tests with coverage

```bash
pytest --cov
```

Coverage is measured over `app/` and the run fails below 80 % (see `pyproject.toml`).

## Lint and format

```bash
ruff check .
ruff format --check .
```

Use `ruff format .` to apply formatting.
