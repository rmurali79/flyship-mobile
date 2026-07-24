#!/usr/bin/env bash
# upload_apk.sh — Shell script to upload the compiled Android APK and provide a short download URL / QR Code.
#
# Usage:
#   ./scripts/upload_apk.sh [path/to/apk]

set -eo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Colours ────────────────────────────────────────────────────────────────────
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

# ── Locate APK ─────────────────────────────────────────────────────────────────
APK_PATH="${1:-}"

if [[ -z "$APK_PATH" ]]; then
  # Try to find default APKs
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

# ── Header ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${CYAN}   ☁  Flyship — APK Cloud Uploader${RESET}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  File:  ${BOLD}${APK_FILENAME}${RESET} (${APK_SIZE_MB})"
echo -e "  Path:  ${APK_PATH}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# ── Upload to Cloud ────────────────────────────────────────────────────────────
log "Uploading to transfer.sh..."

# Using transfer.sh as default (active for 14 days, unlimited downloads)
UPLOAD_URL=$(curl --progress-bar --upload-file "$APK_PATH" "https://transfer.sh/$APK_FILENAME" || true)

# Fallback to bashupload.com if transfer.sh fails
if [[ -z "$UPLOAD_URL" || ! "$UPLOAD_URL" =~ ^https?:// ]]; then
  warn "transfer.sh upload failed. Trying backup service (bashupload.com)..."
  UPLOAD_URL=$(curl --progress-bar -T "$APK_PATH" "https://bashupload.com/$APK_FILENAME" | grep -o 'https://bashupload.com/[a-zA-Z0-9/.-]*' | head -n 1 || true)
fi

# Fallback to catbox.moe (200MB limit, no expiry) if others fail
if [[ -z "$UPLOAD_URL" || ! "$UPLOAD_URL" =~ ^https?:// ]]; then
  warn "Backup upload failed. Trying catbox.moe..."
  UPLOAD_URL=$(curl -s --max-time 300 -F "reqtype=fileupload" -F "fileToUpload=@$APK_PATH" https://catbox.moe/user/api.php || true)
fi

# Fallback to file.io (single download limit) if others fail
if [[ -z "$UPLOAD_URL" || ! "$UPLOAD_URL" =~ ^https?:// ]]; then
  warn "catbox.moe upload failed. Trying file.io (Note: expires after 1 download)..."
  RESPONSE=$(curl -s -F "file=@$APK_PATH" https://file.io || true)
  UPLOAD_URL=$(echo "$RESPONSE" | grep -o '"link":"[^"]*' | grep -o 'https://[^"]*' || true)
fi

if [[ -z "$UPLOAD_URL" || ! "$UPLOAD_URL" =~ ^https?:// ]]; then
  err "All upload services failed. Please check your network connection."
  exit 1
fi

# ── Print Success & QR Code ────────────────────────────────────────────────────
echo ""
ok "Upload Complete!"
echo -e "Download Link: ${BOLD}${GREEN}${UPLOAD_URL}${RESET}"
echo ""
log "Generating Terminal QR Code (scan with your phone to download):"
echo ""

# Generate terminal-friendly QR code using qrenco.de
curl -s "https://qrenco.de/$UPLOAD_URL" || warn "Could not display QR code in terminal."

echo ""
ok "Done."
