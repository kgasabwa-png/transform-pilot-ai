#!/usr/bin/env bash
# Build + sign + notarize the Nyvlo desktop app (sidecar embedded).
#
# One-time setup:
#   1) Install your "Developer ID Application" cert in the login keychain.
#   2) Store notary credentials once:
#        xcrun notarytool store-credentials "nyvlo-notary" \
#          --apple-id "you@nyvloai.com" --team-id "TEAMID" \
#          --password "app-specific-password"
#
# Required env:
#   DEV_ID         e.g. "Developer ID Application: Nyvlo Inc (TEAMID)"
#   NOTARY_PROFILE keychain profile name created above, e.g. "nyvlo-notary"
set -euo pipefail
cd "$(dirname "$0")/.."   # -> desktop/

: "${DEV_ID:?Set DEV_ID to your 'Developer ID Application: NAME (TEAMID)'}"
: "${NOTARY_PROFILE:?Set NOTARY_PROFILE to your notarytool keychain profile}"

APP_NAME="Nyvlo"
OUT="release"
APP="$OUT/$APP_NAME-darwin-universal/$APP_NAME.app"

# 1) Build the Swift sidecar -> desktop/bin/NyvloCapture
bash scripts/build-sidecar.sh

# 2) Package Electron (universal), embedding the sidecar under Resources/bin.
echo "==> packaging $APP_NAME.app"
npx --yes @electron/packager . "$APP_NAME" \
  --platform=darwin --arch=universal --out="$OUT" --overwrite \
  --icon=icon.icns \
  --app-bundle-id=com.nyvlo.desktop \
  --extra-resource=bin \
  --extend-info=build/info.plist \
  --osx-sign=false

# 3) Sign everything (deep) with hardened runtime + entitlements.
echo "==> codesign (hardened runtime)"
npx --yes @electron/osx-sign "$APP" \
  --identity="$DEV_ID" \
  --hardened-runtime \
  --entitlements=build/entitlements.mac.plist \
  --entitlements-inherit=build/entitlements.mac.plist \
  --gatekeeper-assess=false

# 4) Notarize the whole bundle and staple the ticket.
echo "==> notarize"
ditto -c -k --keepParent "$APP" "$OUT/$APP_NAME.zip"
xcrun notarytool submit "$OUT/$APP_NAME.zip" \
  --keychain-profile "$NOTARY_PROFILE" --wait

echo "==> staple"
xcrun stapler staple "$APP"
xcrun stapler validate "$APP"

echo "==> done: $APP (signed, notarized, stapled)"
