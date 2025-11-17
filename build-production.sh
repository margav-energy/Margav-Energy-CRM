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
pip install --upgrade pip setuptools wheel
# Install numpy first (pandas dependency)
pip install numpy || true
# Install pandas with pre-built wheels only (faster and more reliable)
pip install --only-binary :all: pandas openpyxl || pip install pandas openpyxl
# Install remaining dependencies
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Production build complete!"