
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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