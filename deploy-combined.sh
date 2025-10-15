#!/bin/bash

# Combined Service Deployment Script for Render
# This script builds both frontend and backend in a single service

echo "🚀 Starting Combined Service Deployment..."

# Build Frontend
echo "📦 Building React Frontend..."
cd ../frontend
npm install
npm run build
cd ../backend

# Build Backend
echo "🐍 Setting up Python Backend..."
pip install -r requirements.txt

# Collect static files (includes React build)
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

echo "✅ Combined service deployment complete!"
echo "🎯 Your app will be available at your Render URL"
