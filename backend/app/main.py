"""FastAPI application factory and ASGI entry point (`uvicorn app.main:app`)."""

from functools import partial

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import register_error_handlers
from app.api.openapi import (
    APP_CONTACT,
    APP_DESCRIPTION,
    APP_LICENSE,
    APP_SERVERS,
    APP_SUMMARY,
    OPENAPI_TAGS,
    build_openapi,
)
from app.api.v1.router import router as api_v1_router
from app.core.config import APP_TITLE, APP_VERSION, Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the application: metadata, CORS, uniform errors and the versioned routers."""
    settings = settings or get_settings()
    application = FastAPI(
        title=APP_TITLE,
        version=APP_VERSION,
        summary=APP_SUMMARY,
        description=APP_DESCRIPTION,
        contact=APP_CONTACT,
        license_info=APP_LICENSE,
        servers=APP_SERVERS,
        openapi_tags=OPENAPI_TAGS,
        docs_url=settings.docs_url,
        openapi_url=settings.openapi_url,
        redoc_url=None,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.state.settings = settings
    application.openapi = partial(build_openapi, application)
    register_error_handlers(application)
    application.include_router(api_v1_router, prefix=settings.api_v1_prefix)
    return application


app = create_app()
