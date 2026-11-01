# Project Mingler — Staging Deployment Guide (Render + Vercel)

This turnkey guide details how to deploy the **Django REST Framework backend** to **Render** and the **Next.js 15 frontend** to **Vercel** so you can deliver a live interactive demonstration to your client with 100% Base44 visual and functional fidelity.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │                 Client Browser               │
                      └──────────────┬───────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
    ┌───────────────────────────┐           ┌───────────────────────────┐
    │     Vercel (Frontend)     │           │     Render (Backend)      │
    │  Next.js 15 App Router    │  ──API──▶ │  Django 5.1 DRF + Gunicorn │
    │  https://<app>.vercel.app │           │  https://<app>.onrender.com│
    └───────────────────────────┘           └─────────────┬─────────────┘
                                                          │
                                            ┌─────────────┴─────────────┐
                                            │ Render Managed PostgreSQL │
                                            └───────────────────────────┘
```

- **Frontend (Vercel)**: Next.js 15, Tailwind CSS, Lucide icons, Canvas Confetti.
- **Backend (Render)**: Gunicorn WSGI, WhiteNoise static delivery (Admin/Swagger CSS/JS), Celery eager mode (email notifications without extra paid containers).
- **Database (Render)**: Managed PostgreSQL (Free / Starter tier).
- **Payment (Stripe)**: Dynamic payment methods with test card sandbox.

---

## Part 1: Deploying the Backend on Render

You can deploy on Render either using the automated **Blueprint** (`render.yaml`) or manually via the Render Dashboard.

### Method A: Automated Deployment via Blueprint (Recommended)

1. Log into your account at [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub repository (`Mringle`).
4. Render will automatically read [`render.yaml`](file:///home/rakib-khan/Volume%28D%29/Mringle/render.yaml) and declare two services:
   - `mringle-db` (PostgreSQL Database)
   - `mringle-backend` (Python Web Service)
5. Click **Apply**. Render will automatically provision the PostgreSQL database, link `DATABASE_URL`, run `./build.sh` (collectstatic + migrations), and start Gunicorn.

---

### Method B: Manual Dashboard Setup

If you prefer configuring each service step-by-step:

#### Step 1: Create the PostgreSQL Database
1. In Render Dashboard, click **New +** &rarr; **PostgreSQL**.
2. **Name**: `mringle-db`
3. **Database**: `mingler_db`
4. **User**: `mingler_user`
5. **Region**: Choose a region close to your target audience (e.g., `Frankfurt` or `Oregon`).
6. **Plan**: `Free`
7. Click **Create Database**.
8. Once created, copy the **Internal Database URL** (e.g., `postgres://mingler_user:...@dpg-...-a/mingler_db`).

#### Step 2: Create the Python Web Service
1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name**: `mringle-backend`
   - **Region**: Same region as your database.
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`
   - **Plan**: `Free` (or `Starter`)

#### Step 3: Add Environment Variables
Under the **Environment** tab of your Web Service, configure:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.3` | Matches local development |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Enables production security & WhiteNoise |
| `DJANGO_DEBUG` | `False` | Production mode |
| `DJANGO_SECRET_KEY` | *(Click "Generate" or paste a random string)* | 50+ random characters |
| `DATABASE_URL` | *(Paste Internal Database URL from Step 1)* | Automatically connects PostgreSQL |
| `CELERY_TASK_ALWAYS_EAGER` | `True` | Runs email & match tasks synchronously without needing Redis |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Your Stripe Test Secret Key |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Your Stripe Test Publishable Key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | (Optional until Webhook is configured) |
| `EMAIL_HOST_USER` | `your-email@gmail.com` | (Optional: Gmail SMTP for real verification emails) |
| `EMAIL_HOST_PASSWORD` | `your-google-app-password` | (Optional: App password) |

4. Click **Deploy Web Service**.
5. Once deployment completes, your backend URL will be:
   `https://mringle-backend.onrender.com`

#### Step 4: Create a Superuser (Admin Account) — Render Free Tier Friendly

Since Render disables the interactive Web Shell on free tier accounts, we have provided two easy ways to create your admin account:

##### Method 1: Automatic via Render Environment Variables (Recommended)
1. Go to your `mringle-backend` service in the Render Dashboard &rarr; **Environment** tab.
2. Add two new environment variables:
   - `DJANGO_SUPERUSER_EMAIL`: e.g. `admin@mringle.co.uk`
   - `DJANGO_SUPERUSER_PASSWORD`: e.g. `YourSecureAdminPass123!`
3. Click **Save Changes**.
4. Render will automatically redeploy and execute `python manage.py initadmin` during `./build.sh`.
5. Your superuser will be created immediately with verified email and staff/admin permissions!
6. Log in at `https://mringle-backend.onrender.com/admin/`.

##### Method 2: Direct from Your Local Computer Terminal
Render provides an **External Database URL** that allows external management:
1. In Render Dashboard, click your database (`mringle-db`).
2. Under **Connections**, copy the **External Database URL** (e.g. `postgresql://mingler_user:...@dpg-....frankfurt-postgres.render.com/mingler_db`).
3. In your local VS Code / computer terminal, run:
   ```bash
   cd backend
   source venv/bin/activate
   DATABASE_URL="<paste-external-database-url>" python manage.py createsuperuser --settings=config.settings.production
   ```
4. Enter your email and password interactively. It connects directly to Render's live database!

---

## Part 2: Deploying the Frontend on Vercel

1. Log into your account at [vercel.com](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository (`Mringle`).
4. In the **Configure Project** screen:
   - **Project Name**: `mringle` (or your preferred name)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select **`frontend`** *(Critical!)*.
5. Expand the **Environment Variables** section and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://mringle-backend.onrender.com/api/v1` | **Use your actual Render backend URL** |

6. Click **Deploy**.
7. Vercel will build and deploy the Next.js app in ~45 seconds.
8. Your live frontend URL will be:
   `https://mringle.vercel.app` (or similar).

---

## Part 3: Connecting Frontend & Backend

Now link the two deployed services together:

### 1. Update Backend CORS on Render
1. Go to your Render Web Service (`mringle-backend`) &rarr; **Environment**.
2. Add / Update the following variables with your actual Vercel URL:
   - `CORS_ALLOWED_ORIGINS`: `https://mringle.vercel.app,http://localhost:3000`
   - `FRONTEND_URL`: `https://mringle.vercel.app`
3. Click **Save Changes**. Render will automatically redeploy with the updated CORS configuration.

*(Note: Our `production.py` includes a wildcard regex for `^https:\/\/.*\.vercel\.app$`, so even preview deployments will work seamlessly).*

### 2. Configure Stripe Webhooks (Live Test Sandbox)
To have Stripe automatically confirm bookings after test card checkout:
1. Open the [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks). Make sure **Test Mode** is toggled ON.
2. Click **Add destination / endpoint**.
3. **Endpoint URL**:
   `https://mringle-backend.onrender.com/api/v1/payments/webhook/`
4. **Events to listen to**:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Click **Add endpoint**.
6. Reveal the **Signing secret** (`whsec_...`).
7. Copy this secret, go back to Render Web Service &rarr; **Environment**, and paste it into `STRIPE_WEBHOOK_SECRET`. Save changes.

---

## Part 4: End-to-End Client Demo Checklist

When demonstrating the platform to your client, follow this recommended walkthrough:

- [ ] **1. Public Discovery**:
  - Visit the homepage (`/`): Show the hero photography, live ticker, dictionary brand element (`mingler` noun), and 4-step vector showcase.
  - Visit `/about`: Show the Global Flourishing Study research citation, connection metrics, and founders' story.
  - Visit `/how-it-works`: Show the master infographic and FAQ accordions.
- [ ] **2. Browse Catalog**:
  - Visit `/browse`: Filter mingles by category pills (Cocktails, Dinner, Wine Tasting, Games).
  - Open a Mingle details page (`/mingles/[id]`): Point out spots remaining, countdown timer, dynamic attendee roster, and venue information.
- [ ] **3. Account Registration & Onboarding**:
  - Click **Sign in / Register**.
  - Create a new member account with name, email, and password.
  - Complete the profile setup: Bio, interests tags, and avatar.
- [ ] **4. Stripe Sandbox Checkout**:
  - Select an experience and click **Reserve Your Spot**.
  - Select seat count (1 to 5).
  - Click **Pay with Card** &rarr; Redirects to Stripe Checkout.
  - Use Stripe's official test card `4242 4242 4242 4242`, any future expiration date (e.g., `12/28`), and CVC `123`.
  - Confirm payment &rarr; Redirected back to `/bookings/[id]/success` with calendar download button (.ics).
- [ ] **5. After-Mingle Mutual Matching**:
  - Visit `/after-mingle/[id]`: Select attendees you connected with.
  - When mutual selection occurs, trigger the celebration screen with gold confetti!
- [ ] **6. Venue Partner Portal**:
  - Visit `/venue`: Show the venue partner landing page.
  - Click **Register Venue**: Submit a venue application with opening hours.
  - In Django Admin (`/admin`), approve the venue and curate new events.
