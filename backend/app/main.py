"""FastAPI application factory and ASGI entry point (`uvicorn app.main:app`)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import register_error_handlers
from app.api.v1.router import router as api_v1_router
from app.core.config import APP_DESCRIPTION, APP_TITLE, APP_VERSION, Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the application: metadata, CORS, uniform errors and the versioned routers."""
    settings = settings or get_settings()
    application = FastAPI(
        title=APP_TITLE,
        version=APP_VERSION,
        description=APP_DESCRIPTION,
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
    register_error_handlers(application)
    application.include_router(api_v1_router, prefix=settings.api_v1_prefix)
    return application


app = create_app()
