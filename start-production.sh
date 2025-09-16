#!/bin/bash

echo "🚀 INICIANDO DÓLAR NOTIF - MODO PRODUCCIÓN"
echo "========================================"

# Configuración de producción (horario bancario argentino - cada 10 minutos)
# Horario argentino 11:00-18:00 = UTC 14:00-21:00 (UTC+3)
export TESTING_MODE=false
export SCHEDULE_CRON="*/10 14-21 * * 1-5"
export SCHEDULE_START_HOUR=14
export SCHEDULE_END_HOUR=21
export SCHEDULE_WEEKDAYS_ONLY=true
export SCHEDULE_INTERVAL_MINUTES=10
export SCHEDULE_TIMEZONE="America/Argentina/Buenos_Aires"
export SCHEDULE_REPORT_CRON="0 22 */2 * *"  # 19:00 Argentina = 22:00 UTC

# Configuración de notificaciones (ambos emails)
export EMAIL_TO="sanmisanti@gmail.com,ignavillanueva96@gmail.com"

# Base de datos de producción
export DB_PATH="./data/dollar_history.db"

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

echo "📊 CONFIGURACIÓN DE PRODUCCIÓN:"
echo "  ⏰ Horario: Lunes a Viernes, 11:00-18:00 (hora argentina)"
echo "  🌍 UTC: Lunes a Viernes, 14:00-21:00 (servidor AWS)"
echo "  🔄 Intervalo: Cada 10 minutos"
echo "  📧 Destinatarios: $EMAIL_TO"
echo "  📅 Reportes: Cada 2 días a las 19:00"
echo "  🗃️ Base de datos: dollar_history.db (producción)"
echo ""

log "🔧 Iniciando sistema de producción..."

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