# Project Mingler (`mingler.co.uk`)

> **Curated Social Experiences Platform — London, UK**  
> Custom full-stack web application built with Django REST Framework, Next.js 15 App Router, and PostgreSQL 16.

[![Backend Tests](https://img.shields.io/badge/pytest-111%20passed%20(100%25)-brightgreen.svg)]()
[![Code Coverage](https://img.shields.io/badge/coverage-88%25-green.svg)]()
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0%20Validated-blue.svg)]()
[![Django](https://img.shields.io/badge/Django-5.1-092E20.svg?logo=django&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg?logo=next.js&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white)]()
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D.svg?logo=redis&logoColor=white)]()
[![Celery](https://img.shields.io/badge/Celery-5.4-37814A.svg?logo=celery&logoColor=white)]()

---

## 🏗️ Repository Architecture (Monorepo)

```
join-the-mingle/
├── backend/                       # Headless REST API (Django 5.1 + DRF)
│   ├── apps/
│   │   ├── administration/       # Approvals queue & platform commission settings
│   │   ├── bookings/             # Concurrency-safe reservations (select_for_update)
│   │   ├── core/                 # BaseModel (UUID), RBAC permissions, error handlers
│   │   ├── interactions/         # Reviews, feedback & double-blind mutual matching
│   │   ├── mingles/              # Experience catalog, spots tracking & proposals
│   │   ├── notifications/        # Celery mail worker & RFC 5545 .ics generator
│   │   ├── payments/             # Stripe checkout & cryptographically signed webhooks
│   │   ├── users/                # JWT, profiles, 6-digit OTP email & 6 OAuth2 providers
│   │   └── venues/               # Venue directory, 7-day operating hours & manager portal
│   ├── config/                   # Settings (base, local, production), urls, wsgi, celery
│   ├── requirements/             # Dependencies (base.txt, local.txt, production.txt)
│   ├── tests/                    # 111 Pytest unit & integration tests (100% pass)
│   ├── Dockerfile                # Multi-stage container build (base & gunicorn)
│   ├── manage.py                 # Django management CLI
│   └── postman_collection.json   # 8-Folder API collection
│
├── frontend/                      # Client Application (Next.js 15 App Router)
│   ├── app/                      # App router pages, routes & layouts
│   ├── components/               # Design system & Radix UI primitives
│   ├── lib/                      # API client, JWT interceptor, AudioContext synth
│   └── package.json              # React 19, Tailwind CSS, TanStack Query v5
│
├── docker-compose.yml             # Multi-container orchestration (db, redis, web, celery)
└── .gitignore                     # Universal ignore rules (Zero-PII & secret protection)
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* Docker & Docker Compose
* Python 3.12+
* Node.js 20+ (LTS) & npm

### 1. Clone & Set Up Environment Variables
```bash
git clone https://github.com/liminovalabs-main/join-the-mingle.git
cd join-the-mingle

# Copy the backend environment template
cp backend/.env.example backend/.env
# Edit backend/.env with your local credentials
```

### 2. Start PostgreSQL & Redis via Docker
```bash
docker compose up -d db redis
```

### 3. Run Backend Migrations & Development Server
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements/local.txt

# Run migrations & seed data
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 4. Run Celery Background Worker
```bash
# In a separate terminal tab:
cd backend && source venv/bin/activate
celery -A config worker -l info
```

---

## 🧪 Running the Backend Test Suite

Run the full automated test suite (111 tests):
```bash
cd backend
source venv/bin/activate
pytest -v
```

Generate the test coverage report (88% coverage):
```bash
pytest --cov=apps --cov-report=term-missing
```

---

## 📖 API Documentation & Swagger UI

Once the backend is running, interactive API documentation is available at:
* **Swagger UI:** `http://localhost:8000/api/docs/`
* **ReDoc:** `http://localhost:8000/api/redoc/`
* **OpenAPI 3.0 Schema:** `http://localhost:8000/api/schema/`

A complete Postman collection is also provided at `backend/postman_collection.json`.

---

## 🛡️ Security & UK GDPR Compliance

* **UK GDPR PII Protection:** Public attendee and match endpoints strictly strip `date_of_birth` and `email` to prevent any data exposure.
* **Concurrency Locking:** Atomic `select_for_update()` row-level locks prevent overbooking on concurrent ticket purchases.
* **Stripe Webhook Defense:** HMAC SHA-256 signature verification and `StripePaymentEvent` replay protection.
* **Email Verification:** Mandatory 6-digit OTP verification with 60-second rate-limiting cooldown.

---

## 📄 License
Proprietary & Confidential — Liminova Labs / Project Mingler. All rights reserved.
