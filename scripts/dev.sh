#!/usr/bin/env bash
# Arranca Expo con túnel y publica una página con un botón "Abrir en Expo Go"
# para evitar tener que copiar/pegar la URL exp:// desde la terminal.
#
# Uso: bash fitness-app/scripts/dev.sh
#      (o desde la raíz: bash dev.sh)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

LOG=/tmp/expo.log
LINKDIR=/tmp/expo-link
mkdir -p "$LINKDIR"

placeholder() {
  cat > "$LINKDIR/index.html" <<EOF
<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>GymTracker</title>
<meta http-equiv="refresh" content="5"></head>
<body style="font-family:-apple-system,sans-serif;padding:2rem;background:#0B0F14;color:#E6EDF3;text-align:center;line-height:1.6">
<h1>GymTracker</h1>
<p>$1</p>
<p style="color:#8B98A8;font-size:0.9rem">Esta página se refresca sola cada 5s.</p>
</body></html>
EOF
}

placeholder "Arrancando dev server&hellip;"

# Servidor estático en puerto 3000 (lo que ve Codespaces)
if ! lsof -i:3000 >/dev/null 2>&1; then
  (cd "$LINKDIR" && python3 -m http.server 3000 >/dev/null 2>&1) &
  SERVER_PID=$!
fi

# Instalar deps si hace falta
if [ ! -d node_modules ]; then
  placeholder "Instalando dependencias (1-2 min)&hellip;"
  npm install --no-audit --no-fund
fi

placeholder "Esperando t&uacute;nel de Expo (30-60s)&hellip;"

# Limpiar log y arrancar expo con CI=1 (no interactivo, imprime URLs)
: > "$LOG"
CI=1 npx expo start --tunnel >> "$LOG" 2>&1 &
EXPO_PID=$!

cleanup() {
  kill "$EXPO_PID" 2>/dev/null || true
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Esperando URL del túnel…"
URL=""
for i in $(seq 1 90); do
  URL=$(grep -oE 'exp://[a-zA-Z0-9.-]+\.exp\.direct[a-zA-Z0-9./_-]*' "$LOG" | head -1 || true)
  if [ -n "$URL" ]; then break; fi
  if ! kill -0 "$EXPO_PID" 2>/dev/null; then
    echo "Expo se cayó. Log:"
    cat "$LOG"
    exit 1
  fi
  sleep 2
done

if [ -z "$URL" ]; then
  echo "No se obtuvo URL del túnel en 3 min. Log:"
  tail -50 "$LOG"
  exit 1
fi

cat > "$LINKDIR/index.html" <<EOF
<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GymTracker</title>
</head>
<body style="font-family:-apple-system,sans-serif;padding:2rem;background:#0B0F14;color:#E6EDF3;text-align:center;line-height:1.6;min-height:100vh;margin:0;display:flex;flex-direction:column;justify-content:center;align-items:center">
  <h1 style="font-size:2rem;margin-bottom:0.5rem">GymTracker</h1>
  <p style="color:#8B98A8;margin-bottom:2rem">Tu app de gimnasio est&aacute; lista</p>
  <a href="$URL" style="display:inline-block;padding:1.3rem 2.5rem;background:#22D3EE;color:#001016;border-radius:0.8rem;font-weight:800;text-decoration:none;font-size:1.15rem;box-shadow:0 8px 24px rgba(34,211,238,0.3)">
    Abrir en Expo Go &rarr;
  </a>
  <p style="margin-top:2.5rem;font-size:0.85rem;color:#8B98A8;max-width:340px">
    Aseg&uacute;rate de tener <b>Expo Go</b> instalado. Si el bot&oacute;n no abre nada, copia la URL de abajo y p&eacute;gala en Expo Go &rarr; "Enter URL manually".
  </p>
  <code style="display:block;padding:0.8rem;background:#141A22;border:1px solid #2A3441;border-radius:0.5rem;margin-top:1rem;word-break:break-all;color:#22D3EE;font-size:0.85rem;max-width:90vw">$URL</code>
</body></html>
EOF

echo ""
echo "==================================================="
echo "  LISTO. URL del túnel: $URL"
echo ""
echo "  En Codespaces: abre la pestaña 'Ports' (abajo)"
echo "  y toca el ícono de globo del puerto 3000."
echo "  Verás una página con un botón 'Abrir en Expo Go'."
echo "==================================================="
echo ""

wait "$EXPO_PID"
