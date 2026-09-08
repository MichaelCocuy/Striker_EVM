"""Example payloads shown in `/api-docs`, taken from `docs/api/fixtures`.

They are literals rather than reads of the fixture files, because the fixtures are documentation
that is not shipped inside the container. The numbers are those of the worked example of
`docs/EVM_GUIA.md` section 6 (project "Portal de clientes"), so what the reader sees in Swagger
UI is the same data the tests assert against.
"""

REVIEWER_ID = "11111111-1111-4111-8111-000000000001"
REGISTRAR_ID = "11111111-1111-4111-8111-000000000002"
SECOND_REGISTRAR_ID = "11111111-1111-4111-8111-000000000003"
PROJECT_ID = "22222222-2222-4222-8222-000000000001"
ACTIVITY_ID = "33333333-3333-4333-8333-000000000002"
TIMESTAMP = "2026-09-08T12:00:00Z"

HEALTH_EXAMPLE = {"status": "ok", "database": "ok", "version": "0.1.0"}

USER_SUMMARY_EXAMPLE = {"id": SECOND_REGISTRAR_ID, "fullName": "Ana Registradora"}

USER_EXAMPLE = {
    "id": REVIEWER_ID,
    "email": "revisor@striker.local",
    "fullName": "Laura Revisora",
    "role": "REVIEWER",
}

LOGIN_REQUEST_EXAMPLE = {"email": "revisor@striker.local", "password": "Striker2026!"}

LOGIN_RESPONSE_EXAMPLE = {
    "accessToken": (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0wMDAwMDAw"
        "MDAwMDEiLCJyb2xlIjoiUkVWSUVXRVIifQ.ECxzZpnA5iwwxG6UF5VvqNNC9fcTQgmCFJcKVs79PBU"
    ),
    "tokenType": "bearer",
    "expiresIn": 28800,
    "user": USER_EXAMPLE,
}

PROJECT_INPUT_EXAMPLE = {
    "name": "Portal de clientes",
    "description": "Portal web de autogestión para clientes corporativos.",
}

PROJECT_EXAMPLE = {
    "id": PROJECT_ID,
    **PROJECT_INPUT_EXAMPLE,
    "activityCount": 3,
    "createdBy": {"id": REVIEWER_ID, "fullName": "Laura Revisora"},
    "createdAt": TIMESTAMP,
    "updatedAt": TIMESTAMP,
}

ACTIVITY_MEASURES_EXAMPLE = {
    "budgetAtCompletion": 40000.00,
    "plannedProgressPercent": 50.00,
    "actualProgressPercent": 40.00,
    "actualCost": 20000.00,
}

ACTIVITY_INPUT_EXAMPLE = {
    "name": "Desarrollo",
    "ownerId": SECOND_REGISTRAR_ID,
    **ACTIVITY_MEASURES_EXAMPLE,
}

ACTIVITY_EXAMPLE = {
    "id": ACTIVITY_ID,
    "projectId": PROJECT_ID,
    "name": "Desarrollo",
    "owner": USER_SUMMARY_EXAMPLE,
    **ACTIVITY_MEASURES_EXAMPLE,
    "createdAt": TIMESTAMP,
    "updatedAt": TIMESTAMP,
}

EVM_INDICATORS_EXAMPLE = {
    "budgetAtCompletion": 40000.00,
    "plannedValue": 20000.00,
    "earnedValue": 16000.00,
    "actualCost": 20000.00,
    "costVariance": -4000.00,
    "scheduleVariance": -4000.00,
    "costPerformanceIndex": 0.8000,
    "schedulePerformanceIndex": 0.8000,
    "estimateAtCompletion": 50000.00,
    "varianceAtCompletion": -10000.00,
    "costStatus": "OVER_BUDGET",
    "scheduleStatus": "BEHIND_SCHEDULE",
    "notes": [],
}

EVM_ACTIVITY_REPORT_EXAMPLE = {
    "id": ACTIVITY_ID,
    "name": "Desarrollo",
    "owner": USER_SUMMARY_EXAMPLE,
    "input": ACTIVITY_MEASURES_EXAMPLE,
    "indicators": EVM_INDICATORS_EXAMPLE,
}

EVM_PROJECT_SUMMARY_EXAMPLE = {
    "id": PROJECT_ID,
    "name": "Portal de clientes",
    "indicators": {
        "budgetAtCompletion": 60000.00,
        "plannedValue": 32000.00,
        "earnedValue": 29000.00,
        "actualCost": 31500.00,
        "costVariance": -2500.00,
        "scheduleVariance": -3000.00,
        "costPerformanceIndex": 0.9206,
        "schedulePerformanceIndex": 0.9063,
        "estimateAtCompletion": 65172.41,
        "varianceAtCompletion": -5172.41,
        "costStatus": "OVER_BUDGET",
        "scheduleStatus": "BEHIND_SCHEDULE",
        "notes": [],
    },
}

EVM_REPORT_EXAMPLE = {
    "project": EVM_PROJECT_SUMMARY_EXAMPLE,
    "activities": [EVM_ACTIVITY_REPORT_EXAMPLE],
    "generatedAt": TIMESTAMP,
}
