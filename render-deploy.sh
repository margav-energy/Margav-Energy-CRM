#!/bin/bash

# 🚀 Render Deployment Script for Margav Energy CRM
# This script helps you deploy to Render

echo "🚀 Starting Render deployment process..."

# Check if we're in the right directory
if [ ! -f "backend/manage.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure looks good"

# Create .env file for production
echo "📝 Creating production environment file..."
cat > backend/.env << EOF
SECRET_KEY=your-super-secret-key-here-$(openssl rand -hex 32)
DEBUG=False
ALLOWED_HOSTS=your-backend-url.onrender.com
DIALER_API_KEY=margav-dialer-2024-secure-key-12345
EOF

echo "✅ Environment file created"

# Create frontend .env file
echo "📝 Creating frontend environment file..."
cat > frontend/.env.production << EOF
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
GENERATE_SOURCEMAP=false
EOF

echo "✅ Frontend environment file created"

echo ""
echo "🎯 Next steps for Render deployment:"
echo ""
echo "1. 📊 Create PostgreSQL Database on Render:"
echo "   - Go to render.com dashboard"
echo "   - Click 'New +' → 'PostgreSQL'"
echo "   - Name it: margav-crm-db"
echo "   - Choose Free tier"
echo "   - Copy the DATABASE_URL"
echo ""
echo "2. 🖥️ Deploy Backend (Django API):"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect your GitHub repository"
echo "   - Configure:"
echo "     • Name: margav-crm-backend"
echo "     • Environment: Python 3"
echo "     • Build Command: cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput"
echo "     • Start Command: cd backend && python manage.py migrate && gunicorn crm_backend.wsgi:application"
echo "   - Environment Variables:"
echo "     • SECRET_KEY: your-super-secret-key"
echo "     • DEBUG: False"
echo "     • ALLOWED_HOSTS: your-backend-url.onrender.com"
echo "     • DATABASE_URL: [from PostgreSQL service]"
echo "     • DIALER_API_KEY: margav-dialer-2024-secure-key-12345"
echo ""
echo "3. 🌐 Deploy Frontend (React App):"
echo "   - Click 'New +' → 'Static Site'"
echo "   - Connect your GitHub repository"
echo "   - Configure:"
echo "     • Name: margav-crm-frontend"
echo "     • Build Command: cd frontend && npm install && npm run build"
echo "     • Publish Directory: frontend/build"
echo "   - Environment Variables:"
echo "     • REACT_APP_API_URL: https://your-backend-url.onrender.com/api"
echo ""
echo "4. 🔧 Update CORS Settings:"
echo "   - After both services are deployed, update backend environment:"
echo "     • CORS_ALLOWED_ORIGINS: https://your-frontend-url.onrender.com"
echo ""
echo "5. 🧪 Test the deployment:"
echo "   - Frontend: https://your-frontend-url.onrender.com"
echo "   - Backend API: https://your-backend-url.onrender.com/api"
echo ""
echo "📋 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "✅ Setup complete! Follow the steps above to deploy to Render."
