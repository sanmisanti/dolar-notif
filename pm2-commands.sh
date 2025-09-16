#!/bin/bash

# Script con comandos útiles de PM2 para el sistema dolar-notif

case "$1" in
    "start-prod")
        echo "🚀 Iniciando producción con PM2..."
        ./start-pm2-production.sh
        ;;
    "start-test")
        echo "🧪 Iniciando testing con PM2..."
        ./start-pm2-testing.sh
        ;;
    "status")
        echo "📊 Estado de aplicaciones PM2:"
        pm2 status
        ;;
    "logs")
        APP=${2:-dolar-notif-production}
        echo "📋 Logs de $APP:"
        pm2 logs $APP
        ;;
    "logs-prod")
        echo "📋 Logs de producción:"
        pm2 logs dolar-notif-production
        ;;
    "logs-test")
        echo "📋 Logs de testing:"
        pm2 logs dolar-notif-testing
        ;;
    "restart-prod")
        echo "🔄 Reiniciando producción..."
        pm2 restart dolar-notif-production
        ;;
    "restart-test")
        echo "🔄 Reiniciando testing..."
        pm2 restart dolar-notif-testing
        ;;
    "stop-prod")
        echo "🛑 Deteniendo producción..."
        pm2 stop dolar-notif-production
        ;;
    "stop-test")
        echo "🛑 Deteniendo testing..."
        pm2 stop dolar-notif-testing
        ;;
    "stop-all")
        echo "🛑 Deteniendo todas las aplicaciones..."
        pm2 stop all
        ;;
    "delete-all")
        echo "🗑️ Eliminando todas las aplicaciones PM2..."
        pm2 delete all
        ;;
    "monit")
        echo "📊 Abriendo monitor PM2..."
        pm2 monit
        ;;
    "save")
        echo "💾 Guardando configuración PM2..."
        pm2 save
        echo "🔄 Configurando inicio automático..."
        pm2 startup
        ;;
    "install")
        echo "📦 Instalando PM2..."
        npm install -g pm2
        ;;
    *)
        echo "🔧 COMANDOS PM2 PARA DÓLAR NOTIF"
        echo "================================"
        echo ""
        echo "Inicio:"
        echo "  $0 start-prod    - Iniciar modo producción"
        echo "  $0 start-test    - Iniciar modo testing"
        echo ""
        echo "Monitoreo:"
        echo "  $0 status        - Ver estado de aplicaciones"
        echo "  $0 logs-prod     - Ver logs de producción"
        echo "  $0 logs-test     - Ver logs de testing"
        echo "  $0 monit         - Monitor interactivo PM2"
        echo ""
        echo "Control:"
        echo "  $0 restart-prod  - Reiniciar producción"
        echo "  $0 stop-prod     - Detener producción"
        echo "  $0 stop-all      - Detener todo"
        echo ""
        echo "Configuración:"
        echo "  $0 save          - Guardar config y habilitar inicio automático"
        echo "  $0 install       - Instalar PM2"
        echo ""
        echo "Ejemplos:"
        echo "  $0 start-prod    # Iniciar producción"
        echo "  $0 logs-prod     # Ver logs en tiempo real"
        echo "  $0 status        # Ver estado general"
        ;;
esac