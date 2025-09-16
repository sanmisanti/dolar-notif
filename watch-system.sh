#!/bin/bash

# Script para monitoreo continuo del sistema

echo "🔄 MODO MONITOREO CONTINUO - Actualizando cada 30 segundos"
echo "   Presiona Ctrl+C para salir"
echo ""

trap 'echo -e "\n👋 Monitoreo terminado"; exit 0' INT

while true; do
    ./check-production-status.sh
    echo ""
    echo -e "🔄 Próxima actualización en 30 segundos... (Ctrl+C para salir)"
    echo "════════════════════════════════════════════════════════════════"
    sleep 30
    clear
done