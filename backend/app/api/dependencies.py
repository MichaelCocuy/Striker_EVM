"""Reusable FastAPI dependencies shared by the routers."""

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.infrastructure.db.repositories import SqlAlchemyUserRepository
from app.infrastructure.db.session import get_db_session
from app.infrastructure.security import BcryptPasswordHasher, JwtTokenService

DbSession = Annotated[Session, Depends(get_db_session)]


def get_app_settings(request: Request) -> Settings:
    """Settings the application was created with (see `create_app`)."""
    return request.app.state.settings


AppSettings = Annotated[Settings, Depends(get_app_settings)]


def get_user_repository(session: DbSession) -> SqlAlchemyUserRepository:
    """User repository bound to the request session."""
    return SqlAlchemyUserRepository(session)


UserRepo = Annotated[SqlAlchemyUserRepository, Depends(get_user_repository)]


def get_token_service(settings: AppSettings) -> JwtTokenService:
    """Token service configured from the JWT settings."""
    return JwtTokenService(
        settings.jwt_secret, settings.jwt_algorithm, settings.jwt_expires_minutes
    )


Tokens = Annotated[JwtTokenService, Depends(get_token_service)]


def get_password_hasher(settings: AppSettings) -> BcryptPasswordHasher:
    """Password hasher with the configured bcrypt cost."""
    return BcryptPasswordHasher(rounds=settings.bcrypt_rounds)


Hasher = Annotated[BcryptPasswordHasher, Depends(get_password_hasher)]
