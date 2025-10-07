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
    echo "📋 Copying favicon..."
    cp ../frontend/public/favicon.ico templates/
fi

# Verify template file exists
echo "📋 Verifying template file..."
ls -la templates/index.html || echo "Template file not found!"

# Run Django migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files (this will include React build files)
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Verify static files were collected
echo "📋 Verifying static files..."
ls -la staticfiles/static/ || echo "No static files found"

echo "✅ Build completed successfully!"
