#!/bin/bash

# 🚀 Production Build Script for Margav Energy CRM
# This script builds the frontend for production deployment

echo "🔨 Building Margav Energy CRM for production..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create production environment file
echo "⚙️ Creating production environment..."
cat > .env.production << EOF
REACT_APP_API_URL=https://your-backend-url.com/api
GENERATE_SOURCEMAP=false
EOF

# Build the application
echo "🏗️ Building React application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build files are in: frontend/build/"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Deploy the 'frontend/build' folder to your hosting platform"
    echo "2. Update REACT_APP_API_URL in .env.production with your backend URL"
    echo "3. Ensure your backend is deployed and accessible"
    echo ""
    echo "📋 For full-stack deployment, see DEPLOYMENT_GUIDE.md"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
