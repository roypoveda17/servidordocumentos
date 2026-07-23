#!/bin/bash
# Script de despliegue para Angular + Express
set -euo pipefail

echo "📦 Compilando Angular en modo producción..."
npm run build -- --configuration production

echo "🔄 Reiniciando servicio de producción (4000)..."
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart servidordocumentos
else
  echo "⚠️  systemctl no disponible. Reiniciá el proceso Express manualmente:"
  echo "    node server.js"
fi

echo ""
echo "✅ Deploy completado."
echo "   URL: http://192.168.100.10:4000"
echo "   Debés ver el header SCI con nav: Consulta | Inventario | Reporte"
echo "   y el texto 'build 6' bajo el título."
echo ""
echo "Si en el teléfono no se ve:"
echo "  1) Cerrá Chrome por completo"
echo "  2) Volvé a abrir la URL (o desinstalá la PWA y reinstalá)"
echo "  3) En Chrome → sitio → Borrar datos / caché"
