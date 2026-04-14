#!/bin/bash

echo "🌊 WAX - Configurando el Frontend..."

# 1. Comprobar si node_modules existe, si no, instalar
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias por primera vez..."
  npm install
else
  echo "✅ Dependencias ya instaladas."
fi

# 2. Forzar el uso del CLI moderno de Ionic para evitar errores de versión
echo " Levantando servidor de desarrollo..."
npx @ionic/cli serve --external