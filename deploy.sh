#!/bin/bash
# Script de despliegue para Angular + Express

echo "📦 Compilando Angular en modo producción..."
ng build --configuration production

echo "🔄 Reiniciando servicio de producción (4000)..."
sudo systemctl restart servidordocumentos

echo "✅ Deploy completado. Tu app está en http://192.168.100.10:4000"
