# 🚀 GUÍA COMPLETA DE PRODUCCIÓN

## ✅ **OPCIÓN 1: Método Simple (RECOMENDADO)**

### **Ejecutar en Producción**
```bash
# Ir al directorio del proyecto
cd /mnt/c/Users/sanmi/Documents/Proyectos/dolarnotif

# Ejecutar en modo producción
npm run production
```

### **Lo que hace:**
- ✅ Ejecuta el sistema en background con logs
- ✅ Manejo automático de señales (Ctrl+C para parar)
- ✅ Logs con timestamps en `logs/production.log` y `logs/app.log`
- ✅ Auto-verificación de que el proceso esté corriendo

### **Comandos útiles:**
```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Ver logs de producción
tail -f logs/production.log

# Verificar si está corriendo
ps aux | grep "node src/index.js"

# Parar el proceso (si tienes el PID)
kill <PID>
```

---

## 🏆 **OPCIÓN 2: Con PM2 (Más avanzado)**

### **Instalar PM2**
```bash
npm install -g pm2
```

### **Ejecutar**
```bash
npm run production-pm2
```

### **Comandos de gestión PM2**
```bash
npm run status-pm2      # Ver estado
npm run logs-pm2        # Ver logs
npm run restart-pm2     # Reiniciar
npm run stop-pm2        # Parar
npm run monit-pm2       # Monitor visual
```

### **Auto-arranque en reboot (opcional)**
```bash
pm2 startup
pm2 save
```

---

## 🖥️ **OPCIÓN 3: Systemd Service (Linux)**

### **Crear servicio**
```bash
sudo nano /etc/systemd/system/dolar-notif.service
```

```ini
[Unit]
Description=Dolar Notif Monitor
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/path/to/dolarnotif
Environment=NODE_ENV=production
Environment=PM2_MODE=true
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### **Activar servicio**
```bash
sudo systemctl enable dolar-notif
sudo systemctl start dolar-notif
sudo systemctl status dolar-notif
```

---

## 📊 **VERIFICAR QUE FUNCIONA**

### **1. Verificar proceso corriendo**
```bash
ps aux | grep "dolar"
```

### **2. Verificar logs**
```bash
tail -20 logs/app.log
```

Deberías ver:
```
🇦🇷 DÓLAR NOTIF - Monitor de Cotización Oficial
📅 Scheduler iniciado
⏰ Monitoreo: Lunes a Viernes, 11:00-18:00, cada 30 minutos
📧 Reportes: Cada 2 días a las 19:00
🚀 Modo daemon activado (PM2). Sistema funcionando en background.
```

### **3. Test completo**
```bash
node test-system.js
```

Debe mostrar: `🎉 SISTEMA COMPLETAMENTE FUNCIONAL!`

---

## 🔄 **FUNCIONAMIENTO AUTOMÁTICO**

### **Lo que hace el sistema una vez corriendo:**

#### **Lunes a Viernes, 11:00-18:00:**
- Consulta dolarapi.com cada 30 minutos
- Analiza precio vs estadísticas históricas
- Envía email de alerta si detecta oportunidad

#### **Cada 2 días a las 19:00:**
- Genera reporte completo con:
  - Precios de apertura/cierre de hoy y ayer
  - Media histórica semanal/mensual
  - Precio más bajo registrado
  - Días restantes hasta 6/Oct/2025

#### **En tiempo real:**
- Si precio < media - 2σ → 🚨 Email inmediato
- Si ≤7 días restantes + precio bajo → ⚠️ Email crítico
- Si tendencia bajista sostenida → ⚡ Email moderado

---

## 🎯 **RECOMENDACIÓN FINAL**

### **Para empezar YA:**
```bash
cd /mnt/c/Users/sanmi/Documents/Proyectos/dolarnotif
npm run production
```

### **Para servidores Linux (VPS):**
```bash
# Opción PM2
npm install -g pm2
npm run production-pm2
pm2 save
pm2 startup

# O Systemd service (más robusto)
# Seguir pasos de systemd arriba
```

### **Para Windows/WSL:**
```bash
# Simple
npm run production

# O dejar corriendo en terminal
npm start
```

---

## 📧 **EMAILS QUE RECIBIRÁS**

### **Alertas (Cuando conviene comprar):**
- **Subject**: `🚨 ¡Oportunidad Dólar! $1375 (-2.1 desv.)`
- **Frecuencia**: Solo cuando detecta oportunidades reales
- **Acción**: "COMPRAR INMEDIATAMENTE" o "COMPRAR PRONTO"

### **Reportes (Control manual):**
- **Subject**: `📊 Reporte Dólar - 12/09/2025`
- **Frecuencia**: Cada 2 días a las 19:00
- **Contiene**: Resumen completo para tu análisis personal

**¡El sistema funciona 24/7 completamente autónomo!** 🚀