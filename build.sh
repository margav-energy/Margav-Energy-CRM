#!/bin/bash

# Build script for Render deployment
set -e

echo "🔨 Starting build process..."

# Build React frontend
echo "⚛️ Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

# Copy React build to Django templates
echo "📋 Copying React build to Django templates..."
mkdir -p templates
cp ../frontend/build/index.html templates/

# Copy favicon if it exists
if [ -f "../frontend/public/favicon.ico" ]; then
    echo "📋 Copying favicon to templates..."
    cp ../frontend/public/favicon.ico templates/
fi

# Verify React build files exist
echo "📋 Verifying React build files..."
if [ ! -d "../frontend/build/static" ]; then
    echo "❌ React static files not found! Make sure React build completed successfully."
    exit 1
fi

# Run Django migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files (this will include React build files)
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Copy favicon to staticfiles for serving
if [ -f "../frontend/build/favicon.ico" ]; then
    echo "📋 Copying favicon to staticfiles..."
    cp ../frontend/build/favicon.ico staticfiles/
fi

# Verify static files were collected
echo "📋 Verifying static files..."
ls -la staticfiles/ || echo "No static files found"
echo "📋 Verifying React static files..."
ls -la staticfiles/css/ || echo "No CSS files found"
ls -la staticfiles/js/ || echo "No JS files found"

echo "✅ Build completed successfully!"
