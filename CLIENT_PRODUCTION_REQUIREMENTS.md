# Mingler — Client Production Handoff & Infrastructure Requirements Guide

> **Document Version:** 1.0.0  
> **Platform Domain:** `mingler.co.uk` (Frontend) / `api.mingler.co.uk` (Backend API)  

---

## Executive Summary

To transition **Mingler — The Physical Social Network** from the current staging prototype to a high-performance, secure, live production environment, several third-party services, developer credentials, and infrastructure resources must be provisioned by the client.

This guide provides step-by-step instructions for:
1. **Server & Cloud Infrastructure:** Hostinger VPS specifications, Ubuntu configuration, and DNS setup.
2. **Payment Processing:** Stripe Live API keys, Webhooks, and Payout configuration.
3. **Social Authentication (6 Providers):** Developer portal credentials for Google, Apple, Meta (Facebook), Instagram, TikTok, and LinkedIn.
4. **Media Storage:** Cloudflare R2 / AWS S3 object storage for attendee photos and venue media.
5. **Transactional Email:** Custom domain email delivery (`hello@mingler.co.uk`) with SPF/DKIM verification.

> [!TIP]
> **Fast-Track Option for the Client:**  
> If the client prefers not to configure individual API keys manually, they can simply invite the lead developer's email address as an **Administrator** or **Developer** on their Google Cloud, Apple Developer, Meta, and Stripe accounts.

---

## 1. Hosting & Server Infrastructure (Hostinger VPS)

The Mingler production stack consists of:
- **Backend:** Django 5.1 REST API + Gunicorn WSGI + Celery background workers + Celery Beat scheduler.
- **Frontend:** Next.js 16 (React 19) Node.js server with SSR & static optimization.
- **Database:** PostgreSQL 16 relational database with automated daily backups.
- **Cache & Message Broker:** Redis 7 (in-memory caching, rate limiting, Celery task queues).
- **Reverse Proxy & SSL:** Nginx with HTTP/2 and Let's Encrypt automated SSL renewals.

### 1.1 Recommended Hostinger Plan
Purchase a **Hostinger KVM VPS** with the following minimum specifications:

| Component | Minimum Specification (Launch) | Recommended Specification (Scale) |
| :--- | :--- | :--- |
| **Hostinger Plan** | **KVM 2** | **KVM 4** |
| **vCPU** | 2 Cores | 4 Cores |
| **RAM** | 8 GB | 16 GB |
| **Disk Space** | 100 GB NVMe SSD | 200 GB NVMe SSD |
| **Bandwidth** | 8 TB | 16 TB |
| **Operating System** | **Ubuntu 24.04 LTS (64-bit)** | **Ubuntu 24.04 LTS (64-bit)** |
| **Location** | London, UK (or Frankfurt, Germany) | London, UK |

### 1.2 Information Needed from Client
- [ ] **VPS IP Address** (e.g., `185.xxx.xxx.xxx`)
- [ ] **Root SSH Password** OR **SSH Public Key authorization**
- [ ] **Access to Domain DNS Manager** (Hostinger, Cloudflare, Namecheap, or GoDaddy) to configure the DNS records:

```text
A Record      @                  ->  [VPS IP Address]
A Record      www                ->  [VPS IP Address]
A Record      api                ->  [VPS IP Address]
CNAME Record  media              ->  [Cloudflare R2 / S3 Endpoint]
```

---

## 2. Stripe Payment Processing

Stripe handles all ticket checkout sessions, instant card debits, Apple Pay, Google Pay, and refund workflows.

### 2.1 Information Needed from Client
- [ ] **Stripe Live Publishable Key:** Starts with `pk_live_...`
- [ ] **Stripe Live Secret Key:** Starts with `sk_live_...`
- [ ] **Stripe Webhook Signing Secret:** Starts with `whsec_...`

### 2.2 Client Instructions to Obtain Stripe Keys
1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle the switch at the top right from **Test Mode** to **Live Mode**.
3. Navigate to **Developers** &rarr; **API keys**:
   - Copy the **Publishable key** (`pk_live_...`).
   - Click **Reveal live key** to copy the **Secret key** (`sk_live_...`).
4. Navigate to **Developers** &rarr; **Webhooks**:
   - Click **+ Add destination** (or **Add endpoint**).
   - **Endpoint URL:** `https://api.mingler.co.uk/api/v1/payments/webhook/`
   - **Version:** Latest (default).
   - **Events to listen to:** Select the following 3 events:
     - `checkout.session.completed` (Triggers booking confirmation)
     - `payment_intent.succeeded` (Confirms transaction capture)
     - `charge.refunded` (Handles ticket cancellations/refunds)
   - Click **Add endpoint**.
   - Under **Signing secret**, click **Reveal** and copy the secret (`whsec_...`).
5. Complete business verification and connect the business bank account under **Settings &rarr; Bank accounts & scheduling** for automated payouts in GBP (£).

---

## 3. Social Authentication (OAuth 2.0 Credentials)

Mingler supports one-click social signup/login across 6 major platforms. The client must register the application in each provider's developer console.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mingler OAuth Routing                    │
├─────────────────────────────────────────────────────────────┤
│ Callback Domain:   https://mingler.co.uk                    │
│ Callback Pattern:  https://mingler.co.uk/auth/callback/[id] │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.1 Google OAuth 2.0

- [ ] **`GOOGLE_CLIENT_ID`** (e.g., `xxxxxxxx.apps.googleusercontent.com`)
- [ ] **`GOOGLE_CLIENT_SECRET`**

**Client Instructions:**
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project named **`Mingler`**.
3. Go to **APIs & Services** &rarr; **OAuth consent screen**:
   - User Type: **External**.
   - App Name: `Mingler`.
   - User support email: `hello@mingler.co.uk`.
   - Developer contact email: Client contact.
   - Authorized domains: `mingler.co.uk`.
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
4. Go to **APIs & Services** &rarr; **Credentials** &rarr; **Create Credentials** &rarr; **OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Mingler Web Client`.
   - **Authorized JavaScript origins:**
     - `https://mingler.co.uk`
     - `https://www.mingler.co.uk`
   - **Authorized redirect URIs:**
     - `https://mingler.co.uk/auth/callback/google`
5. Click **Create** and copy the **Client ID** and **Client Secret**.

---

### 3.2 Apple Sign In

- [ ] **`APPLE_TEAM_ID`** (10-character team ID from Apple Developer membership)
- [ ] **`APPLE_CLIENT_ID`** (Service ID, e.g., `uk.co.mingler.web`)
- [ ] **`APPLE_KEY_ID`** (10-character Key ID)
- [ ] **`APPLE_PRIVATE_KEY`** (Downloadable `.p8` file content)

**Client Instructions:**
1. Log in to [Apple Developer Portal](https://developer.apple.com/account/).
2. Under **Certificates, Identifiers & Profiles**:
   - **Identifiers &rarr; App IDs:** Create an App ID for Mingler. Enable **Sign In with Apple**.
   - **Identifiers &rarr; Services IDs:** Create a Services ID (e.g., `uk.co.mingler.web`).
     - Enable **Sign In with Apple** &rarr; Configure:
     - Primary App ID: Select Mingler App ID.
     - Web Domain: `mingler.co.uk`.
     - Return URL: `https://mingler.co.uk/auth/callback/apple`.
3. Under **Keys**:
   - Create a new Key named `Mingler Sign In with Apple Key`.
   - Check **Sign In with Apple** and select the Primary App ID.
   - Download the `.p8` private key file (can only be downloaded once) and note the **Key ID**.

---

### 3.3 Meta / Facebook Login

- [ ] **`FACEBOOK_CLIENT_ID`** (App ID)
- [ ] **`FACEBOOK_CLIENT_SECRET`** (App Secret)

**Client Instructions:**
1. Log in to [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps** &rarr; **Create App** &rarr; Select **Authenticate and request data from users with Facebook Login**.
3. Under **App settings &rarr; Basic**:
   - App Domains: `mingler.co.uk`.
   - Privacy Policy URL: `https://mingler.co.uk/privacy` (or placeholder).
   - Terms of Service URL: `https://mingler.co.uk/terms`.
   - Copy **App ID** and **App Secret**.
4. In the left menu, select **Facebook Login &rarr; Settings**:
   - Client OAuth Login: **Yes**.
   - Web OAuth Login: **Yes**.
   - **Valid OAuth Redirect URIs:**
     - `https://mingler.co.uk/auth/callback/facebook`
   - Click **Save Changes**.
5. Switch the app from **In Development** to **Live**.

---

### 3.4 Instagram Graph API

- [ ] **`INSTAGRAM_CLIENT_ID`**
- [ ] **`INSTAGRAM_CLIENT_SECRET`**

**Client Instructions:**
1. In the same [Meta Developer App](https://developers.facebook.com/), go to **Add Product** &rarr; choose **Instagram**.
2. Select **Instagram Basic Display** or **Instagram Graph API**.
3. Under **User Token Generator / OAuth settings**:
   - **Valid OAuth Redirect URIs:** `https://mingler.co.uk/auth/callback/instagram`.
4. Copy the Instagram App ID and App Secret.

---

### 3.5 TikTok for Developers

- [ ] **`TIKTOK_CLIENT_KEY`**
- [ ] **`TIKTOK_CLIENT_SECRET`**

**Client Instructions:**
1. Log in to [TikTok for Developers](https://developers.tiktok.com/).
2. Create an App under **Manage Apps**.
3. Enable **Login Kit**.
4. Set **Redirect URL:** `https://mingler.co.uk/auth/callback/tiktok`.
5. Submit the app review for standard user profile permissions (`user.info.basic`).
6. Copy the **Client Key** and **Client Secret**.

---

### 3.6 LinkedIn Developer Portal

- [ ] **`LINKEDIN_CLIENT_ID`**
- [ ] **`LINKEDIN_CLIENT_SECRET`**

**Client Instructions:**
1. Log in to [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Click **Create App**:
   - App Name: `Mingler`.
   - Associate with Mingler's LinkedIn Company Page.
3. Under the **Auth** tab:
   - **Authorized redirect URLs for your app:**
     - `https://mingler.co.uk/auth/callback/linkedin`
   - Copy **Client ID** and **Client Secret**.
4. Under the **Products** tab, request access to **Sign In with LinkedIn using OpenID Connect** (approved automatically).

---

## 4. Media Asset Storage (Cloudflare R2 or AWS S3)

To ensure attendee profile avatars, venue photography, and event cover banners persist reliably and load fast across the UK, an S3-compatible object storage bucket is required.

> [!TIP]
> **Recommended: Cloudflare R2**  
> Cloudflare R2 offers **zero egress fees** and is significantly more cost-effective than AWS S3 for image-heavy consumer platforms.

### 4.1 Information Needed from Client
- [ ] **Storage Provider:** Cloudflare R2 (or AWS S3)
- [ ] **`CLOUDFLARE_R2_ACCESS_KEY_ID`** (or `AWS_ACCESS_KEY_ID`)
- [ ] **`CLOUDFLARE_R2_SECRET_ACCESS_KEY`** (or `AWS_SECRET_ACCESS_KEY`)
- [ ] **`CLOUDFLARE_R2_BUCKET_NAME`** (e.g., `mingler-media`)
- [ ] **`CLOUDFLARE_R2_ENDPOINT_URL`** (e.g., `https://<account-id>.r2.cloudflarestorage.com`)
- [ ] **`CLOUDFLARE_R2_CUSTOM_DOMAIN`** (e.g., `media.mingler.co.uk`)

### 4.2 Cloudflare R2 Setup Instructions
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) &rarr; select **R2 Object Storage**.
2. Click **Create bucket** &rarr; Name: `mingler-media` &rarr; Location: **WNAM / WEUR (Europe)**.
3. Under bucket **Settings** &rarr; **Public access**:
   - Connect a custom domain: `media.mingler.co.uk`.
4. Go to **R2 &rarr; Manage R2 API Tokens** &rarr; **Create API Token**:
   - Permissions: **Object Read & Write**.
   - Bucket: Apply to `mingler-media`.
   - Copy the **Access Key ID**, **Secret Access Key**, and **S3 Endpoint URL**.

---

## 5. Transactional Email Service

Mingler dispatches critical transactional emails:
- 6-digit account verification OTPs
- Password reset OTP codes
- Ticket purchase confirmation receipts
- Mutual match celebration alerts

### 5.1 Option A: Dedicated Email API — Resend (Recommended)
- [ ] **`RESEND_API_KEY`** (e.g., `re_xxxxxxxxxxxx`)
- [ ] **`DEFAULT_FROM_EMAIL`** (e.g., `Mingler <hello@mingler.co.uk>`)

**Instructions:**
1. Sign up at [Resend.com](https://resend.com/).
2. Add your domain `mingler.co.uk` under **Domains**.
3. Add the 3 generated DNS records (SPF, DKIM, DMARC) to your domain DNS manager to achieve 100% inbox placement.
4. Navigate to **API Keys** &rarr; Click **Create API Key** (Full Access) &rarr; Copy key.

### 5.2 Option B: Google Workspace / Microsoft 365 SMTP
- [ ] **`EMAIL_HOST`** (e.g., `smtp.gmail.com` or `smtp.office365.com`)
- [ ] **`EMAIL_PORT`** (`587` for TLS or `465` for SSL)
- [ ] **`EMAIL_HOST_USER`** (`hello@mingler.co.uk`)
- [ ] **`EMAIL_HOST_PASSWORD`** (16-character Google Workspace App Password)

---

## 6. Master Production Checklist for Client

| Category | Item | Required Key / Value | Status |
| :--- | :--- | :--- | :---: |
| **Hosting** | Hostinger VPS | IP, Root SSH Access, Ubuntu 24.04 LTS | [ ] Pending |
| **DNS** | Domain Access | A records for `mingler.co.uk`, `api.mingler.co.uk` | [ ] Pending |
| **Payments** | Stripe Live Keys | `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` | [ ] Pending |
| **Payments** | Stripe Webhook | `STRIPE_WEBHOOK_SECRET` | [ ] Pending |
| **OAuth** | Google Cloud | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [ ] Pending |
| **OAuth** | Apple Developer | Team ID, Service ID, Key ID, `.p8` file | [ ] Pending |
| **OAuth** | Meta (Facebook) | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | [ ] Pending |
| **OAuth** | Instagram | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | [ ] Pending |
| **OAuth** | TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | [ ] Pending |
| **OAuth** | LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | [ ] Pending |
| **Storage** | Cloudflare R2 | Access Key, Secret Key, Endpoint, Bucket Name | [ ] Pending |
| **Email** | Transactional Mail | Resend API Key OR Google Workspace App Password | [ ] Pending |

---

## 7. Next Steps for Developer & Client

1. **Client Action:** Client reviews this document, creates/collects the credentials, and securely transmits them via a password manager (e.g., 1Password, Bitwarden) or invites the developer to their accounts.
2. **DevOps Provisioning:** Once the Hostinger VPS IP and root credentials are provided, the developer will:
   - Harden the Ubuntu server (UFW firewall, SSH key-only authentication, fail2ban).
   - Set up Docker & Docker Compose or native Nginx + systemd services.
   - Configure PostgreSQL 16 with automated backups.
   - Install Let's Encrypt SSL certificates for HTTPS.
   - Wire in all live environment variables and run end-to-end payment and auth sanity checks.
