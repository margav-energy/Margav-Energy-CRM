@echo off
echo 🚀 Building Margav Energy CRM Frontend for Production...

echo 📦 Installing dependencies...
npm install

echo 🔨 Building React application...
npm run build

if exist "build" (
    echo ✅ Build successful! Build directory created.
    echo 📁 Build contents:
    dir build
    
    echo.
    echo 🎯 Production build ready for deployment!
    echo 📤 Upload the 'build' directory to your hosting service.
) else (
    echo ❌ Build failed! Please check the error messages above.
    exit /b 1
)
