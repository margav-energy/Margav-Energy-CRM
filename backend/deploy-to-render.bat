@echo off
echo 🚀 Deploying Margav Energy CRM Backend to Render...

if not exist "manage.py" (
    echo ❌ Error: manage.py not found. Please run this script from the backend directory.
    exit /b 1
)

echo 📦 Installing dependencies...
pip install -r requirements.txt

echo 📁 Collecting static files...
python manage.py collectstatic --noinput

echo 🗄️ Running database migrations...
python manage.py migrate

echo 👤 Creating superuser (optional)...
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123') | python manage.py shell

echo ✅ Backend deployment preparation complete!
echo.
echo 🔧 Next steps:
echo 1. Push your code to GitHub
echo 2. Create a new Web Service on Render
echo 3. Connect your GitHub repository
echo 4. Set the build and start commands
echo 5. Configure environment variables
echo 6. Deploy!
