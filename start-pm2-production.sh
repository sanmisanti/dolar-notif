#!/bin/bash

echo "🚀 INICIANDO DÓLAR NOTIF CON PM2 - MODO PRODUCCIÓN"
echo "================================================="

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

# Iniciar aplicación de producción con PM2
log "🚀 Iniciando aplicación de producción..."
pm2 start ecosystem.config.cjs --only dolar-notif-production

# Verificar que se inició correctamente
sleep 3
if pm2 describe dolar-notif-production | grep -q "online"; then
    log "✅ Aplicación iniciada exitosamente"

    echo ""
    echo "📊 CONFIGURACIÓN DE PRODUCCIÓN:"
    echo "  ⏰ Horario: Lunes a Viernes, 11:00-18:00 (hora argentina)"
    echo "  🌍 UTC: Lunes a Viernes, 14:00-21:00 (servidor AWS)"
    echo "  🔄 Intervalo: Cada 10 minutos"
    echo "  📧 Destinatarios: sanmisanti@gmail.com,ignavillanueva96@gmail.com"
    echo "  📅 Reportes: Cada 2 días a las 19:00 (22:00 UTC)"
    echo "  🗃️ Base de datos: dollar_history.db (producción)"
    echo ""

    log "📊 Estado del sistema:"
    pm2 status

    echo ""
    log "💡 COMANDOS ÚTILES:"
    log "   Ver logs:        pm2 logs dolar-notif-production"
    log "   Ver estado:      pm2 status"
    log "   Reiniciar:       pm2 restart dolar-notif-production"
    log "   Detener:         pm2 stop dolar-notif-production"
    log "   Ver monitoreo:   pm2 monit"
    log "   Guardar config:  pm2 save && pm2 startup"

else
    log "❌ Error iniciando la aplicación"
    pm2 logs dolar-notif-production --lines 10
    exit 1
fi