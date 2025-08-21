#!/bin/bash

echo "🚀 Inicializando Capacitor para Refugi..."

# Initialize Capacitor
npx cap init

echo "✅ Capacitor inicializado"

# Build the project
echo "📦 Construyendo el proyecto..."
npm run build

echo "✅ Proyecto construido"

echo "📱 Para continuar con desarrollo móvil:"
echo "1. Para Android:"
echo "   npx cap add android"
echo "   npx cap update android"
echo "   npx cap sync"
echo "   npx cap run android"
echo ""
echo "2. Para iOS (requiere Mac con Xcode):"
echo "   npx cap add ios"
echo "   npx cap update ios"
echo "   npx cap sync"
echo "   npx cap run ios"
echo ""
echo "🔄 Hot-reload ya está configurado desde el sandbox"
echo "📖 Lee el README.md para más detalles"