#!/usr/bin/env bash
# upload_apk_gcs.sh — Upload the compiled Android APK to Google Cloud Storage
# and print a public download URL (+ QR code).
#
# Usage:
#   ./scripts/upload_apk_gcs.sh [path/to/apk]
#
# Env overrides:
#   GCS_PROJECT_ID   (default: peerpost-v2)
#   GCS_REGION       (default: us-central1)
#   GCS_BUCKET_NAME  (default: ${GCS_PROJECT_ID}-apk-releases)

set -eo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT_ID="${GCS_PROJECT_ID:-peerpost-v2}"
REGION="${GCS_REGION:-us-central1}"
BUCKET_NAME="${GCS_BUCKET_NAME:-${PROJECT_ID}-apk-releases}"

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log()  { echo -e "${CYAN}[upload]${RESET} $*"; }
ok()   { echo -e "${GREEN}[upload]${RESET} $*"; }
warn() { echo -e "${YELLOW}[upload]${RESET} $*"; }
err()  { echo -e "${RED}[upload]${RESET} $*"; }

# ── Sanity checks ────────────────────────────────────────────────────────────
if ! command -v gcloud >/dev/null 2>&1; then
  err "gcloud CLI not found. Install the Google Cloud SDK first."
  exit 1
fi

if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  err "Can't access GCP project '$PROJECT_ID' with the active gcloud account."
  echo "Run 'gcloud auth login' (interactive reauth may be required) and retry."
  exit 1
fi

# ── Locate APK ───────────────────────────────────────────────────────────────
APK_PATH="${1:-}"

if [[ -z "$APK_PATH" ]]; then
  if [[ -f "$MOBILE_DIR/build/app-release.apk" ]]; then
    APK_PATH="$MOBILE_DIR/build/app-release.apk"
  elif [[ -f "$MOBILE_DIR/build/app-debug.apk" ]]; then
    APK_PATH="$MOBILE_DIR/build/app-debug.apk"
  elif [[ -f "$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk" ]]; then
    APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk"
  elif [[ -f "$MOBILE_DIR/android/app/build/outputs/apk/debug/app-debug.apk" ]]; then
    APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
  fi
fi

if [[ -z "$APK_PATH" || ! -f "$APK_PATH" ]]; then
  err "Could not locate any compiled APK file."
  echo "Please compile the APK first using:"
  echo "  ./scripts/build_android.sh"
  echo ""
  echo "Or specify a custom path:"
  echo "  $0 path/to/your.apk"
  exit 1
fi

APK_FILENAME=$(basename "$APK_PATH")
APK_SIZE_MB=$(du -h "$APK_PATH" | cut -f1)
OBJECT_PATH="apk/$(date +%Y%m%d-%H%M%S)-${APK_FILENAME}"

# ── Header ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${CYAN}   ☁  Flyship — APK GCS Uploader${RESET}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  File:    ${BOLD}${APK_FILENAME}${RESET} (${APK_SIZE_MB})"
echo -e "  Path:    ${APK_PATH}"
echo -e "  Project: ${PROJECT_ID}"
echo -e "  Bucket:  gs://${BUCKET_NAME}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# ── Ensure bucket exists ─────────────────────────────────────────────────────
# Note: peerpost-v2 enforces the org policy constraints/storage.uniformBucketLevelAccess,
# so per-object ACLs aren't available — the whole bucket is made publicly readable
# instead (via IAM). Keep this bucket dedicated to APK releases only.
if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" --project="$PROJECT_ID" >/dev/null 2>&1; then
  log "Bucket gs://${BUCKET_NAME} not found. Creating it..."
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="$PROJECT_ID" \
    --location="$REGION"

  log "Granting public read access to the bucket (allUsers: objectViewer)..."
  gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
    --project="$PROJECT_ID" \
    --member=allUsers \
    --role=roles/storage.objectViewer >/dev/null
else
  log "Using existing bucket gs://${BUCKET_NAME}"
fi

# ── Upload ───────────────────────────────────────────────────────────────────
log "Uploading to gs://${BUCKET_NAME}/${OBJECT_PATH}..."
gcloud storage cp "$APK_PATH" "gs://${BUCKET_NAME}/${OBJECT_PATH}" --project="$PROJECT_ID"

DOWNLOAD_URL="https://storage.googleapis.com/${BUCKET_NAME}/${OBJECT_PATH}"

# ── Print Success & QR Code ─────────────────────────────────────────────────
echo ""
ok "Upload Complete!"
echo -e "Download Link: ${BOLD}${GREEN}${DOWNLOAD_URL}${RESET}"
echo ""
log "Generating Terminal QR Code (scan with your phone to download):"
echo ""
curl -s "https://qrenco.de/$DOWNLOAD_URL" || warn "Could not display QR code in terminal."

echo ""
ok "Done."
