#!/bin/bash

echo "🚀 Starting Production Build..."

# Navigate to frontend directory
cd ../frontend

# Clean any existing build
echo "🧹 Cleaning existing build..."
rm -rf build

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🔨 Building React frontend..."
npm run build

# Navigate back to backend
cd ../backend

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create admin user if it doesn't exist
echo "👤 Creating admin user..."
python manage.py create_admin --username admin --email admin@margav.energy --password admin123

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Debug: List collected static files
echo "🔍 Checking collected static files..."
ls -la staticfiles/ || echo "No staticfiles directory found"
ls -la staticfiles/static/ || echo "No staticfiles/static directory found"

echo "✅ Production build complete!"
