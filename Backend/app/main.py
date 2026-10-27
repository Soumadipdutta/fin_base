import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes.companies import router as companies_router
from app.api.routes.accounts import router as accounts_router
from app.api.routes.invoices import router as invoices_router
from app.api.routes.obligations import router as obligations_router
from app.api.routes.forecast import router as forecast_router
from app.api.routes.risks import router as risks_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes import optimization
from app.schemas.obligation import ObligationCreate, ObligationResponse
from app.schemas.optimization import OptimizationResponse
from app.routers.copilot import router as copilot_router
from app.routers import copilot_memory
from app.routers import copilot_conversations
from app.core.company_access import require_allowed_company
from app.api.routes import scenarios
from app.api.routes.optimization_routes import (router as optimization_history_router)
from app.api.routes import financial_alerts
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("FlowPilot API is starting...")
    yield
    print("FlowPilot API is shutting down...")


app = FastAPI(
    title="FlowPilot API",
    description=(
        "An uncertainty-aware liquidity optimization platform "
        "for SaaS businesses managing international payments."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.error(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred."
        },
    )
# app.include_router(companies_router, prefix="/api/v1")
app.include_router(accounts_router, prefix="/api/v1")
app.include_router(invoices_router, prefix="/api/v1")
app.include_router(obligations_router, prefix="/api/v1")
app.include_router(forecast_router, prefix="/api/v1")
app.include_router(risks_router, prefix="/api/v1")
app.include_router(simulation_router, prefix="/api/v1")
app.include_router(
    optimization.router,
    prefix="/api/v1",
    tags=["Optimization"],
)
app.include_router(copilot_router, prefix="/api/v1")
app.include_router(
    copilot_memory.router,
    prefix="/api/v1",
)
app.include_router(
    copilot_conversations.router,
    prefix="/api/v1",
)
app.include_router(
    companies_router,
    prefix="/api/v1",
    dependencies=[Depends(require_allowed_company)],
)
app.include_router(
    scenarios.router,
    prefix="/api/v1",
)
app.include_router(
    optimization_history_router,
    prefix="/api/v1",
    tags=["Optimization History"],
    dependencies=[Depends(require_allowed_company)],
)
app.include_router(
    financial_alerts.router,
    prefix="/api/v1",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to FlowPilot API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "FlowPilot API",
        "version": "0.1.0",
    }