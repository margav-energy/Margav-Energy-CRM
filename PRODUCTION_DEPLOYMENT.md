# 🚀 Production Deployment Guide - crm.margav.energy

## 📋 **Overview**

This guide covers deploying the Margav Energy CRM system to `crm.margav.energy` in production.

## 🔧 **Environment Configuration**

### **Backend Environment Variables**

Create a `.env` file in the backend directory with:

```bash
# Django settings
SECRET_KEY=your-production-secret-key-here
DEBUG=False
ALLOWED_HOSTS=crm.margav.energy,www.crm.margav.energy

# Database (recommended for production)
DATABASE_URL=postgresql://user:password@localhost:5432/crm_db

# Email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password

# Google Calendar settings
GOOGLE_CREDENTIALS_PATH=/path/to/service-account-credentials.json
GOOGLE_CALENDAR_EMAIL=ella@margav.energy

# Dialer API settings
DIALER_API_KEY=your-secure-production-api-key-here
```

### **Frontend Environment Variables**

Create a `.env.production` file in the frontend directory with:

```bash
NODE_ENV=production
REACT_APP_API_URL=https://crm.margav.energy/api
```

## 🌐 **Domain Configuration**

### **DNS Settings**

Configure your DNS to point `crm.margav.energy` to your server:

```
A    crm.margav.energy    YOUR_SERVER_IP
CNAME www.crm.margav.energy    crm.margav.energy
```

### **SSL Certificate**

Ensure you have a valid SSL certificate for `crm.margav.energy` and `www.crm.margav.energy`.

## 🐍 **Backend Deployment**

### **1. Server Setup**

```bash
# Install Python 3.9+
sudo apt update
sudo apt install python3.9 python3.9-venv python3.9-dev

# Install PostgreSQL (recommended)
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx
```

### **2. Application Setup**

```bash
# Clone repository
git clone <your-repo-url> /var/www/crm.margav.energy
cd /var/www/crm.margav.energy/backend

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp env.example .env
# Edit .env with production values

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### **3. Gunicorn Configuration**

Create `/var/www/crm.margav.energy/backend/gunicorn.conf.py`:

```python
bind = "127.0.0.1:8000"
workers = 3
user = "www-data"
group = "www-data"
chdir = "/var/www/crm.margav.energy/backend"
module = "crm_backend.wsgi:application"
```

### **4. Systemd Service**

Create `/etc/systemd/system/crm-backend.service`:

```ini
[Unit]
Description=Margav Energy CRM Backend
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/crm.margav.energy/backend
Environment=PATH=/var/www/crm.margav.energy/backend/venv/bin
ExecStart=/var/www/crm.margav.energy/backend/venv/bin/gunicorn --config gunicorn.conf.py crm_backend.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

## ⚛️ **Frontend Deployment**

### **1. Build Production Version**

```bash
cd /var/www/crm.margav.energy/frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### **2. Serve Static Files**

The built files will be in `/var/www/crm.margav.energy/frontend/build/`

## 🔧 **Nginx Configuration**

Create `/etc/nginx/sites-available/crm.margav.energy`:

```nginx
server {
    listen 80;
    server_name crm.margav.energy www.crm.margav.energy;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.margav.energy www.crm.margav.energy;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend (React)
    location / {
        root /var/www/crm.margav.energy/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/crm.margav.energy/backend/static/;
    }

    # Media files
    location /media/ {
        alias /var/www/crm.margav.energy/backend/media/;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/crm.margav.energy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🚀 **Start Services**

```bash
# Start backend service
sudo systemctl enable crm-backend
sudo systemctl start crm-backend

# Restart Nginx
sudo systemctl restart nginx
```

## ✅ **Verification**

1. **Check backend**: `https://crm.margav.energy/api/`
2. **Check frontend**: `https://crm.margav.energy/`
3. **Check admin**: `https://crm.margav.energy/admin/`

## 🔐 **Security Considerations**

1. **Firewall**: Configure UFW to only allow necessary ports
2. **Database**: Use strong passwords and restrict access
3. **SSL**: Ensure valid SSL certificates
4. **API Keys**: Use strong, unique API keys for production
5. **Backups**: Set up regular database and file backups

## 📊 **Monitoring**

Consider setting up:

- **Log monitoring**: `journalctl -u crm-backend -f`
- **Nginx logs**: `/var/log/nginx/`
- **Database monitoring**: PostgreSQL logs
- **SSL monitoring**: Certificate expiration alerts

## 🔄 **Updates**

To update the application:

```bash
# Pull latest changes
cd /var/www/crm.margav.energy
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart crm-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 📞 **Support**

For deployment issues, check:

- Service status: `sudo systemctl status crm-backend`
- Nginx status: `sudo systemctl status nginx`
- Logs: `journalctl -u crm-backend -f`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
