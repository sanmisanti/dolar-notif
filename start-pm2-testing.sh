#!/bin/bash

echo "🧪 INICIANDO DÓLAR NOTIF CON PM2 - MODO TESTING"
echo "=============================================="

# Crear directorio de logs si no existe
mkdir -p logs

# Función para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a logs/pm2-startup.log
}

log "🔧 Preparando inicio con PM2..."

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    log "📦 PM2 no encontrado, instalando..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        log "✅ PM2 instalado exitosamente"
    else
        log "❌ Error instalando PM2"
        exit 1
    fi
else
    log "✅ PM2 ya está instalado"
fi

# Detener cualquier instancia previa
log "🛑 Deteniendo instancias previas..."
pm2 delete dolar-notif-production 2>/dev/null || true
pm2 delete dolar-notif-testing 2>/dev/null || true

# Iniciar aplicación de testing con PM2
log "🚀 Iniciando aplicación de testing..."
pm2 start ecosystem.config.cjs --only dolar-notif-testing

# Verificar que se inició correctamente
sleep 3
if pm2 describe dolar-notif-testing | grep -q "online"; then
    log "✅ Aplicación iniciada exitosamente"

    echo ""
    echo "📊 CONFIGURACIÓN DE TESTING:"
    echo "  ⏰ Horario: 24/7, cualquier día"
    echo "  🔄 Intervalo: Cada 5 minutos"
    echo "  📧 Destinatario: Solo sanmisanti@gmail.com"
    echo "  📅 Reportes: Cada 5 minutos (testing)"
    echo "  🗃️ Base de datos: testing_history.db"
    echo ""

    log "📊 Estado del sistema:"
    pm2 status

    echo ""
    log "💡 COMANDOS ÚTILES:"
    log "   Ver logs:        pm2 logs dolar-notif-testing"
    log "   Ver estado:      pm2 status"
    log "   Reiniciar:       pm2 restart dolar-notif-testing"
    log "   Detener:         pm2 stop dolar-notif-testing"
    log "   Ver monitoreo:   pm2 monit"

else
    log "❌ Error iniciando la aplicación"
    pm2 logs dolar-notif-testing --lines 10
    exit 1
fi