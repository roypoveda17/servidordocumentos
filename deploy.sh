#!/bin/bash
# Despliegue SCI — limpia dist viejo para no dejar favicon Angular
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "🧹 Limpiando build anterior (evita iconos/HTML viejos)..."
rm -rf dist

echo "📦 Compilando Angular (producción)..."
npm run build -- --configuration production

DIST="dist/servidordocumentos/browser"
if [[ ! -f "$DIST/version.json" ]]; then
  echo "❌ Falta version.json en el build. Abortando."
  exit 1
fi
if [[ ! -f "$DIST/sci-brand-7-192.png" ]]; then
  echo "❌ Falta icono sci-brand-7-192.png. Abortando."
  exit 1
fi
if grep -q "angular-logo\|Hello,.*Servidordocumentos\|Congratulations" "$DIST/main-"*.js 2>/dev/null; then
  echo "⚠️  Advertencia: el bundle aún menciona la plantilla Angular."
fi

echo "🔎 Versión empaquetada:"
cat "$DIST/version.json"

echo "🔄 Reiniciando servicio de producción (4000)..."
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart servidordocumentos || true
  sleep 1
  sudo systemctl is-active servidordocumentos || echo "⚠️  Revisá el servicio manualmente"
else
  echo "⚠️  systemctl no disponible. Reiniciá Express: node server.js"
fi

echo ""
echo "✅ Deploy listo → http://192.168.100.10:4000"
echo "   Verificación rápida:"
echo "   curl -s http://192.168.100.10:4000/version.json"
echo "   Debés ver: \"build\": 7"
echo ""
echo "En el teléfono:"
echo "  1) Desinstalá SCI (Ajustes → Apps → SCI → Desinstalar)"
echo "  2) Chrome → icono ⋮ del sitio → 'Borrar datos' / 'Site settings' → Clear"
echo "  3) Abrí la URL, confirmá que dice 'build 7'"
echo "  4) Recién ahí: Instalar app"
