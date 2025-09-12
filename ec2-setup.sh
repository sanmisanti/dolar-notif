#!/bin/bash

echo "🚀 CONFIGURANDO DÓLAR NOTIF EN EC2"
echo "================================="

# 1. Extraer archivos si usaste tar.gz
if [ -f "dolarnotif.tar.gz" ]; then
    echo "📦 Extrayendo archivos..."
    mkdir -p dolarnotif
    tar -xzf dolarnotif.tar.gz -C dolarnotif
    cd dolarnotif
fi

# 2. Instalar dependencias
echo "📚 Instalando dependencias..."
npm install

# 3. Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p data logs

# 4. Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado desde .env.example"
        echo "⚠️  IMPORTANTE: Edita .env con tus credenciales de email"
    else
        echo "❌ No se encontró .env.example"
    fi
fi

# 5. Configurar timezone
echo "🌍 Configurando timezone de Argentina..."
sudo timedatectl set-timezone America/Argentina/Buenos_Aires

# 6. Instalar PM2 globalmente
echo "🔧 Instalando PM2..."
sudo npm install -g pm2

# 7. Test de conectividad
echo "🧪 Probando conectividad..."
node -e "
import fetch from 'node:fetch';
fetch('https://dolarapi.com/v1/dolares/oficial')
  .then(r => r.json())
  .then(d => console.log('✅ API funciona:', d.compra))
  .catch(e => console.log('❌ Error API:', e.message));
" 2>/dev/null || echo "⚠️  Prueba de API pendiente (requiere configuración)"

echo ""
echo "🎯 PASOS SIGUIENTES:"
echo "1. Editar .env con tus credenciales:"
echo "   nano .env"
echo ""
echo "2. Probar sistema:"
echo "   npm test"
echo ""
echo "3. Ejecutar en producción:"
echo "   npm run production-pm2"
echo ""
echo "4. Verificar estado:"
echo "   pm2 status"
echo "   pm2 logs dolar-notif"
echo ""