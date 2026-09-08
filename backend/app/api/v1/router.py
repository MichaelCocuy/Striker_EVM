"""Aggregates every v1 router under a single include point."""

from fastapi import APIRouter

from app.api.v1 import auth, evm, health, users

router = APIRouter()
router.include_router(health.router)
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(evm.router)
