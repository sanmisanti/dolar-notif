#!/bin/bash

# TEMPLATE: Copia este archivo como check-system.sh y configura tu IP y clave
# cp check-system.template.sh check-system.sh
# nano check-system.sh (editar IP_EC2 y PEM_KEY_PATH)

# CONFIGURACIÓN - EDITAR ESTOS VALORES
IP_EC2="TU_IP_DE_EC2"
PEM_KEY_PATH="~/ruta/a/tu/archivo.pem"

echo "🔍 VERIFICACIÓN RÁPIDA DEL SISTEMA DÓLAR NOTIF"
echo "=============================================="

# Conectar y ejecutar verificaciones
ssh -i $PEM_KEY_PATH ubuntu@$IP_EC2 "
cd dolarnotif

echo '📊 ESTADO DEL PROCESO:'
pm2 status

echo ''
echo '📈 ACTIVIDAD RECIENTE:'
pm2 logs dolar-notif --lines 5 --nostream

echo ''
echo '🗄️ DATOS DE HOY:'
sqlite3 data/dollar_history.db \"
SELECT 
  'Consultas hoy: ' || COUNT(*) || ' | Último precio: $' || MAX(compra) || ' | Hora: ' || strftime('%H:%M', MAX(timestamp), 'localtime') as resumen
FROM dollar_history 
WHERE DATE(timestamp) = DATE('now', 'localtime');
\"

echo ''
echo '⏰ PRÓXIMA EJECUCIÓN:'
# Calcular próxima ejecución basada en horario
current_hour=\$(date +%H)
current_day=\$(date +%u)

if [ \$current_day -le 5 ] && [ \$current_hour -ge 11 ] && [ \$current_hour -lt 18 ]; then
    # Estamos en horario bancario
    next_minute=\$(( ((\$(date +%M) / 30 + 1) * 30) % 60 ))
    if [ \$next_minute -eq 0 ]; then
        next_hour=\$((\$current_hour + 1))
        if [ \$next_hour -gt 18 ]; then
            echo '📅 Próxima: Mañana 11:00'
        else
            echo \"⏰ Próxima: \${next_hour}:00 (hoy)\"
        fi
    else
        echo \"⏰ Próxima: \${current_hour}:\${next_minute} (hoy)\"
    fi
else
    echo '📅 Próxima: Próximo día hábil 11:00'
fi

echo ''
echo '✅ Verificación completada - Sistema funcionando'
"