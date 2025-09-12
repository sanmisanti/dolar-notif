# 🚀 Instrucciones de Configuración

## ⚠️ **ANTES DE USAR**

Este proyecto contiene información sensible que debes configurar:

### **1️⃣ Configurar Variables de Entorno**

```bash
# Copiar template de configuración
cp .env.example .env

# Editar con tus datos reales
nano .env
```

**Configurar estos valores en `.env`:**
- `EMAIL_USER`: Tu email de Gmail
- `EMAIL_PASS`: App Password de Gmail (no tu contraseña normal)
- `EMAIL_TO`: Email(s) donde recibir las alertas (separados por coma)

### **2️⃣ Configurar Script de Verificación (opcional)**

```bash
# Copiar template
cp check-system.template.sh check-system.sh

# Editar con tu información de EC2
nano check-system.sh
```

**Configurar:**
- `IP_EC2`: La IP pública de tu instancia EC2
- `PEM_KEY_PATH`: Ruta a tu archivo .pem

### **3️⃣ Gmail App Password**

1. Ve a [Google Account Security](https://myaccount.google.com/security)
2. Activa "2-Step Verification"
3. Ve a "App passwords" 
4. Genera password para "Mail"
5. Usa esa password en `EMAIL_PASS`

### **4️⃣ Ejecutar**

```bash
# Instalar dependencias
npm install

# Probar sistema
npm test

# Ejecutar en desarrollo
npm start

# O en producción con PM2
npm run production-pm2
```

## 🔒 **Seguridad**

- ✅ `.env` está en `.gitignore` (no se subirá al repo)
- ✅ Archivos con datos sensibles están excluidos
- ✅ Solo templates y ejemplos se incluyen en el repo

## 📧 **Tipos de Email**

1. **Alertas de Oportunidad**: Cuando detecta buen momento para comprar
2. **Reportes Bidiarios**: Resumen cada 2 días con estadísticas

## ⏰ **Funcionamiento**

- **Horario**: Lunes a Viernes, 11:00-18:00
- **Frecuencia**: Cada 30 minutos
- **Reportes**: Cada 2 días a las 19:00
- **Objetivo**: Comprar USD $100 antes del 6 de octubre de 2025