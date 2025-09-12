# 🚀 Guía Completa: Despliegue en EC2

## 📋 **PASOS COMPLETOS**

### **1️⃣ Preparar archivos localmente**

```bash
# En tu máquina local (donde está el proyecto)
cd /mnt/c/Users/sanmi/Documents/Proyectos/dolarnotif

# Crear archivo comprimido (excluye node_modules y logs)
tar -czf dolarnotif.tar.gz --exclude=node_modules --exclude=data --exclude=logs .
```

### **2️⃣ Subir a EC2**

**Opción A: Con SCP**
```bash
# Subir archivo comprimido
scp -i tu-clave.pem dolarnotif.tar.gz ec2-user@TU-IP-PUBLICA:/home/ec2-user/

# También subir script de setup
scp -i tu-clave.pem ec2-setup.sh ec2-user@TU-IP-PUBLICA:/home/ec2-user/
```

**Opción B: Con Git (si tienes repositorio)**
```bash
# Primero crear repo en GitHub/GitLab con tu código
# Luego en EC2:
git clone https://github.com/tu-usuario/dolarnotif.git
```

### **3️⃣ Conectar a EC2**

```bash
ssh -i tu-clave.pem ec2-user@TU-IP-PUBLICA
```

### **4️⃣ Configurar en EC2**

```bash
# Hacer ejecutable el script
chmod +x ec2-setup.sh

# Ejecutar configuración automática
./ec2-setup.sh
```

### **5️⃣ Configurar variables de entorno**

```bash
# Editar archivo de configuración
nano .env
```

**Contenido del .env:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
EMAIL_TO=email_destino@gmail.com

ALERT_DEVIATION_THRESHOLD=2.0
ALERT_MIN_SAMPLES=10
ALERT_TREND_CONSECUTIVE=3

LOG_LEVEL=info
DB_PATH=./data/dollar_history.db
```

### **6️⃣ Probar el sistema**

```bash
# Test completo
npm test
```

Deberías ver:
```
🎉 SISTEMA COMPLETAMENTE FUNCIONAL!
=====================================
✅ API: Funcionando
✅ Base de datos: Funcionando
✅ Análisis: Funcionando
✅ Notificaciones: Funcionando
```

### **7️⃣ Ejecutar en producción**

```bash
# Opción A: Con PM2 (recomendado para EC2)
npm run production-pm2

# Opción B: Modo simple
npm run production
```

### **8️⃣ Verificar funcionamiento**

```bash
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs dolar-notif

# Ver logs específicos
tail -f logs/app.log
```

### **9️⃣ Configurar auto-inicio (opcional)**

```bash
# Para que PM2 se inicie automáticamente tras reboot
pm2 startup
# Seguir las instrucciones que aparecen

# Guardar configuración actual
pm2 save
```

---

## 🔧 **CONFIGURACIÓN DE SEGURIDAD EC2**

### **Security Group Rules:**
- **SSH (22)**: Tu IP pública únicamente
- **HTTPS (443)**: 0.0.0.0/0 (para consultar APIs externas)
- **HTTP (80)**: 0.0.0.0/0 (para consultar APIs externas)

No necesitas abrir otros puertos ya que la app solo **consume** APIs, no expone servicios.

---

## 📊 **COMANDOS ÚTILES EN EC2**

### **Gestión del sistema:**
```bash
# Ver estado
pm2 status
pm2 monit

# Ver logs
pm2 logs dolar-notif --lines 50

# Reiniciar
pm2 restart dolar-notif

# Parar
pm2 stop dolar-notif

# Ver información detallada
pm2 show dolar-notif
```

### **Monitoreo del sistema:**
```bash
# Ver procesos
ps aux | grep node

# Ver uso de recursos
top
htop

# Ver logs del sistema
tail -f /var/log/messages
journalctl -f
```

### **Actualizaciones:**
```bash
# Hacer backup de .env
cp .env .env.backup

# Actualizar código
git pull  # o subir nuevos archivos

# Reinstalar dependencias si cambió package.json
npm install

# Reiniciar
pm2 restart dolar-notif
```

---

## 🚨 **TROUBLESHOOTING**

### **Error: "Cannot find module"**
```bash
npm install
```

### **Error: "Permission denied"**
```bash
# Dar permisos a directorios
chmod -R 755 data logs
```

### **Error: "ENOTFOUND dolarapi.com"**
```bash
# Verificar conectividad
curl https://dolarapi.com/v1/dolares/oficial
ping 8.8.8.8
```

### **Error de email: "Authentication failed"**
```bash
# Verificar configuración en .env
cat .env | grep EMAIL
```

### **Proceso no inicia:**
```bash
# Ver logs de error
pm2 logs dolar-notif --err

# Verificar manualmente
node src/index.js
```

---

## 🎯 **VERIFICACIÓN FINAL**

Una vez todo configurado, deberías poder:

1. **Ver estado activo:**
   ```bash
   pm2 status
   # Status: online
   ```

2. **Ver logs corriendo:**
   ```bash
   pm2 logs dolar-notif
   # Muestra actividad del sistema
   ```

3. **Recibir email de prueba:**
   ```bash
   node -e "
   import('./src/monitor.js').then(async ({MonitorService}) => {
     const m = new MonitorService();
     await m.initialize();
     await m.testNotifications();
     await m.cleanup();
   });
   "
   ```

4. **Sistema programado:**
   - Próxima ejecución visible en logs
   - Timezone correcto (Argentina)

---

## 📱 **MONITOREO REMOTO**

### **Opcional: Instalar monitoring**
```bash
# Para monitorear recursos del servidor
sudo yum install htop  # Amazon Linux 2
sudo apt install htop  # Ubuntu

# Para alertas del servidor (opcional)
pm2 install pm2-server-monit
```

**¡Tu sistema estará corriendo 24/7 en la nube de AWS!** 🚀☁️

El próximo email que recibas será automáticamente desde tu EC2 cuando detecte una oportunidad de compra o cuando llegue la hora del reporte bidiario.