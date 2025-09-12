#!/bin/bash

# Script para ejecutar en producción
# Modo: Proceso persistente con logs

echo "🚀 INICIANDO DÓLAR NOTIF EN PRODUCCIÓN"
echo "====================================="

# Crear directorio de logs si no existe
mkdir -p logs

# Función para logging con timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a logs/production.log
}

# Función cleanup
cleanup() {
    log "🛑 Señal de terminación recibida"
    log "🧹 Limpiando procesos..."
    kill $NODE_PID 2>/dev/null
    log "👋 Proceso terminado limpiamente"
    exit 0
}

# Configurar traps para cleanup
trap cleanup SIGTERM SIGINT SIGQUIT

log "🔧 Iniciando sistema..."

# Ejecutar en background y capturar PID
NODE_ENV=production PM2_MODE=true node src/index.js >> logs/app.log 2>&1 &
NODE_PID=$!

log "📍 Proceso iniciado con PID: $NODE_PID"
log "📂 Logs disponibles en:"
log "   - logs/production.log (este script)"
log "   - logs/app.log (aplicación)"

# Verificar que el proceso esté corriendo
sleep 3
if kill -0 $NODE_PID 2>/dev/null; then
    log "✅ Sistema funcionando correctamente"
    log "💡 Para detener: kill $NODE_PID o Ctrl+C"
    log "💡 Para ver logs: tail -f logs/app.log"
else
    log "❌ Error iniciando el sistema"
    exit 1
fi

# Esperar al proceso hijo
wait $NODE_PID
log "🔄 Proceso principal terminado"