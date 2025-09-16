#!/bin/bash

echo "🧪 INICIANDO DÓLAR NOTIF - MODO TESTING"
echo "======================================"

# El cron */5 se ejecutará en el próximo múltiplo de 5 minutos
next_execution_min=$(( (($(date +%M) / 5) + 1) * 5 ))
if [ $next_execution_min -ge 60 ]; then
    next_execution_min=0
    next_execution_hour=$(( $(date +%H) + 1 ))
else
    next_execution_hour=$(date +%H)
fi

echo "⏰ CONFIGURACIÓN DE TESTING:"
echo "  🕐 Inicio: Inmediato (próximo múltiplo de 5 minutos)"
echo "  🔄 Intervalo: Cada 5 minutos (*/5 * * * *)"
echo "  📧 Destinatario: Solo sanmisanti@gmail.com"
echo "  📅 Horario: Cualquier día, cualquier hora"
echo "  🗃️ Base de datos: testing_history.db (separada de producción)"
echo ""

# Configuración de testing (cada 5 minutos)
export TESTING_MODE=true
export SCHEDULE_CRON="*/5 * * * *"
export SCHEDULE_START_HOUR=0
export SCHEDULE_END_HOUR=23
export SCHEDULE_WEEKDAYS_ONLY=false
export SCHEDULE_INTERVAL_MINUTES=5
export SCHEDULE_TIMEZONE="America/Argentina/Buenos_Aires"
export SCHEDULE_REPORT_CRON="*/5 * * * *"  # Reporte cada 5 minutos para testing

# Configuración de notificaciones (solo email de testing)
export EMAIL_TO="sanmisanti@gmail.com"

# Base de datos separada para testing
export DB_PATH="./data/testing_history.db"

# Crear directorio de logs si no existe
mkdir -p logs

# Función para logging con timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a logs/testing.log
}

# Función cleanup
cleanup() {
    log "🛑 Señal de terminación recibida"
    log "🧹 Limpiando procesos..."
    kill $NODE_PID 2>/dev/null
    log "👋 Proceso de testing terminado limpiamente"
    exit 0
}

# Configurar traps para cleanup
trap cleanup SIGTERM SIGINT SIGQUIT

log "🔧 Iniciando sistema de testing..."
log "📍 Cron configurado: $SCHEDULE_CRON"

# Ejecutar en background y capturar PID (modo daemon para testing)
NODE_ENV=testing TESTING_MODE=true PM2_MODE=true node src/index.js >> logs/testing-app.log 2>&1 &
NODE_PID=$!

log "📍 Proceso iniciado con PID: $NODE_PID"
log "📂 Logs disponibles en:"
log "   - logs/testing.log (este script)"
log "   - logs/testing-app.log (aplicación)"

# Verificar que el proceso esté corriendo
sleep 3
if kill -0 $NODE_PID 2>/dev/null; then
    log "✅ Sistema de testing funcionando correctamente"
    log "💡 Para detener: kill $NODE_PID o Ctrl+C"
    log "💡 Para ver logs: tail -f logs/testing-app.log"
    log "⏱️  Primera ejecución programada para: $(printf "%02d:%02d" $next_execution_hour $next_execution_min)"
else
    log "❌ Error iniciando el sistema de testing"
    exit 1
fi

# Esperar al proceso hijo
wait $NODE_PID
log "🔄 Proceso principal de testing terminado"