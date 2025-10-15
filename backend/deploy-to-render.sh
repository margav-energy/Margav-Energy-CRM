#!/bin/bash

# Deploy Margav Energy CRM Backend to Render
echo "🚀 Deploying Margav Energy CRM Backend to Render..."

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: manage.py not found. Please run this script from the backend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create superuser if needed (optional)
echo "👤 Creating superuser (optional)..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" | python manage.py shell

echo "✅ Backend deployment preparation complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Create a new Web Service on Render"
echo "3. Connect your GitHub repository"
echo "4. Set the build and start commands"
echo "5. Configure environment variables"
echo "6. Deploy!"
