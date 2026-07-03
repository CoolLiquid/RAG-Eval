from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import evaluations, health, kb, question_banks
from app.core.config import settings

app = FastAPI(
    title="知识库测评平台 API",
    version=settings.app_version,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(kb.router, prefix="/api")
app.include_router(evaluations.router, prefix="/api")
app.include_router(question_banks.router, prefix="/api")
