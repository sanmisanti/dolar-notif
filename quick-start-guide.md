# 🚀 GUÍA RÁPIDA - DÓLAR NOTIF EN PRODUCCIÓN

## 📋 PASOS PARA INICIAR PRODUCCIÓN

### 1. 🚀 Iniciar el sistema
```bash
./start-pm2-production.sh
```
**Resultado esperado:** PM2 instala/ejecuta la aplicación en background

### 2. ✅ Verificar que funciona
```bash
./check-production-status.sh
```
**Debe mostrar:**
- ✅ PM2 ONLINE
- ✅ Dentro/fuera horario bancario
- ✅ Base de datos operativa

### 3. 📊 Monitoreo continuo (opcional)
```bash
./watch-system.sh
```
**Se actualiza cada 30 segundos automáticamente**

---

## 🔧 COMANDOS DE GESTIÓN

### Estado y Logs
```bash
./pm2-commands.sh status      # Estado de PM2
./pm2-commands.sh logs-prod   # Ver logs en tiempo real
./pm2-commands.sh monit       # Monitor visual interactivo PM2
```

### Base de Datos
```bash
./db-quick.sh today          # Ver registros de hoy
./db-quick.sh count          # Estadísticas
./db-quick.sh live           # Monitoreo BD en vivo
```

### Control del Sistema
```bash
./pm2-commands.sh restart-prod  # Reiniciar
./pm2-commands.sh stop-prod     # Detener
./pm2-commands.sh save          # Guardar config (reinicio automático)
```

---

## ⏰ COMPORTAMIENTO DEL SISTEMA

### 🕐 Horarios de Ejecución
- **Producción:** L-V 11:00-18:00 hora argentina (14:00-21:00 UTC)
- **Frecuencia:** Cada 10 minutos
- **Reportes:** Cada 2 días a las 19:00 ART (22:00 UTC)

### 📧 Notificaciones
- **Destinatarios:** sanmisanti@gmail.com, ignavillanueva96@gmail.com
- **Alertas automáticas** si el precio tiene variaciones significativas

### 💾 Base de Datos
- **Archivo:** `data/dollar_history.db`
- **Consultas:** Usar `sqlite3` o scripts incluidos

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### ❌ PM2 no inicia
```bash
npm install -g pm2           # Reinstalar PM2
./start-pm2-production.sh    # Intentar de nuevo
```

### 📭 Sin registros en BD
- Verificar si está en horario bancario
- Ver logs: `./pm2-commands.sh logs-prod`
- Verificar conectividad API

### 🔄 Reinicio después de problemas
```bash
./pm2-commands.sh stop-all   # Detener todo
./start-pm2-production.sh    # Reiniciar
./check-production-status.sh # Verificar
```

---

## 💡 MEJORES PRÁCTICAS

### ✅ Verificación diaria recomendada
```bash
./check-production-status.sh
```

### 💾 Backup automático (configurar una vez)
```bash
./pm2-commands.sh save       # Habilita reinicio automático del servidor
```

### 📊 Monitoreo visual
```bash
./pm2-commands.sh monit      # Dashboard interactivo
```

---

## 📞 ESTADO SALUDABLE

**El sistema funciona correctamente cuando ves:**

✅ **PM2:** ONLINE
✅ **Horario:** Dentro del bancario (L-V 14:00-21:00 UTC)
✅ **BD:** Registros acumulándose cada 10 minutos
✅ **Logs:** "Iniciando monitoreo" cada 10 min
✅ **Emails:** Llegando a ambos destinatarios

**🎯 ¡Cuando veas todo verde, el sistema está perfecto!**