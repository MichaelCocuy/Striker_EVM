"""Request and response models of the v1 API (camelCase on the wire, snake_case in Python).

These classes are the published schemas of the API: FastAPI turns each class docstring into the
`description` of the component and each `Field(description=...)` into the description of a
property, so both are written in Spanish, the language of `/api-docs`. Helper methods keep the
short English docstrings the rest of the code uses, and the example of every schema comes from
`app/api/v1/docs/examples.py`.
"""
