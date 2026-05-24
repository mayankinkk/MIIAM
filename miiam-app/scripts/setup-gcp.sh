#!/usr/bin/env bash
set -euo pipefail

# ─── MIIAM GCP Infrastructure Setup ───────────────────────────────────────────
# This script provisions Cloud SQL, Cloud Storage, and prints Firebase config.
# Prerequisites: gcloud CLI, firebase CLI, cloud-sql-proxy binary on PATH.
# ────────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${CYAN}→${NC} $1"; }

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║      MIIAM — GCP Infrastructure Setup        ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Prerequisites ──────────────────────────────────────────────────────────────
command -v gcloud >/dev/null 2>&1 || err "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
command -v firebase >/dev/null 2>&1 || warn "firebase CLI not found. Install: npm i -g firebase-tools"

# ─── Project ────────────────────────────────────────────────────────────────────
info "Checking GCP project…"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [[ -z "$PROJECT_ID" ]]; then
  read -rp "Enter your GCP project ID: " PROJECT_ID
  gcloud config set project "$PROJECT_ID"
fi
log "Using project: $PROJECT_ID"

REGION="${GCP_REGION:-us-central1}"
DB_INSTANCE="${DB_INSTANCE:-miiam-db}"
DB_NAME="${DB_NAME:-miiam}"
DB_USER="${DB_USER:-miiam_user}"
DB_PASS=$(openssl rand -base64 18 2>/dev/null || echo "change-me-$(date +%s)")
STORAGE_BUCKET="${STORAGE_BUCKET:-miiam-storage-bucket}"

# ─── 1. Cloud SQL ──────────────────────────────────────────────────────────────
echo ""
info "Setting up Cloud SQL PostgreSQL…"

if gcloud sql instances describe "$DB_INSTANCE" --project="$PROJECT_ID" >/dev/null 2>&1; then
  log "Cloud SQL instance '$DB_INSTANCE' already exists"
else
  gcloud sql instances create "$DB_INSTANCE" \
    --tier=db-f1-micro \
    --region="$REGION" \
    --database-version=POSTGRES_15 \
    --project="$PROJECT_ID"
  log "Created Cloud SQL instance '$DB_INSTANCE'"
fi

gcloud sql databases describe "$DB_NAME" --instance="$DB_INSTANCE" --project="$PROJECT_ID" >/dev/null 2>&1 && \
  log "Database '$DB_NAME' already exists" || \
  gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE" --project="$PROJECT_ID" && \
  log "Created database '$DB_NAME'"

if gcloud sql users list --instance="$DB_INSTANCE" --project="$PROJECT_ID" --format="value(name)" | grep -q "^${DB_USER}$"; then
  log "User '$DB_USER' already exists"
  gcloud sql users set-password "$DB_USER" --instance="$DB_INSTANCE" --password="$DB_PASS" --project="$PROJECT_ID" 2>/dev/null || true
else
  gcloud sql users create "$DB_USER" --instance="$DB_INSTANCE" --password="$DB_PASS" --project="$PROJECT_ID"
  log "Created user '$DB_USER'"
fi

CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE" --project="$PROJECT_ID" --format="value(connectionName)")
log "Cloud SQL connection name: $CONNECTION_NAME"

# ─── 2. Cloud Storage ─────────────────────────────────────────────────────────
echo ""
info "Setting up Cloud Storage bucket…"

if gcloud storage buckets describe "gs://${STORAGE_BUCKET}" --project="$PROJECT_ID" >/dev/null 2>&1; then
  log "Bucket 'gs://${STORAGE_BUCKET}' already exists"
else
  gcloud storage buckets create "gs://${STORAGE_BUCKET}" --location="$REGION" --project="$PROJECT_ID"
  gcloud storage buckets add-iam-policy-binding "gs://${STORAGE_BUCKET}" \
    --member=allUsers --role=roles/storage.objectViewer \
    --project="$PROJECT_ID" 2>/dev/null || warn "Could not set public read (uniform bucket-level access may be enabled)"
  log "Created bucket 'gs://${STORAGE_BUCKET}'"
fi

# ─── 3. Firebase ──────────────────────────────────────────────────────────────
echo ""
info "Firebase setup…"
if command -v firebase >/dev/null 2>&1; then
  warn "Run 'firebase init' to link your project, then enable Authentication > Sign-in method > Email/Password"
  warn "Add a Web App in Firebase Console and copy the config snippet."
else
  warn "Install firebase CLI: npm i -g firebase-tools, then run 'firebase init'"
fi

echo ""
info "To get Firebase Admin SDK credentials:"
echo "  1. Go to https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk"
echo "  2. Click 'Generate new private key' → download JSON"
echo "  3. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY from that JSON"
echo ""

# ─── 4. Cloud SQL Auth Proxy ──────────────────────────────────────────────────
echo ""
info "Cloud SQL Auth Proxy setup…"
if command -v cloud-sql-proxy >/dev/null 2>&1; then
  log "cloud-sql-proxy found"
  echo "  Run: cloud-sql-proxy ${CONNECTION_NAME} &"
  echo "  Then: DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
else
  warn "cloud-sql-proxy not found. Download from: https://cloud.google.com/sql/docs/postgres/connect-auth-proxy#install"
  echo "  Then run: cloud-sql-proxy ${CONNECTION_NAME} &"
fi

# ─── 5. Generate .env.local ───────────────────────────────────────────────────
echo ""
info "Generating .env.local file…"

cat > .env.local << ENVEOF
# Database (via Cloud SQL Auth Proxy on localhost)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

# Firebase Client — PASTE your Web App config values here
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT_ID}.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${PROJECT_ID}.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin — PASTE values from the service-account JSON
FIREBASE_PROJECT_ID=${PROJECT_ID}
FIREBASE_CLIENT_EMAIL=your-service-account@${PROJECT_ID}.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR-KEY-HERE\\n-----END PRIVATE KEY-----"

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}
GOOGLE_CLOUD_STORAGE_BUCKET=${STORAGE_BUCKET}
NEXT_PUBLIC_GCS_BUCKET=${STORAGE_BUCKET}
ENVEOF

log ".env.local created — edit it to fill in your Firebase values"

# ─── 6. Database Schema ──────────────────────────────────────────────────────
echo ""
info "Database schema migration…"
if command -v psql >/dev/null 2>&1; then
  echo "  After starting cloud-sql-proxy, run:"
  echo "  cloud-sql-proxy ${CONNECTION_NAME} &"
  echo "  sleep 2"
  echo "  psql \"\${DATABASE_URL}\" < supabase-full-setup.sql"
  echo "  npx prisma db push"
else
  warn "psql not found. Install PostgreSQL client or run the schema manually."
  echo "  psql \"\${DATABASE_URL}\" < supabase-full-setup.sql"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo ""
echo "  Cloud SQL connection name:  ${CONNECTION_NAME}"
echo "  Database URL (via proxy):   postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
echo "  Storage bucket:             gs://${STORAGE_BUCKET}"
echo ""
echo -e "${YELLOW}  Next steps:${NC}"
echo "  1. Start proxy:  cloud-sql-proxy ${CONNECTION_NAME} &"
echo "  2. Edit .env.local with your Firebase values"
echo "  3. Import schema: psql \"\$DATABASE_URL\" < supabase-full-setup.sql"
echo "  4. Push Prisma:   npx prisma db push"
echo "  5. Run dev:       npm run dev"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
