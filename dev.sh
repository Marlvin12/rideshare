#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

if [ ! -f "server/.env" ]; then
  echo "Error: server/.env not found. Create it before running."
  exit 1
fi

echo "Xigoa dev startup (server + ngrok + config)"
echo "If sign-in or API calls fail, set ngrok authtoken: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "  Run: ngrok authtoken <your-token>"
echo ""

SERVER_PID=""
NGROK_PID=""

cleanup() {
  if [ -n "$NGROK_PID" ]; then kill "$NGROK_PID" 2>/dev/null || true; fi
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

echo "Starting server on port 3000..."
(cd server && npm run dev) &
SERVER_PID=$!
sleep 2

echo "Starting ngrok tunnel..."
ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

echo "Waiting for ngrok tunnel..."
NGROK_URL=""
for _ in $(seq 1 20); do
  NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$NGROK_URL" ]; then break; fi
  sleep 1
done

if [ -z "$NGROK_URL" ]; then
  echo "ngrok did not start. Set your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  Run: ngrok authtoken <your-token>"
  exit 1
fi

SOCKET_URL="wss://${NGROK_URL#https://}"
ENV_PATH="client/.env"

if [ -f "$ENV_PATH" ]; then
  tmp_env=$(mktemp)
  grep -v '^EXPO_PUBLIC_API_URL=' "$ENV_PATH" | grep -v '^EXPO_PUBLIC_WS_URL=' > "$tmp_env"
  echo "EXPO_PUBLIC_API_URL=${NGROK_URL}" >> "$tmp_env"
  echo "EXPO_PUBLIC_WS_URL=${SOCKET_URL}" >> "$tmp_env"
  mv "$tmp_env" "$ENV_PATH"
fi

echo ""
echo "Tunnel URL: $NGROK_URL"
echo "Config updated: $ENV_PATH"
echo ""
echo "To start the app:"
echo "  iOS Simulator:    cd client && npx expo start --ios"
echo "  Android device:   cd client && npx expo start --android"
echo "  (First time: use  npx expo run:ios  or  npx expo run:android  to install the dev build.)"
echo ""
echo "Server and ngrok are running in the background. Stop with Ctrl+C."
wait $NGROK_PID 2>/dev/null || true
