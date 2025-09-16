#!/bin/bash

# Colores para output visual
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    🚀 DÓLAR NOTIF - STATUS DASHBOARD            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. VERIFICAR PM2
echo -e "${CYAN}📊 ESTADO DE PM2:${NC}"
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist 2>/dev/null)
    if echo "$PM2_STATUS" | grep -q "dolar-notif-production"; then
        PM2_APP_STATUS=$(echo "$PM2_STATUS" | jq -r '.[] | select(.name=="dolar-notif-production") | .pm2_env.status' 2>/dev/null)
        PM2_APP_PID=$(echo "$PM2_STATUS" | jq -r '.[] | select(.name=="dolar-notif-production") | .pid' 2>/dev/null)
        PM2_APP_UPTIME=$(echo "$PM2_STATUS" | jq -r '.[] | select(.name=="dolar-notif-production") | .pm2_env.pm_uptime' 2>/dev/null)

        if [ "$PM2_APP_STATUS" = "online" ]; then
            UPTIME_READABLE=$(date -d "@$((PM2_APP_UPTIME/1000))" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "N/A")
            echo -e "   ✅ ${GREEN}ONLINE${NC} - PID: $PM2_APP_PID - Iniciado: $UPTIME_READABLE"
        else
            echo -e "   ❌ ${RED}OFFLINE${NC} - Estado: $PM2_APP_STATUS"
        fi
    else
        echo -e "   ⚠️  ${YELLOW}No encontrado - dolar-notif-production no está ejecutándose${NC}"
    fi
else
    echo -e "   ❌ ${RED}PM2 no está instalado${NC}"
fi

echo ""

# 2. VERIFICAR HORARIO Y ZONA
echo -e "${CYAN}⏰ CONFIGURACIÓN DE TIEMPO:${NC}"
CURRENT_UTC=$(date -u "+%Y-%m-%d %H:%M:%S UTC")
CURRENT_ARG=$(TZ='America/Argentina/Buenos_Aires' date "+%Y-%m-%d %H:%M:%S ART")
HOUR_UTC=$(date -u "+%H")
HOUR_ARG=$(TZ='America/Argentina/Buenos_Aires' date "+%H")
DAY_WEEK=$(date "+%u") # 1=Monday, 7=Sunday

echo -e "   🌍 Servidor (UTC): $CURRENT_UTC"
echo -e "   🇦🇷 Argentina:     $CURRENT_ARG"

if [ "$DAY_WEEK" -le 5 ] && [ "$HOUR_UTC" -ge 14 ] && [ "$HOUR_UTC" -le 21 ]; then
    echo -e "   ✅ ${GREEN}DENTRO del horario bancario (L-V 14:00-21:00 UTC / 11:00-18:00 ART)${NC}"
    # Calcular próxima ejecución
    MINUTES=$(date "+%M")
    NEXT_MIN=$(( ((MINUTES / 10) + 1) * 10 ))
    if [ $NEXT_MIN -ge 60 ]; then
        NEXT_MIN=0
        NEXT_HOUR=$(( $(date "+%H") + 1 ))
    else
        NEXT_HOUR=$(date "+%H")
    fi
    printf "   ⏭️  Próxima ejecución: %02d:%02d UTC (%02d:%02d ART)\n" $NEXT_HOUR $NEXT_MIN $(( (NEXT_HOUR - 3 + 24) % 24 )) $NEXT_MIN
else
    echo -e "   ⏸️  ${YELLOW}FUERA del horario bancario - Sistema en espera${NC}"
    echo -e "   📅 Próxima activación: Lunes a Viernes 14:00 UTC (11:00 ART)"
fi

echo ""

# 3. VERIFICAR BASE DE DATOS
echo -e "${CYAN}💾 BASE DE DATOS:${NC}"
if [ -f "data/dollar_history.db" ]; then
    echo -e "   ✅ ${GREEN}Archivo existe${NC}: data/dollar_history.db"

    # Contar registros usando sqlite3 si está disponible
    if command -v sqlite3 &> /dev/null; then
        RECORD_COUNT=$(sqlite3 data/dollar_history.db "SELECT COUNT(*) FROM dollar_history;" 2>/dev/null || echo "0")
        echo -e "   📊 Total de registros: ${GREEN}$RECORD_COUNT${NC}"

        if [ "$RECORD_COUNT" -gt 0 ]; then
            LAST_RECORD=$(sqlite3 data/dollar_history.db "SELECT datetime(timestamp, 'localtime'), compra, venta FROM dollar_history ORDER BY timestamp DESC LIMIT 1;" 2>/dev/null)
            if [ -n "$LAST_RECORD" ]; then
                echo -e "   📈 Último registro: ${GREEN}$LAST_RECORD${NC}"
            fi

            TODAY_COUNT=$(sqlite3 data/dollar_history.db "SELECT COUNT(*) FROM dollar_history WHERE DATE(timestamp, 'localtime') = DATE('now', 'localtime');" 2>/dev/null || echo "0")
            echo -e "   📅 Registros de hoy: ${GREEN}$TODAY_COUNT${NC}"
        else
            echo -e "   📭 ${YELLOW}Base de datos vacía (esperando primeros registros)${NC}"
        fi
    else
        # Usar Node.js como fallback
        node -e "
        import sqlite3 from 'sqlite3';
        const db = new sqlite3.Database('./data/dollar_history.db', sqlite3.OPEN_READONLY);
        db.get('SELECT COUNT(*) as count FROM dollar_history', [], (err, row) => {
            if (err) {
                console.log('   ⚠️  No se pudo leer la base de datos');
            } else {
                console.log(\`   📊 Total de registros: \${row.count}\`);
            }
            db.close();
        });
        " 2>/dev/null || echo -e "   ⚠️  ${YELLOW}No se pudo verificar registros${NC}"
    fi
else
    echo -e "   ❌ ${RED}No se encontró la base de datos${NC}"
fi

echo ""

# 4. VERIFICAR LOGS RECIENTES
echo -e "${CYAN}📋 LOGS RECIENTES:${NC}"
if [ -f "logs/pm2-out.log" ]; then
    echo -e "   📄 Últimas 3 líneas del log:"
    tail -3 logs/pm2-out.log 2>/dev/null | sed 's/^/   /'
else
    echo -e "   ⚠️  ${YELLOW}No se encontraron logs de PM2${NC}"
fi

echo ""

# 5. VERIFICAR CONECTIVIDAD DE RED
echo -e "${CYAN}🌐 CONECTIVIDAD:${NC}"
if ping -c 1 dolarapi.com &> /dev/null; then
    echo -e "   ✅ ${GREEN}API externa accesible (dolarapi.com)${NC}"
else
    echo -e "   ❌ ${RED}API externa no accesible${NC}"
fi

echo ""

# 6. RESUMEN EJECUTIVO
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                           📊 RESUMEN EJECUTIVO                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Verificar estado general
PM2_OK=false
TIME_OK=false
DB_OK=false

if command -v pm2 &> /dev/null && pm2 jlist 2>/dev/null | grep -q "dolar-notif-production"; then
    STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="dolar-notif-production") | .pm2_env.status' 2>/dev/null)
    [ "$STATUS" = "online" ] && PM2_OK=true
fi

[ "$DAY_WEEK" -le 5 ] && [ "$HOUR_UTC" -ge 14 ] && [ "$HOUR_UTC" -le 21 ] && TIME_OK=true

[ -f "data/dollar_history.db" ] && DB_OK=true

if [ "$PM2_OK" = true ] && [ "$DB_OK" = true ]; then
    if [ "$TIME_OK" = true ]; then
        echo -e "🎉 ${GREEN}SISTEMA FUNCIONANDO PERFECTAMENTE${NC}"
        echo -e "   ✅ PM2 online"
        echo -e "   ✅ Base de datos operativa"
        echo -e "   ✅ Dentro del horario bancario"
        echo -e "   🚀 El sistema está monitoreando activamente cada 10 minutos"
    else
        echo -e "⏸️  ${YELLOW}SISTEMA EN ESPERA (NORMAL)${NC}"
        echo -e "   ✅ PM2 online"
        echo -e "   ✅ Base de datos operativa"
        echo -e "   ⏸️  Fuera del horario bancario"
        echo -e "   💤 El sistema esperará hasta el próximo día hábil"
    fi
else
    echo -e "⚠️  ${RED}SISTEMA CON PROBLEMAS${NC}"
    [ "$PM2_OK" = false ] && echo -e "   ❌ PM2 no está ejecutándose"
    [ "$DB_OK" = false ] && echo -e "   ❌ Base de datos no encontrada"
fi

echo ""
echo -e "${PURPLE}💡 COMANDOS ÚTILES:${NC}"
echo -e "   ./pm2-commands.sh logs-prod   # Ver logs en tiempo real"
echo -e "   ./pm2-commands.sh status      # Estado de PM2"
echo -e "   ./pm2-commands.sh monit       # Monitor visual interactivo"
echo -e "   ./db-quick.sh today           # Ver registros de hoy"
echo -e "   ./db-quick.sh live            # Monitoreo de BD en vivo"
echo ""