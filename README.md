# 🇦🇷 Dólar Notif - Monitor de Cotización Oficial

Sistema inteligente de monitoreo del dólar oficial argentino con alertas automáticas basadas en análisis estadístico y contexto político-económico.

## 🎯 Objetivo

Ayudarte a comprar **USD $100** al mejor precio posible entre el **11 de septiembre y el 6 de octubre de 2025**, mediante:

- ✅ Monitoreo automático cada 30 minutos en horario bancario (L-V 11:00-18:00)
- ✅ Análisis estadístico con alertas inteligentes
- ✅ Notificaciones por email cuando conviene comprar
- ✅ Dashboard interactivo para seguimiento

## 🚀 Instalación Rápida

```bash
# Clonar el proyecto
git clone <repo-url>
cd dolarnotif

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos de email

# Ejecutar
npm start
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Email para notificaciones
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_TO=destino@gmail.com

# Configuración de alertas
ALERT_DEVIATION_THRESHOLD=2.0
ALERT_MIN_SAMPLES=10
ALERT_TREND_CONSECUTIVE=3
```

### Gmail App Password

1. Activar autenticación en 2 pasos en tu cuenta Gmail
2. Generar una "Contraseña de aplicación" específica
3. Usar esa contraseña en `EMAIL_PASS`

## 🧠 Algoritmos de Alerta

### 1. **Oportunidad Estadística** (Crítica)
- **Trigger**: Precio < Media - 2 desviaciones estándar
- **Acción**: "COMPRAR INMEDIATAMENTE"
- **Ejemplo**: Si media = $1400 y desv = $20, alerta si precio < $1360

### 2. **Tendencia Bajista** (Media)
- **Trigger**: 3+ caídas consecutivas
- **Acción**: "COMPRAR PRONTO"
- **Contexto**: Detecta momentum descendente

### 3. **Proximidad de Fecha Límite** (Alta)
- **Trigger**: Quedan ≤7 días + precio ≤ percentil 25
- **Acción**: "COMPRAR INMEDIATAMENTE"
- **Contexto**: Urgencia por fecha límite (6/Oct/2025)

### 4. **Alta Volatilidad** (Baja)
- **Trigger**: Volatilidad > 3% + precio alejado de media
- **Acción**: "MONITOREAR DE CERCA"
- **Contexto**: Oportunidades en mercados volátiles

## 📊 Comandos del Dashboard

```
💰 dolar> help

📖 COMANDOS DISPONIBLES:
status     - Mostrar estado actual
history    - Mostrar histórico (7 días)
analysis   - Ejecutar análisis actual
today      - Resumen del día
test       - Verificar notificaciones
monitor    - Ejecutar monitoreo manual
schedule   - Estado del programador
urgent     - Verificación urgente (2 min)
help       - Mostrar ayuda
exit       - Salir del programa
```

## 📈 Ejemplo de Uso

```bash
npm start
```

```
🇦🇷 DÓLAR NOTIF - Monitor de Cotización Oficial
================================================

🔧 Inicializando servicios...
✅ Base de datos inicializada
✅ Sistema de notificaciones inicializado
✅ Conexión con API verificada
🚀 MonitorService inicializado correctamente

📅 Scheduler iniciado
⏰ Horario: Lunes a Viernes, 11:00-18:00, cada 30 minutos
🌍 Zona horaria: America/Argentina/Buenos_Aires
📍 Próxima ejecución: 11/09/2025 14:30:00

============================================================
📊 DASHBOARD - MONITOR DÓLAR OFICIAL
============================================================
💰 Precio Actual: $1395
🕐 Última Actualización: 11/09/2025 14:03:25
📅 Consultas Hoy: 8

📈 ESTADÍSTICAS SEMANALES:
   Media: $1398.45
   Mín/Máx: $1385.00 / $1410.00
   Muestras: 42

🎯 OBJETIVO DE COMPRA:
   Monto: USD $100
   Fecha límite: 6 de octubre de 2025
   Días restantes: 25
============================================================

✨ Modo interactivo activado. Escribe "help" para ver comandos disponibles.

💰 dolar> analysis

🧠 ANÁLISIS ACTUAL
==================================================
💰 Precio Analizado: $1395
🎯 Recomendación: 🔵 SEGUIR MONITOREANDO
📊 Confianza: 65%

📈 ESTADÍSTICAS:
   Media: $1398.45
   Mediana: $1397.00
   Desv. Std: 8.23
   Z-Score: -0.42

✅ Sin alertas activas
```

## 📧 Ejemplo de Notificación

Recibirás emails como este cuando se detecte una oportunidad:

**Subject**: ⚠️ ¡Oportunidad Dólar! $1375 (-2.1 desv.)

- **Precio actual**: $1375 (compra)
- **Media histórica**: $1398.45
- **Desviación**: -2.1 (significativa)
- **Recomendación**: 🔴 **COMPRAR INMEDIATAMENTE**
- **Confianza**: 87%

## 🏗️ Arquitectura

```
src/
├── index.js        # Aplicación principal + interfaz
├── monitor.js      # Servicio principal de monitoreo
├── scheduler.js    # Programador con horarios bancarios
├── api.js          # Cliente para dolarapi.com
├── database.js     # Almacenamiento SQLite
├── analytics.js    # Algoritmos de análisis
├── notifications.js # Sistema de emails
├── dashboard.js    # Interfaz de usuario
└── config.js       # Configuración centralizada
```

## 🛠️ Desarrollo

```bash
# Modo desarrollo con recarga automática
npm run dev

# Verificar base de datos
sqlite3 data/dollar_history.db ".tables"

# Ver logs en tiempo real
tail -f logs/dolar-notif.log
```

## 📅 Contexto Político Actual (Sep 2025)

- **Situación**: Alta volatilidad post-electoral
- **Precio actual**: ~$1,395 (cerca del techo de banda)
- **Riesgo país**: >1,000 puntos
- **Factor crítico**: Elecciones de octubre generan incertidumbre

### Estrategia Recomendada:
1. **Inmediata**: Si precio < $1,370 (percentil 10)
2. **Corto plazo**: Aprovechar volatilidad pre-electoral
3. **Límite**: Comprar obligatoriamente antes del 1/Oct (buffer de seguridad)

## ⚠️ Advertencias

- Las recomendaciones son **orientativas**, no consejos de inversión
- Considera factores adicionales (comisiones, disponibilidad, etc.)
- El contexto político puede cambiar rápidamente
- Mantén siempre un plan de contingencia

## 🤝 Soporte

Si tienes problemas:

1. Verifica la configuración de email
2. Chequea la conexión a internet
3. Revisa los logs de error
4. Usa `npm run test` para diagnósticos

---

**🎯 Objetivo**: Maximizar tu poder adquisitivo comprando USD $100 al mejor momento posible antes del 6 de octubre de 2025.

**💡 Tip**: Deja la aplicación corriendo 24/7 en tu servidor para no perderte ninguna oportunidad.