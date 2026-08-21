#!/usr/bin/env bash
# Install Job X-Ray API as a macOS login service so Chrome can use the
# extension without opening this project or running npm by hand.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.jobxray.api"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
NODE="$(command -v node)"
API_DIR="$ROOT/apps/api"
LOG_DIR="$API_DIR/logs"

if [[ -z "$NODE" ]]; then
  echo "Node.js not found on PATH. Install Node 20+ and try again."
  exit 1
fi

if [[ ! -f "$API_DIR/.env" ]]; then
  echo "Missing $API_DIR/.env — add GEMINI_API_KEY first."
  exit 1
fi

echo "Building API…"
npm run build -w @job-xray/shared-types
npm run build -w @job-xray/api

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

NODE_BIN="$(dirname "$NODE")"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE}</string>
    <string>${API_DIR}/dist/index.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${API_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key>
    <string>production</string>
    <key>HOST</key>
    <string>127.0.0.1</string>
    <key>PATH</key>
    <string>${NODE_BIN}:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl enable "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl kickstart -k "gui/$(id -u)/${LABEL}" 2>/dev/null || true

echo
echo "API service installed. It starts on login and stays running."
echo "Health:  http://localhost:8787/health"
echo "Logs:    $LOG_DIR"
echo "Stop:    npm run uninstall:api-service"
echo
sleep 1
curl -sf http://127.0.0.1:8787/health && echo || echo "Not up yet — check $LOG_DIR/stderr.log"
EOF