# 🚀 Combined Service Deployment Guide

## Overview
This guide shows how to deploy your Margav Energy CRM as a **single combined service** on Render, where both the React frontend and Django backend run together.

## 🏗️ Architecture
```
Single Render Service
├── React Frontend (built and served as static files)
├── Django Backend (API + serves React app)
└── PostgreSQL Database (separate service)
```

## 📋 Prerequisites
- GitHub repository: `margav-energy/Margav-Energy-CRM`
- Render account
- Custom domain: `crm.margav.energy` (optional)

## 🚀 Step-by-Step Deployment

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Click **"New +"** → **"PostgreSQL"**

2. **Configure Database**
   ```
   Name: margav-crm-database
   Database: margav_crm_db
   User: margav_crm_user
   Region: Choose closest to you
   Plan: Starter (Free)
   ```

3. **Save Database URL**
   - Copy the **EXTERNAL** `DATABASE_URL` from the database dashboard
   - **Important**: Use the EXTERNAL URL, not the internal one
   - The external URL allows your web service to connect from outside the database's internal network
   - You'll need this for the web service environment variables

### Step 2: Create Combined Web Service

1. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub repository: `margav-energy/Margav-Energy-CRM`

2. **Configure Service**
   ```
   Name: margav-crm-fullstack
   Environment: Python 3
   Region: Same as database
   Branch: main
   Root Directory: backend
   ```

3. **Build & Start Commands**
   ```
   Build Command:
   cd ../frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
   
   Start Command:
   gunicorn crm_backend.wsgi:application
   ```

### Step 3: Environment Variables

Add these environment variables in Render dashboard:

```bash
# Database (use EXTERNAL URL from your PostgreSQL service)
DATABASE_URL=<your_external_database_url_from_step_1>

# Django
SECRET_KEY=&r@&_825l!e#)sy9r*_ke@v%s!um(z!odhl76ytl==vl97t^mn
DEBUG=False
ALLOWED_HOSTS=crm.margav.energy,www.crm.margav.energy,<your_render_url>

# CORS
CORS_ALLOWED_ORIGINS=https://crm.margav.energy,https://www.crm.margav.energy

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://crm.margav.energy/api/auth/google/callback

# Google Sheets (optional)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_WORKSHEET_NAME=Leads

# Google Calendar (optional)
GOOGLE_CALENDAR_EMAIL=your_calendar_email

# Dialer API (optional)
DIALER_API_KEY=your_dialer_api_key
```

**Important Notes:**
- **Use EXTERNAL database URL**: Your web service needs the external URL to connect to the database
- **Secret Key**: The provided secret key is secure and ready for production
- **Replace placeholders**: Update `<your_render_url>` with your actual Render service URL

### Step 4: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes)
3. **Check logs** for any errors

### Step 5: Custom Domain (Optional)

1. **In Render Dashboard**
   - Go to your service → **"Settings"** → **"Custom Domains"**
   - Add domain: `crm.margav.energy`

2. **Configure DNS**
   - Add CNAME record: `crm.margav.energy` → `<your_render_url>`
   - Add CNAME record: `www.crm.margav.energy` → `<your_render_url>`

## 🔧 How It Works

### Build Process
1. **Frontend Build**: React app compiles to `frontend/build/`
2. **Backend Setup**: Python dependencies installed
3. **Static Collection**: Django collects React build files
4. **Database Migration**: Django migrations run

### Runtime
1. **Django serves**:
   - API endpoints at `/api/`
   - Admin interface at `/admin/`
   - React app at `/` (root and all other paths)

2. **Static Files**: WhiteNoise serves React assets

## 📁 File Structure After Build
```
backend/
├── staticfiles/          # Collected static files (includes React build)
│   ├── static/           # React JS/CSS files
│   └── index.html        # React index.html
├── templates/            # Django templates
├── manage.py
└── crm_backend/
    ├── settings.py       # Configured for combined service
    └── urls.py           # Serves React at root
```

## 🎯 Benefits of Combined Service

✅ **Simpler Management**: One service instead of two
✅ **Cost Effective**: Single service pricing
✅ **Easier Deployment**: One build process
✅ **Better Performance**: No CORS issues
✅ **Unified Logging**: All logs in one place

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (use 18.x)
   - Ensure all dependencies are in `package.json`

2. **Static Files Not Loading**
   - Verify `STATICFILES_DIRS` in settings
   - Check WhiteNoise configuration

3. **Database Connection**
   - Verify `DATABASE_URL` format
   - Check database service is running

4. **React App Not Loading**
   - Check if `index.html` exists in `staticfiles/`
   - Verify URL routing in `urls.py`

### Debug Commands
```bash
# Check if React build exists
ls -la frontend/build/

# Check static files collection
python manage.py collectstatic --dry-run

# Test database connection
python manage.py dbshell
```

## 🚀 Next Steps

1. **Test your deployment** at your Render URL
2. **Set up custom domain** if desired
3. **Configure Google OAuth** for calendar integration
4. **Set up Google Sheets** for lead syncing
5. **Configure dialer integration** if needed

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test database connection
4. Check static file serving

Your combined service will be available at your Render URL and serve both the React frontend and Django API seamlessly!

## 📋 Quick Reference

### Essential Environment Variables
```bash
SECRET_KEY=&r@&_825l!e#)sy9r*_ke@v%s!um(z!odhl76ytl==vl97t^mn
DATABASE_URL=<your_external_database_url>
DEBUG=False
ALLOWED_HOSTS=crm.margav.energy,www.crm.margav.energy,<your_render_url>
```

### Build & Start Commands
```bash
# Build Command
cd ../frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt && python manage.py collectstatic --noinput

# Start Command  
gunicorn crm_backend.wsgi:application
```

### Service Configuration
- **Root Directory**: `backend`
- **Environment**: Python 3
- **Database**: Use EXTERNAL URL
- **Domain**: `crm.margav.energy` (optional)
