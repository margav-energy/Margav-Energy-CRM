#!/bin/bash

# Production Build Script for Margav Energy CRM Frontend
echo "🚀 Building Margav Energy CRM Frontend for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building React application..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful! Build directory created."
    echo "📁 Build contents:"
    ls -la build/
    
    echo ""
    echo "🎯 Production build ready for deployment!"
    echo "📤 Upload the 'build' directory to your hosting service."
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi
