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
cp -r ../frontend/build/static staticfiles/

# Run Django migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build completed successfully!"
