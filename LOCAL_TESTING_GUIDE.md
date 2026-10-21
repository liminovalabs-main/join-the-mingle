# Project Mingler: Local Setup & Postman Testing Guide

This guide walks you step-by-step through running the backend (via Docker or local virtual environment) and testing all Part 1 and Part 2 endpoints using Postman.

---

## 🚀 Choose Your Preferred Setup Mode

You have two simple options to run and test the application:

### Option A: Complete Docker Setup (Recommended for Full Production-Parity)
Runs PostgreSQL 16, Redis 7.2, Django API Server, Celery Worker, and Celery Beat in Docker containers.

```bash
# 1. Navigate to the project root
cd /home/rakib-khan/Volume\(D\)/Mringle

# 2. Build and launch all 5 containers in the background
docker compose up -d --build

# 3. Apply database migrations inside the web container
docker compose exec web python manage.py migrate

# 4. (Optional) Create a superuser / admin account
docker compose exec web python manage.py createsuperuser

# 5. Check container health and live logs
docker compose ps
docker compose logs -f web
```

The API will be live at: **`http://localhost:8000`**  
Swagger Documentation: **`http://localhost:8000/api/docs/`**

---

### Option B: Fast Local Development with Docker PostgreSQL
Runs PostgreSQL and Redis in Docker, while running Django directly in your local terminal for instant reload and debugging.

```bash
# 1. Start only Postgres and Redis in Docker
docker compose up -d db redis

# 2. Activate your virtual environment
source backend/venv/bin/activate
# (Or: cd backend && source venv/bin/activate)

# 3. Apply migrations to PostgreSQL (port 5432)
POSTGRES_HOST=localhost python backend/manage.py migrate

# 4. Start the Django development server
POSTGRES_HOST=localhost python backend/manage.py runserver 127.0.0.1:8000
```

---

### Option C: Instant Zero-Docker Standalone Mode (SQLite)
If you just want to quickly test the endpoints without starting Docker:

```bash
# 1. Activate your virtual environment
source backend/venv/bin/activate

# 2. Start the server with SQLite
cd backend
USE_SQLITE=1 python manage.py runserver 127.0.0.1:8000
```

---

## 📬 Testing With Postman (1-Click Import)

A ready-to-test Postman collection is already generated in your project root at:
[`/home/rakib-khan/Volume(D)/Mringle/postman_collection.json`](./postman_collection.json)

### How to Import & Run in Postman:
1. Open **Postman**.
2. Click **Import** (top left).
3. Select or drag-and-drop the file: `postman_collection.json`.
4. You will see a new collection: **`Project Mingler API (Parts 1 & 2)`**.

### Automated Token Handling (No Manual Copy-Pasting!):
The collection is equipped with automatic test scripts:
- When you execute **`Register New Member`** or **`Login`**, Postman automatically extracts `tokens.access`, `tokens.refresh`, and `profile.id` and saves them to collection variables.
- Subsequent requests (**Get My Profile**, **Update Profile**, **Public Profiles**, **Logout**) automatically use the saved `{{access_token}}`.

---

## 🧪 Testing Walkthrough in Postman

### Step 1: Register New Member
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/auth/register/`
- **Body:**
```json
{
  "email": "meriam@mingler.co.uk",
  "password": "SecureMingle2026!",
  "password_confirm": "SecureMingle2026!",
  "display_name": "Meriam London"
}
```
- **Expected Status:** `201 Created`
- **What happens:** Creates `User` and linked `Profile`, returns access and refresh JWT tokens.

---

### Step 2: Member Login
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/auth/login/`
- **Body:**
```json
{
  "email": "meriam@mingler.co.uk",
  "password": "SecureMingle2026!"
}
```
- **Expected Status:** `200 OK`

---

### Step 3: Get Private Profile
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/profiles/me/`
- **Header:** `Authorization: Bearer {{access_token}}`
- **Expected Status:** `200 OK`
- Shows user's private data (email, date_of_birth, notification settings).

---

### Step 4: Update Profile & Social Handles
- **Method:** `PATCH`
- **URL:** `http://127.0.0.1:8000/api/v1/profiles/me/`
- **Header:** `Authorization: Bearer {{access_token}}`
- **Body:**
```json
{
  "display_name": "Meriam K.",
  "gender": "Female",
  "relationship_status": "Single",
  "date_of_birth": "1996-06-12",
  "bio": "Founder of Mingler. Passionate about art, cocktails, and London social scenes.",
  "interests": ["Wine Tasting", "Art Galleries", "Tech"],
  "instagram_handle": "meriam_mingler",
  "linkedin_url": "https://linkedin.com/in/meriam-founder"
}
```
- **Expected Status:** `200 OK`
- **Verification:** Try changing `instagram_handle` to have spaces or `date_of_birth` to under 18 — notice the API returns clear validation errors!

---

### Step 5: UK GDPR Public Profile Verification
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/profiles/public/?ids={{my_profile_id}}`
- **Header:** `Authorization: Bearer {{access_token}}`
- **Expected Status:** `200 OK`
- **UK GDPR Audit Check:** Inspect the response JSON carefully:
  - `date_of_birth` is **completely absent**.
  - `email` is **completely absent**.
  - Only safe public fields (`display_name`, `photo`, `bio`, `interests`, `socials`) are exposed.

---

### Step 6: Interactive Swagger Documentation
Open in your browser:
- **Swagger UI:** [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **ReDoc:** [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **OpenAPI Schema:** [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

---

## 🛠 Useful Administrative Commands

```bash
# Run the automated Pytest test suite anytime
source backend/venv/bin/activate
USE_SQLITE=1 pytest backend/tests/ -v


# Stop Docker containers
docker compose down

# Stop and wipe database volume (clean slate reset)
docker compose down -v
```
