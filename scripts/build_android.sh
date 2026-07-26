#!/usr/bin/env bash
# build_android.sh — Shell script to generate an Android APK file from this repo.
#
# Supports:
#   1. Local Gradle Build (Default) — Uses local Android SDK & Java.
#   2. EAS Cloud Build — Uses Expo Application Services (requires Expo login).
#   3. EAS Local Build — Uses EAS locally.
#
# Usage:
#   ./scripts/build_android.sh [local|eas-cloud|eas-local] [debug|release]

set -eo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log()  { echo -e "${CYAN}[build]${RESET} $*"; }
ok()   { echo -e "${GREEN}[build]${RESET} $*"; }
warn() { echo -e "${YELLOW}[build]${RESET} $*"; }
err()  { echo -e "${RED}[build]${RESET} $*"; }

# ── Parse Arguments ────────────────────────────────────────────────────────────
BUILD_METHOD="${1:-local}" # local, eas-cloud, eas-local
BUILD_TYPE="${2:-debug}"   # debug, release (only applicable to local gradle build)

# ── Header ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${CYAN}   📱  Flyship — Android APK Build Script${RESET}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Build Method: ${BOLD}${BUILD_METHOD}${RESET}"
echo -e "  Build Type:   ${BOLD}${BUILD_TYPE}${RESET}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# Ensure we're in the mobile directory
cd "$MOBILE_DIR"

# Install npm dependencies if node_modules is missing
if [[ ! -d "node_modules" ]]; then
  log "node_modules missing. Running npm install..."
  npm install
fi

# ── Method 1: Local Gradle Build ────────────────────────────────────────────────
build_local() {
  log "Verifying local environment..."

  # 1. Setup JAVA_HOME
  if [[ -z "${JAVA_HOME:-}" ]]; then
    if [[ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]]; then
      export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    elif [[ -x "/usr/libexec/java_home" ]]; then
      export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home)
    fi
  fi

  if [[ -n "${JAVA_HOME:-}" ]]; then
    log "Using JAVA_HOME: $JAVA_HOME"
  else
    warn "JAVA_HOME is not set. The build might fail if java is not in your PATH."
  fi

  # 2. Setup ANDROID_HOME
  if [[ -z "${ANDROID_HOME:-}" ]]; then
    if [[ -d "$HOME/Library/Android/sdk" ]]; then
      export ANDROID_HOME="$HOME/Library/Android/sdk"
    fi
  fi

  if [[ -n "${ANDROID_HOME:-}" ]]; then
    log "Using ANDROID_HOME: $ANDROID_HOME"
    export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools"
  else
    err "ANDROID_HOME is not set and could not be auto-detected at $HOME/Library/Android/sdk."
    err "Please install the Android SDK or set ANDROID_HOME."
    exit 1
  fi

  # 3. Generate native android directory if missing or clean build requested
  if [[ ! -d "android" ]]; then
    log "Generating native Android project via Expo Prebuild..."
    npx expo prebuild --platform android --no-install
  else
    log "Existing android/ folder found. Reusing it. (Run 'rm -rf android' to regenerate)"
  fi

  # 4. Compile APK with Gradle
  log "Building Android project via Gradle..."
  cd android

  # Make gradlew executable
  chmod +x gradlew

  # Note: deliberately not running `./gradlew clean` here. On this RN/autolinking
  # setup, `clean` triggers :app:externalNativeBuildCleanDebug before the
  # per-module codegen (async-storage, reanimated, etc.) has generated its JNI
  # sources, and CMake's autolinking file references those not-yet-existing
  # directories and fails. assembleDebug/assembleRelease regenerate codegen and
  # rebuild incrementally on their own — no explicit clean needed. If a fully
  # clean build is ever required, run `rm -rf android` to regenerate via
  # `expo prebuild` instead (see the log message above).

  if [[ "$BUILD_TYPE" == "release" ]]; then
    log "Compiling Release APK..."
    ./gradlew assembleRelease

    APK_SOURCE="app/build/outputs/apk/release/app-release.apk"
    APK_DEST="$MOBILE_DIR/build/app-release.apk"
  else
    log "Compiling Debug APK..."
    ./gradlew assembleDebug

    APK_SOURCE="app/build/outputs/apk/debug/app-debug.apk"
    APK_DEST="$MOBILE_DIR/build/app-debug.apk"
  fi

  # 5. Locate & copy output
  if [[ -f "$APK_SOURCE" ]]; then
    mkdir -p "$MOBILE_DIR/build"
    cp "$APK_SOURCE" "$APK_DEST"
    echo ""
    ok "Success! APK compiled successfully."
    ok "Location: $APK_DEST"
  else
    err "Build completed but could not locate output APK at $APK_SOURCE"
    exit 1
  fi
}

# ── Method 2: EAS Cloud Build ──────────────────────────────────────────────────
build_eas_cloud() {
  log "Checking EAS CLI..."
  if ! command -v eas &> /dev/null; then
    err "EAS CLI is not installed. Run 'npm install -g eas-cli' first."
    exit 1
  fi

  log "Triggering EAS Cloud Build (preview profile)..."
  # Profile preview builds an APK as specified in eas.json
  eas build --platform android --profile preview
}

# ── Method 3: EAS Local Build ──────────────────────────────────────────────────
build_eas_local() {
  log "Checking EAS CLI..."
  if ! command -v eas &> /dev/null; then
    err "EAS CLI is not installed. Run 'npm install -g eas-cli' first."
    exit 1
  fi

  log "Triggering EAS Local Build..."
  # Builds locally using EAS CLI orchestration and local dependencies
  eas build --platform android --profile preview --local
}

# ── Execute Selected Method ────────────────────────────────────────────────────
case "$BUILD_METHOD" in
  local)     build_local ;;
  eas-cloud) build_eas_cloud ;;
  eas-local) build_eas_local ;;
  *)
    err "Invalid build method: $BUILD_METHOD"
    echo "Usage: $0 [local|eas-cloud|eas-local] [debug|release]"
    exit 1
    ;;
esac
