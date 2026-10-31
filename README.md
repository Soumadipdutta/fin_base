# fin_base
# 🚀 FlowPilot — Forecast. Optimize. Grow.

<p align="center">
  <strong>AI-powered cash-flow intelligence for smarter financial decisions.</strong>
  <br />
  Forecast future balances, identify financial risks, and optimize payment schedules through one unified platform.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-0ea5e9?style=for-the-badge" alt="Project Status" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-overview">API</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## 💡 The Problem

A business can be profitable on paper and still run out of cash.

Delayed customer payments, upcoming supplier obligations, and poor visibility into future account balances can create unexpected liquidity problems. Traditional financial dashboards often focus on what has already happened rather than what might happen next.

**FlowPilot is designed to help businesses anticipate financial risks before they become urgent problems.**

## ✨ What Is FlowPilot?

FlowPilot is a financial intelligence platform that connects cash-flow forecasting, financial risk analysis, and payment optimization in a single workflow.

Instead of simply displaying account balances, FlowPilot helps answer three important questions:

- 🔮 **What might my cash position look like in the future?**
- 🛡️ **When could my business face a cash shortage or reserve breach?**
- ⚙️ **How can I evaluate payment schedules against available liquidity?**

The goal is to make financial planning more proactive, transparent, and actionable.

## 🎯 Features

<table>
  <tr>
    <td width="50%">
      <h3>🔮 Cash-Flow Forecasting</h3>
      Project future balances using expected inflows, outflows, receivables, and obligations.
    </td>
    <td width="50%">
      <h3>🛡️ Financial Risk Analysis</h3>
      Identify potential cash shortages and reserve shortfalls that require attention.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚙️ Payment Optimization</h3>
      Evaluate payment schedules using a deterministic, heuristic-based approach.
    </td>
    <td width="50%">
      <h3>📊 Financial Dashboard</h3>
      Explore company information, accounts, forecasts, invoices, obligations, and alerts.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🤖 Financial Copilot</h3>
      A conversational interface for exploring financial information and potential actions.
    </td>
    <td width="50%">
      <h3>🧪 Scenario Analysis</h3>
      API support for evaluating scenarios and exploring alternative financial outcomes.
    </td>
  </tr>
</table>

> **Note:** Recommendations are decision-support outputs, not guaranteed financial outcomes. Forecast accuracy depends on the quality of available data and assumptions.

## 🏗️ Architecture

FlowPilot uses a frontend, backend API, and PostgreSQL database. The frontend communicates with the backend through an Nginx reverse proxy. The application can be containerized with Docker and deployed locally using Kubernetes.

```mermaid
flowchart TD
    U(["👤 Business User"])
    FE["React + Vite Dashboard"]
    NG["Nginx Reverse Proxy"]
    API["FastAPI Backend"]
    FC["Cash-Flow Forecasting"]
    RA["Risk Analysis"]
    PO["Payment Optimization"]
    COP["Financial Copilot"]
    DB[("PostgreSQL Database")]

    U --> FE
    FE --> NG
    NG --> API
    API --> FC
    API --> RA
    API --> PO
    API --> COP
    API <--> DB

    FC --> DB
    RA --> DB
    PO --> DB

    classDef frontend fill:#dbeafe,stroke:#2563eb,color:#172554
    classDef backend fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef database fill:#fef3c7,stroke:#d97706,color:#78350f

    class FE,NG frontend
    class API,FC,RA,PO,COP backend
    class DB database
```

### Request lifecycle

```mermaid
sequenceDiagram
    actor User
    participant UI as React Dashboard
    participant API as FastAPI
    participant Logic as Financial Analysis
    participant DB as PostgreSQL

    User->>UI: Request forecast or risk analysis
    UI->>API: HTTP API request
    API->>DB: Retrieve relevant financial data
    DB-->>API: Return account and transaction data
    API->>Logic: Calculate forecast or assess risks
    Logic-->>API: Return results
    API-->>UI: JSON response
    UI-->>User: Display financial insights
```

## 🧠 How FlowPilot Works

```mermaid
flowchart LR
    A["📥 Financial Data"] --> B["🧹 Data Preparation"]
    B --> C["🔮 Cash-Flow Forecast"]
    C --> D["🛡️ Risk Assessment"]
    D --> E["⚙️ Payment Optimization"]
    E --> F["📊 Insights & Decisions"]

    classDef stage fill:#eff6ff,stroke:#3b82f6,color:#1e3a8a
    class A,B,C,D,E,F stage
```

1. **Collect:** Retrieve relevant account information, expected receivables, and obligations.
2. **Prepare:** Organize financial data for analysis.
3. **Forecast:** Estimate future account balances over a selected horizon.
4. **Assess:** Check projected balances against risk and reserve conditions.
5. **Optimize:** Evaluate payment schedules using the available constraints and assumptions.
6. **Present:** Return the results through API responses and the dashboard.

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| Frontend | React, Vite, JavaScript, CSS | Dashboard and user interactions |
| Backend | Python, FastAPI, Uvicorn | API endpoints and application logic |
| Data validation | Pydantic | Request and response validation |
| Database | PostgreSQL | Persistent financial data |
| Database migrations | Alembic | Schema versioning and migrations |
| Database connectivity | SQLAlchemy, Psycopg | Python-to-PostgreSQL integration |
| HTTP communication | Axios | Frontend API requests |
| Web server | Nginx | Static assets and reverse proxy |
| Containerization | Docker | Container images |
| Orchestration | Kubernetes, Minikube, kubectl | Local deployment and management |
| Testing | Pytest | Automated backend tests |

*This list reflects the project stack discussed during development. Verify each dependency against your current repository before treating the table as a complete dependency inventory.*

## 📂 Project Structure

The following is a logical overview of the application. Adjust directory names to match the exact contents of your repository.

```text
FlowPilot/
├── Backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── Frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── k8s/
└── README.md
```

> The tree is illustrative, not a verified file listing. Your repository may use different directory names or organize its frontend and backend differently.

## 🚀 Getting Started

### Prerequisites

Install the following tools:

- Python and pip
- Node.js and npm
- PostgreSQL
- Docker Desktop
- Git

For Kubernetes deployment, also install:

- kubectl
- Minikube

### 1. Clone the repository

```bash
git clone https://github.com/Soumadipdutta/fin_base.git
cd fin_base
```

### 2. Configure the backend

Open the backend directory and create a virtual environment.

```powershell
cd Backend

python -m venv env
.\env\Scripts\Activate.ps1

python -m pip install -r requirements.txt
```

Configure the database connection using the environment variable expected by your backend. For example:

```text
DATABASE_URL=postgresql+psycopg://<username>:<password>@<host>:<port>/<database>
```

Replace the placeholders with your own local development settings. Do not commit database passwords or API keys.

### 3. Start the backend

From the backend directory:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Open the API documentation:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health endpoint: [http://localhost:8000/health](http://localhost:8000/health)

If port `8000` is already occupied, use a different port and update your frontend configuration accordingly.

### 4. Start the frontend

In a separate terminal, navigate to your frontend directory and install its dependencies.

```powershell
npm install
npm run dev
```

Use the local URL printed by Vite. Make sure the frontend API configuration points to your running backend, preferably through the configured development proxy.

### 5. Run tests

From the backend directory, with the virtual environment activated:

```powershell
python -m pytest -v
```

Tests should pass before you consider a build ready for demonstration.

## 🔌 API Overview

FlowPilot exposes API routes for its core financial workflows.

| Capability | Example route | Purpose |
|---|---|---|
| Health | `GET /health` | Check API availability |
| Companies | `GET /api/v1/companies` | Retrieve company information |
| Accounts | `GET /api/v1/companies/{company_id}/accounts` | Retrieve company accounts |
| Forecasting | `GET /api/v1/companies/{company_id}/forecast?days=30` | Generate a cash-flow forecast |
| Risk analysis | `GET /api/v1/companies/{company_id}/risks` | Retrieve financial risk analysis |
| Optimization | `POST /api/v1/companies/{company_id}/optimization?days=30` | Evaluate a payment schedule |
| Invoices | `/api/v1/companies/{company_id}/invoices` | Access invoice information |
| Obligations | `/api/v1/companies/{company_id}/obligations` | Access payment obligations |
| Alerts | `/api/v1/companies/{company_id}/alerts` | Retrieve financial alerts |
| Scenarios | `/api/v1/scenarios` | Work with financial scenarios |

Check the live OpenAPI specification at `/openapi.json` or Swagger UI at `/docs` to confirm each route and its HTTP method for your current build.

### Example: Retrieve a forecast

```bash
curl "http://localhost:8000/api/v1/companies/4/forecast?days=30"
```

Example response shape:

```json
{
  "company_id": 4,
  "base_currency": "USD",
  "forecast_start": "YYYY-MM-DD",
  "forecast_end": "YYYY-MM-DD",
  "days": 30,
  "assumptions": {},
  "daily_forecast": []
}
```

The example illustrates the response structure; actual dates, assumptions, and forecast values depend on your database and implementation.

## 🐳 Docker & Kubernetes

This section provides a repeatable **local Minikube deployment** for reviewers who want to run FlowPilot in Kubernetes. It builds the images from this repository and keeps the database inside the cluster, so it does not depend on the developer's laptop-specific Docker containers or tunnel URL.

> **Requirements:** Docker Desktop running with Linux containers, Minikube, kubectl, and enough memory for PostgreSQL plus the API. The Financial Copilot also needs a reachable Ollama server and a downloaded model; the core dashboard, forecast, and risk endpoints can be checked separately if Ollama is unavailable. These commands target PowerShell on Windows; run equivalent commands in your shell if needed.

### Option A — Run with Docker Compose

The repository's root `docker-compose.yml` currently references the prebuilt images `flowpilot-backend:offline` and `flowpilot-frontend:offline`. Use this option only if those images are already available locally:

```powershell
docker image inspect flowpilot-backend:offline
docker image inspect flowpilot-frontend:offline
docker compose up -d
docker compose ps
```

Open the frontend at [http://localhost:3001](http://localhost:3001), the API health check at [http://localhost:8001/health](http://localhost:8001/health), and API docs at [http://localhost:8001/docs](http://localhost:8001/docs).

To stop the containers without deleting the database volume:

```powershell
docker compose down
```

Do **not** add `-v` unless you intentionally want to delete the database volume and its data.

### Option B — Build and run on Minikube

#### 1. Start the cluster and build the application images

Run these commands from the repository root:

```powershell
minikube start --driver=docker
kubectl cluster-info
minikube image build -t flowpilot-backend:review ./Backend
minikube image build -t flowpilot-frontend:review --build-arg VITE_API_BASE_URL=/api/v1 --build-arg VITE_COMPANY_ID=4 ./Frontend
```

The frontend image must use a same-origin API base of `/api/v1`; the Nginx configuration below forwards those requests to the in-cluster backend service. This avoids hardcoding `localhost` or a temporary public tunnel into the browser bundle.

#### 2. Create the namespace and database credentials

```powershell
kubectl create namespace flowpilot
kubectl create secret generic flowpilot-db -n flowpilot --from-literal=POSTGRES_USER=flowpilot --from-literal=POSTGRES_PASSWORD=flowpilot_dev --from-literal=POSTGRES_DB=flowpilot
```

These are **demo credentials only**. For any shared or production environment, replace them with strong credentials and use a managed secret mechanism.

#### 3. Create the PostgreSQL workload

Save the following as `postgres.yaml` in your working directory:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: flowpilot-postgres-data
  namespace: flowpilot
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 2Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flowpilot-postgres
  namespace: flowpilot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flowpilot-postgres
  template:
    metadata:
      labels:
        app: flowpilot-postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: flowpilot-db
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: flowpilot-db
                  key: POSTGRES_PASSWORD
            - name: POSTGRES_DB
              valueFrom:
                secretKeyRef:
                  name: flowpilot-db
                  key: POSTGRES_DB
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: flowpilot-postgres-data
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: flowpilot
spec:
  selector:
    app: flowpilot-postgres
  ports:
    - port: 5432
      targetPort: 5432
```

Apply it:

```powershell
kubectl apply -f .\postgres.yaml
kubectl rollout status deployment/flowpilot-postgres -n flowpilot --timeout=180s
```

#### 4. Deploy the backend API

Create a Secret containing the database URL. It uses the PostgreSQL service name, not `localhost`:

```powershell
kubectl create secret generic flowpilot-backend-config -n flowpilot --from-literal=DATABASE_URL='postgresql+psycopg://flowpilot:flowpilot_dev@postgres:5432/flowpilot' --from-literal=FLOWPILOT_ALLOWED_COMPANY_ID=4
```

Create `backend.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flowpilot-backend
  namespace: flowpilot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flowpilot-backend
  template:
    metadata:
      labels:
        app: flowpilot-backend
    spec:
      containers:
        - name: backend
          image: flowpilot-backend:review
          imagePullPolicy: Never
          ports:
            - containerPort: 8000
          envFrom:
            - secretRef:
                name: flowpilot-backend-config
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: flowpilot
spec:
  selector:
    app: flowpilot-backend
  ports:
    - port: 8000
      targetPort: 8000
```

Apply and inspect:

```powershell
kubectl apply -f .\backend.yaml
kubectl rollout status deployment/flowpilot-backend -n flowpilot --timeout=180s
kubectl logs deployment/flowpilot-backend -n flowpilot --tail=100
```

The backend image's entrypoint runs the application's configured startup process. If the database starts empty and the dashboard has no company data, check the repository's migrations and seed-data workflow before evaluating endpoints; do not assume an empty database contains demo records.

#### 5. Configure Nginx and deploy the frontend

Create `frontend-nginx.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: flowpilot-nginx
  namespace: flowpilot
data:
  default.conf: |
    server {
      listen 80;
      server_name localhost;
      root /usr/share/nginx/html;
      index index.html;

      location /api/v1/ {
        proxy_pass http://backend:8000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
      }

      location /health {
        proxy_pass http://backend:8000/health;
      }

      location / {
        try_files $uri $uri/ /index.html;
      }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flowpilot-frontend
  namespace: flowpilot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flowpilot-frontend
  template:
    metadata:
      labels:
        app: flowpilot-frontend
    spec:
      containers:
        - name: frontend
          image: flowpilot-frontend:review
          imagePullPolicy: Never
          ports:
            - containerPort: 80
          volumeMounts:
            - name: nginx-config
              mountPath: /etc/nginx/conf.d/default.conf
              subPath: default.conf
      volumes:
        - name: nginx-config
          configMap:
            name: flowpilot-nginx
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: flowpilot
spec:
  selector:
    app: flowpilot-frontend
  ports:
    - port: 80
      targetPort: 80
```

Apply and wait for both workloads:

```powershell
kubectl apply -f .\frontend-nginx.yaml
kubectl rollout status deployment/flowpilot-frontend -n flowpilot --timeout=180s
kubectl get pods,services -n flowpilot
```

#### 6. Open FlowPilot and verify the API

Keep these commands running in **separate terminals**:

Terminal 1 — frontend:

```powershell
kubectl port-forward service/frontend 13001:80 -n flowpilot
```

Terminal 2 — backend API docs:

```powershell
kubectl port-forward service/backend 18000:8000 -n flowpilot
```

Open:

- Dashboard: [http://localhost:13001](http://localhost:13001)
- API documentation: [http://localhost:18000/docs](http://localhost:18000/docs)
- API health: [http://localhost:18000/health](http://localhost:18000/health)

Verify the frontend proxy from PowerShell:

```powershell
Invoke-WebRequest "http://localhost:13001/health"
Invoke-WebRequest "http://localhost:13001/api/v1/companies?company_id=4"
Invoke-WebRequest "http://localhost:13001/api/v1/companies/4/forecast?days=30"
Invoke-WebRequest "http://localhost:13001/api/v1/companies/4/risks"
```

A successful HTTP response confirms that the request reached the API. If forecast/risk routes return an error, inspect backend logs; if direct API requests work but frontend-proxy requests fail, inspect Nginx logs:

```powershell
kubectl logs deployment/flowpilot-backend -n flowpilot --tail=100
kubectl logs deployment/flowpilot-frontend -n flowpilot --tail=100
```

#### 7. Kubernetes troubleshooting and cleanup

```powershell
kubectl get nodes
kubectl get deployments,pods,services -n flowpilot
kubectl describe pods -n flowpilot
kubectl logs deployment/flowpilot-backend -n flowpilot
```

To stop only the port-forward sessions, press `Ctrl+C` in their terminals. To remove this demo namespace and its Kubernetes resources after reviewing, run:

```powershell
kubectl delete namespace flowpilot
```

**Warning:** Deleting the namespace removes the demo PVC and its associated cluster resources. Do this only if you no longer need the data. Do not run `minikube delete`, `docker system prune`, or volume-deletion commands as routine cleanup.

**Security and demo notes:**
- This is a local reviewer setup, not a production deployment. Do not expose the API or demo database directly to the public internet.
- The default demo database credentials are not suitable for production.
- The Copilot requires a reachable Ollama service and a compatible model; GPU memory may be insufficient on some machines. Forecasting and risk endpoints can be verified independently.
- Demo records must be seeded according to the repository's data setup. Do not enter real customer financial data.
- Port-forwarding is local to the machine running Minikube; it is not a permanent public URL.

## 📈 Development Roadmap

```mermaid
flowchart TD
    A["✅ Core Backend & APIs"]
    B["✅ Forecasting and Risk Logic"]
    C["✅ Frontend Integration"]
    D["✅ Local Kubernetes Deployment"]
    E["🔄 Forecast Accuracy Evaluation"]
    F["🔄 Explainable Optimization"]
    G["🔮 Secure Cloud Deployment"]

    A --> B --> C --> D --> E --> F --> G
```

The roadmap distinguishes core capabilities already developed from planned improvements. The completed items refer to the current development work and do not imply production readiness.

| Priority | Planned improvement |
|---|---|
| High | Improve forecast accuracy measurement |
| High | Add stronger validation for financial inputs |
| High | Strengthen authentication and authorization |
| Medium | Improve payment priorities and constraint handling |
| Medium | Add explicit currency conversion support |
| Medium | Improve scenario comparison and explanations |
| Future | Add cloud deployment, monitoring, and operational alerts |

## ⚠️ Current Limitations

FlowPilot is an evolving project. Some limitations to address include:

- Forecast quality depends on the completeness and reliability of financial data.
- Currency balances should remain separate unless a valid conversion mechanism is available.
- The current optimization approach is heuristic-based and may not model every supplier penalty or business constraint.
- Recommendations should be validated against real-world financial policies before being used for consequential decisions.
- Production deployment requires appropriate access controls, secret management, monitoring, and security testing.

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your change and add relevant tests.
4. Run the existing test suite.
5. Submit a pull request describing your changes.

Please avoid committing credentials, customer financial data, database dumps, or local environment files.

## 🔮 What's Next?

Our long-term vision is to make FlowPilot a more intelligent financial decision-support platform through:

- Better forecasting models and historical accuracy evaluation.
- Explainable risk detection and optimization recommendations.
- Scenario simulations for comparing financial decisions.
- Secure multi-company access and role-based permissions.
- Reliable multi-currency financial analysis.
- Cloud deployment, monitoring, and operational observability.

## 🌟 Vision

We believe businesses should have time to respond to financial risks before those risks become urgent.

FlowPilot brings together **forecasting, risk analysis, and payment optimization** to help businesses move from reactive cash management toward proactive financial planning.

<p align="center">
  <strong>FlowPilot — Forecast. Optimize. Grow.</strong>
</p>

---

<p align="center">
  Built with ☕, curiosity, and a focus on better financial decisions.
</p>
