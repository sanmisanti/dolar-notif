#!/bin/bash

echo "🔍 VERIFICACIÓN DE PRODUCCIÓN"
echo "============================="
echo ""

# Verificar proceso corriendo
echo "📍 PROCESO:"
PROCESS=$(ps aux | grep "node src/index.js" | grep -v grep)
if [ -n "$PROCESS" ]; then
    echo "✅ Sistema corriendo:"
    echo "   $PROCESS"
    PID=$(echo "$PROCESS" | awk '{print $2}')
    echo "   PID: $PID"
else
    echo "❌ Sistema NO está corriendo"
    exit 1
fi

echo ""

# Verificar configuración actual
echo "⚙️  CONFIGURACIÓN:"
echo "   Horario actual: $(date '+%A %H:%M (Semana %U)')"
echo "   Zona horaria: $(date '+%Z %z')"

# Verificar si está en horario de producción
HOUR=$(date '+%H')
DAY=$(date '+%u')  # 1=Monday, 7=Sunday

if [ "$DAY" -le 5 ] && [ "$HOUR" -ge 11 ] && [ "$HOUR" -le 18 ]; then
    echo "✅ DENTRO del horario de producción (L-V 11:00-18:00)"
    # Calcular próxima ejecución
    MINUTES=$(date '+%M')
    NEXT_MIN=$(( ((MINUTES / 10) + 1) * 10 ))
    if [ $NEXT_MIN -ge 60 ]; then
        NEXT_MIN=0
        NEXT_HOUR=$(( HOUR + 1 ))
    else
        NEXT_HOUR=$HOUR
    fi
    printf "   Próxima ejecución: %02d:%02d\n" $NEXT_HOUR $NEXT_MIN
else
    echo "⏰ FUERA del horario de producción (L-V 11:00-18:00)"
    echo "   El sistema está en espera hasta el próximo día hábil"
fi

echo ""

# Verificar logs recientes
echo "📋 LOGS RECIENTES:"
if [ -f "logs/app.log" ]; then
    echo "   Últimas 5 líneas:"
    tail -5 logs/app.log | sed 's/^/   /'
else
    echo "   ❌ No se encontró logs/app.log"
fi

echo ""

# Verificar base de datos
echo "💾 BASE DE DATOS:"
if [ -f "data/dollar_history.db" ]; then
    echo "✅ Archivo de BD existe"
    # Crear script temporal para contar registros
    cat > temp_count.js << 'EOF'
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/dollar_history.db', sqlite3.OPEN_READONLY);
db.get("SELECT COUNT(*) as count FROM dollar_history", [], (err, row) => {
    if (err) {
        console.log("0");
    } else {
        console.log(row.count);
    }
    db.close();
});
EOF
    RECORDS=$(node temp_count.js 2>/dev/null || echo "0")
    rm temp_count.js 2>/dev/null
    echo "   Registros guardados: $RECORDS"

    if [ "$RECORDS" -gt 0 ]; then
        echo "✅ La BD tiene datos - sistema funcionando"
    else
        echo "⏳ BD vacía - esperando primera ejecución"
    fi
else
    echo "   ❌ No se encontró data/dollar_history.db"
fi

echo ""
echo "🎯 COMANDOS ÚTILES:"
echo "   Ver logs:       tail -f logs/app.log"
echo "   Detener:        kill $PID"
echo "   Verificar BD:   node check-db-simple.js"
echo "   Estado sistema: ./check-system.sh"