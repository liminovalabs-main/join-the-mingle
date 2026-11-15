# Production DevOps Deployment Runbook
**The Definitive Field Guide for Deploying Django, Next.js, PostgreSQL, Redis, and Caddy on a Sovereign Linux VPS**

---

## 1. System Architecture & DevOps Principles

This guide details the exact, battle-tested procedure for taking a modern full-stack web application from local development to a sovereign, production-hardened Linux Virtual Private Server (Hostinger KVM / Ubuntu 24.04 LTS) using Docker Compose v2 and Caddy.

```
                              [ Public Internet ]
                                       │
                              Ports 80 / 443 (HTTPS)
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Hostinger VPS (Ubuntu 24.04 LTS) — Host Firewall (UFW: [22, 80, 443]) │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Caddy Edge Proxy (Automated TLS: mingler.co.uk & www redirect)   │  │
│  └───────┬────────────────────────────────────────────┬─────────────┘  │
│          │                                            │                │
│          │ Forward: /*                                │ Forward:       │
│          │                                            │ /api/*, /admin │
│          ▼                                            │ /health/, etc. │
│  ┌───────────────────────┐                            ▼                │
│  │ Next.js Frontend      │ (Port 3000)   ┌──────────────────────────┐  │
│  │ (Standalone Node.js)  │               │ Django API (Gunicorn)    │  │
│  └───────────────────────┘               │ (Port 8000)              │  │
│       [ Network: edge ]                  └────────────┬─────────────┘  │
│                                                       │                │
│                  ┌────────────────────────────────────┴─────┐          │
│                  ▼                                          ▼          │
│  ┌───────────────────────────────┐        ┌─────────────────────────┐  │
│  │ Celery Worker & Beat          │        │ PostgreSQL 16 (Alpine)  │  │
│  │ (Async Emails & Tasks)        │        │ (Port 5432 - NO EXPOSE) │  │
│  └───────────────┬───────────────┘        └─────────────────────────┘  │
│                  ▼                                                     │
│  ┌───────────────────────────────┐              [ Network: data ]      │
│  │ Redis 7.2 (Cache & Broker)    │              (internal: true)       │
│  │ (Port 6379 - NO EXPOSE)       │                                     │
│  └───────────────────────────────┘                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Core DevOps Principles Applied
1. **Least Privilege:** Internal services (PostgreSQL, Redis) are never bound to public host ports. They exist solely inside a private Docker bridge network (`internal: true`).
2. **Defence in Depth:** Dual-layer network security using both host UFW firewall rules and Docker internal network isolation.
3. **Immutability & Statelessness:** Application containers are stateless; all persistent state is cleanly mounted to named Docker volumes (`postgres_data`, `media_data`, `caddy_data`).
4. **Automated Ephemeral Lifecycle:** Zero-downtime rolling deploys and automatic database backups with 14-day retention.
5. **No Cleartext Secrets:** Production environment files are locked down (`chmod 600`) and excluded from version control.

---

## 2. Phase 1: Domain & DNS Configuration (123 Reg / Registrar)

Before running Caddy on the VPS, your domain's DNS records must be pointing to your VPS IP so Let's Encrypt can verify domain ownership over port 80 and issue SSL certificates automatically.

### Steps:
1. Log in to your domain registrar (e.g., **123 Reg** at `https://www.123-reg.co.uk/`).
2. Go to **Manage Domains** > Select your domain (`mingler.co.uk`) > **Manage DNS** (or Advanced DNS).
3. Add or update the following DNS records:

| Record Type | Name / Host | Destination / Value | TTL | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (apex) | `YOUR_HOSTINGER_VPS_IP` | 300 (or Auto) | Directs the root domain `mingler.co.uk` to the VPS IPv4 address. |
| **CNAME** | `www` | `mingler.co.uk` | 300 (or Auto) | Directs `www.mingler.co.uk` to the root domain. |

### DNS Propagation Verification:
From your local terminal, verify that the domain resolves to your VPS:
```bash
dig +short mingler.co.uk
dig +short www.mingler.co.uk
```
*Expected output: Your VPS Public IPv4 address.*

---

## 3. Phase 2: First-Time SSH Connection & Base OS Hardening

Connect to your server via SSH from your terminal:

```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

### 1. Update OS Packages
Always start by updating the package manager repositories and upgrading installed packages to patch known kernel and system vulnerabilities:

```bash
apt update && apt upgrade -y
```

### 2. Set System Timezone to UTC
Servers should always run in UTC to prevent daylight saving discrepancies in database timestamps and log aggregation:

```bash
timedatectl set-timezone UTC
```

### 3. Install Essential Base Packages
Install essential Linux utilities for networking, source control, and file editing:

```bash
apt install -y curl wget git ufw fail2ban htop jq net-tools ca-certificates gnupg
```

---

## 4. Phase 3: Host Firewall Hardening (UFW)

Configure Uncomplicated Firewall (UFW) to enforce a strict default-deny policy.

```bash
# 1. Set default policies: block all inbound, allow all outbound
ufw default deny incoming
ufw default allow outgoing

# 2. Open only the required operational ports
ufw allow 22/tcp comment 'SSH Management'
ufw allow 80/tcp comment 'HTTP (ACME Challenge / Caddy)'
ufw allow 443/tcp comment 'HTTPS (Secure Traffic)'

# 3. Enable the firewall
ufw --force enable

# 4. Verify firewall status
ufw status verbose
```

*DevOps Explanation:*
Ports 8000 (Django), 3000 (Next.js), 5432 (Postgres), and 6379 (Redis) are completely closed on the host interface. Only Caddy will accept incoming traffic on ports 80/443 and proxy it internally.

---

## 5. Phase 4: Install Official Docker Engine v2 & Compose Plugin

Never use the outdated distribution packages (`apt install docker.io`). Always install Docker Engine v2 directly from Docker's official repository:

```bash
# 1. Run official automated Docker installation script
curl -fsSL https://get.docker.com | sh

# 2. Enable Docker to start automatically on system boot
systemctl enable docker
systemctl start docker

# 3. Verify Docker Engine and Compose v2 versions
docker --version
docker compose version
```

---

## 6. Phase 5: Project Directory & Repository Cloning

Deploy application code in the standard Linux `/opt` directory:

```bash
# 1. Create and navigate to deployment directory
mkdir -p /opt
cd /opt

# 2. Clone the repository from GitHub
git clone https://github.com/liminovalabs-main/join-the-mingle.git mingler
cd /opt/mingler

# 3. Verify directory contents
ls -la
```

---

## 7. Phase 6: Production Secrets & Environment Configuration

### 1. Create `/opt/mingler/.env.production`
Use the shell heredoc (`cat << 'EOF' > ...`) command below to create the production environment file on the server. Replace any placeholders with your live values:

```bash
cat << 'EOF' > /opt/mingler/.env.production
# ============================================================
# Project Mingler — Production Environment Configuration
# ============================================================

# --- Django Core ---
DJANGO_SECRET_KEY=94c8e7b32d0f1a56e4c8b2a19f0e3d2c8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=mingler.co.uk,www.mingler.co.uk,localhost,127.0.0.1,backend
DJANGO_SETTINGS_MODULE=config.settings.production
FRONTEND_URL=https://mingler.co.uk
CORS_ALLOWED_ORIGINS=https://mingler.co.uk,https://www.mingler.co.uk

# --- PostgreSQL ---
POSTGRES_DB=mingler_prod
POSTGRES_USER=mingler_admin
POSTGRES_PASSWORD=Mingler2026_SecureDbPass!
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgres://mingler_admin:Mingler2026_SecureDbPass!@db:5432/mingler_prod

# --- Redis & Celery ---
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# --- Stripe Payments (Live or Test) ---
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# --- Email / SMTP (Transactional OTPs & Booking Confirmations) ---
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=re_your_resend_api_key_here
DEFAULT_FROM_EMAIL=Mingler <onboarding@resend.dev>

# --- Google OAuth ---
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# --- JWT Lifetime ---
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=30
JWT_REFRESH_TOKEN_LIFETIME_DAYS=14
EOF
```

### 2. Lock Down File Permissions (Strict Least-Privilege)
Ensure only the server administrator can read sensitive API keys and database credentials:

```bash
chmod 600 /opt/mingler/.env.production
```

---

## 8. Phase 7: Execute the Zero-Downtime Deployment

### 1. Grant Script Execution Permissions
```bash
cd /opt/mingler
chmod +x scripts/deploy.sh scripts/backup-db.sh
```

### 2. Run the Deployment Script
```bash
./scripts/deploy.sh
```

### Detailed Breakdown of What `deploy.sh` Executes:
1. `git pull origin main`: Synchronizes the latest production commit.
2. `docker compose build --pull`: Compiles the Next.js standalone runner and Django Gunicorn images using multi-stage caching.
3. `docker compose up -d db redis`: Starts database and cache containers.
4. `pg_isready`: Waits until PostgreSQL is accepting connections.
5. `python manage.py migrate --no-input`: Applies any pending database schema migrations.
6. `python manage.py collectstatic --no-input`: Gathers and compresses all Django static files into the shared Docker volume.
7. `docker compose up -d`: Starts Caddy, Next.js, Django, and Celery workers.
8. `Caddy TLS Provisioning`: Caddy automatically requests and installs valid SSL/TLS certificates for `mingler.co.uk` and `www.mingler.co.uk`.
9. `Health Probe`: Executes `curl -f http://localhost:8000/health/` to verify zero regressions.

---

## 9. Phase 8: Verify Live Services & Health Checks

Check container statuses:
```bash
docker compose ps
```

*Expected output: All 7 services (`caddy`, `frontend`, `backend`, `celery-worker`, `celery-beat`, `db`, `redis`) in state `Up` or `Up (healthy)`.*

### Perform Smoke Tests:
```bash
# 1. Internal API Health Probe
curl -fsS http://localhost:8000/health/

# 2. Edge Reverse Proxy Response
curl -I http://localhost/health/

# 3. Live HTTPS Public Domain Check
curl -I https://mingler.co.uk/
```

### View Live Application Logs:
```bash
# View last 50 lines of logs across all services
docker compose logs --tail=50

# Follow backend logs in real time
docker compose logs -f backend

# Follow Caddy web traffic and SSL logs
docker compose logs -f caddy
```

---

## 10. Phase 9: Automated Daily Database Backups (Cron)

Never launch a production database without automated off-container backups.

### 1. Schedule the Nightly Cron Job
Run:
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/mingler/scripts/backup-db.sh >> /var/log/mingler_backup.log 2>&1") | crontab -
```

### 2. Verify Cron Configuration
```bash
crontab -l
```

### 3. Test the Backup Script Manually
Verify that the backup script successfully creates a compressed database snapshot:
```bash
/opt/mingler/scripts/backup-db.sh
ls -lh /var/backups/mingler/
```
*Expected output: A gzipped SQL file e.g. `mingler_db_20261115_205000.sql.gz`.*

---

## 11. Day-2 Operations Runbook

### How to Release Future Code Updates:
Whenever you push new commits to GitHub `main`, simply log in to your VPS and run:
```bash
cd /opt/mingler
./scripts/deploy.sh
```

### How to Update Environment Variables:
If you add or modify a secret in `.env.production`:
```bash
cd /opt/mingler
nano .env.production
# Edit your key, save with Ctrl+O, Enter, Ctrl+X
docker compose up -d backend celery-worker celery-beat
```

### How to Update Caddy Configuration with Zero Downtime:
If you edit `Caddyfile`:
```bash
cd /opt/mingler
nano Caddyfile
docker compose exec caddy caddy reload
```
*(Caddy reloads configuration in milliseconds without dropping active TCP connections).*

### How to Restore a Database from Backup:
In the event of accidental data corruption:
```bash
cd /opt/mingler
# 1. Unzip the target backup file
gunzip -c /var/backups/mingler/mingler_db_YYYYMMDD_HHMMSS.sql.gz > /tmp/restore.sql

# 2. Pipe the SQL dump directly into the PostgreSQL container
docker compose exec -T db psql -U mingler_admin -d mingler_prod < /tmp/restore.sql

# 3. Clean up the temporary unzipped file
rm /tmp/restore.sql
```
