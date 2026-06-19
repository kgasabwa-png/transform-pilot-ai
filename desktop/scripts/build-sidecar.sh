#!/usr/bin/env bash
# Build the NyvloCapture Swift sidecar and stage it for embedding in the .app.
set -euo pipefail
cd "$(dirname "$0")/.."   # -> desktop/

echo "==> swift build -c release (sidecar)"
( cd sidecar && swift build -c release )

mkdir -p bin
cp sidecar/.build/release/NyvloCapture bin/NyvloCapture
chmod +x bin/NyvloCapture
echo "==> staged sidecar at desktop/bin/NyvloCapture"
