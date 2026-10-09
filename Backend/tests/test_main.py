from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message":"Welcome to FlowPilot API",
        "docs":"/docs",
        "health":"/health",
    }


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "FlowPilot API",
        "version": "0.1.0",
    }

def test_docs_endpoint():
    response = client.get("/docs")

    assert response.status_code == 200