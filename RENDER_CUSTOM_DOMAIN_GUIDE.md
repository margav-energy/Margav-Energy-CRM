# 🌐 Render Deployment with Custom Domain Guide

## Overview

This guide will help you deploy your Margav Energy CRM to Render and connect your custom domain `crm.margav.energy`.

## 🔐 Secret Key

**Your generated secret key:**

```
SECRET_KEY=%-0xc*v0pu4ibhl_#mr^5q1!-v5vg+_+673*(((5efw3i%m8r8
```

## 🚀 Step-by-Step Deployment

### Step 1: Create PostgreSQL Database

1. Go to [render.com](https://render.com) dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. **Name**: `margav-crm-db`
4. **Plan**: Free
5. **Click "Create Database"**
6. **Copy the DATABASE_URL** (you'll need this)

### Step 2: Deploy Backend (Django API)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. **Configure the service:**

**Basic Settings:**

- **Name**: `margav-crm-backend`
- **Environment**: `Python 3`
- **Region**: Choose closest to you
- **Branch**: `main`

**Build & Deploy:**

- **Build Command**:
  ```bash
  cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
  ```
- **Start Command**:
  ```bash
  cd backend && python manage.py migrate && gunicorn crm_backend.wsgi:application
  ```

**Environment Variables:**

```
SECRET_KEY=%-0xc*v0pu4ibhl_#mr^5q1!-v5vg+_+673*(((5efw3i%m8r8
DEBUG=False
ALLOWED_HOSTS=margav-crm-backend.onrender.com
DATABASE_URL=[from PostgreSQL service]
DIALER_API_KEY=margav-dialer-2024-secure-key-12345
```

4. **Click "Create Web Service"**
5. **Wait for deployment** and note the URL: `https://margav-crm-backend.onrender.com`

### Step 3: Deploy Frontend (React App)

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. **Configure the service:**

**Basic Settings:**

- **Name**: `margav-crm-frontend`
- **Branch**: `main`

**Build & Deploy:**

- **Build Command**:
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Publish Directory**: `frontend/build`

**Environment Variables:**

```
REACT_APP_API_URL=https://margav-crm-backend.onrender.com/api
```

4. **Click "Create Static Site"**
5. **Wait for deployment** and note the URL: `https://margav-crm-frontend.onrender.com`

### Step 4: Test Default URLs

1. **Test Backend**: Visit `https://margav-crm-backend.onrender.com/api/`
2. **Test Frontend**: Visit `https://margav-crm-frontend.onrender.com`
3. **Verify everything works** before adding custom domain

## 🌐 Adding Custom Domain

### Step 5: Add Custom Domain to Backend

1. **Go to your backend service** in Render dashboard
2. **Click "Settings"** tab
3. **Scroll to "Custom Domains"**
4. **Click "Add Domain"**
5. **Enter**: `crm.margav.energy`
6. **Click "Add"**

### Step 6: Add Custom Domain to Frontend

1. **Go to your frontend service** in Render dashboard
2. **Click "Settings"** tab
3. **Scroll to "Custom Domains"**
4. **Click "Add Domain"**
5. **Enter**: `www.crm.margav.energy` (or `crm.margav.energy` if you prefer)
6. **Click "Add"**

### Step 7: DNS Configuration

Render will provide DNS records. Add these to your domain provider:

**For Backend (`crm.margav.energy`):**

```
Type: CNAME
Name: crm
Value: margav-crm-backend.onrender.com
```

**For Frontend (`www.crm.margav.energy`):**

```
Type: CNAME
Name: www.crm
Value: margav-crm-frontend.onrender.com
```

**Alternative (if you want both on same domain):**

```
Type: CNAME
Name: crm
Value: margav-crm-frontend.onrender.com
```

### Step 8: Update Environment Variables

**Backend Environment Variables:**

```
SECRET_KEY=%-0xc*v0pu4ibhl_#mr^5q1!-v5vg+_+673*(((5efw3i%m8r8
DEBUG=False
ALLOWED_HOSTS=crm.margav.energy,www.crm.margav.energy,margav-crm-backend.onrender.com
DATABASE_URL=[from PostgreSQL service]
DIALER_API_KEY=margav-dialer-2024-secure-key-12345
CORS_ALLOWED_ORIGINS=https://crm.margav.energy,https://www.crm.margav.energy,https://margav-crm-frontend.onrender.com
```

**Frontend Environment Variables:**

```
REACT_APP_API_URL=https://crm.margav.energy/api
```

### Step 9: SSL Certificate

- **Render automatically provides SSL** for custom domains
- **Wait 24-48 hours** for SSL certificate to be issued
- **Your site will be available at**: `https://crm.margav.energy`

## 🔧 Domain Configuration Options

### Option 1: Separate Subdomains

- **Backend**: `api.crm.margav.energy`
- **Frontend**: `crm.margav.energy`

### Option 2: Same Domain (Recommended)

- **Frontend**: `crm.margav.energy`
- **Backend API**: `crm.margav.energy/api`

### Option 3: WWW Subdomain

- **Frontend**: `www.crm.margav.energy`
- **Backend**: `api.crm.margav.energy`

## 📊 Final URLs

After setup, your application will be available at:

- **Frontend**: `https://crm.margav.energy`
- **Backend API**: `https://crm.margav.energy/api`
- **Admin Panel**: `https://crm.margav.energy/admin`

## 🔒 Security Considerations

1. **HTTPS is automatic** with Render
2. **SSL certificates** are managed by Render
3. **Custom domains** are secure by default
4. **Environment variables** are encrypted

## 🆘 Troubleshooting

### Common Issues:

1. **DNS not propagating**

   - Wait 24-48 hours
   - Check DNS records are correct
   - Use `nslookup crm.margav.energy` to verify

2. **SSL certificate issues**

   - Wait for certificate to be issued
   - Check domain is properly configured
   - Verify DNS records

3. **CORS errors**
   - Update CORS_ALLOWED_ORIGINS
   - Check frontend API URL
   - Verify domain configuration

### Testing Commands:

```bash
# Test DNS resolution
nslookup crm.margav.energy

# Test SSL certificate
curl -I https://crm.margav.energy

# Test API endpoint
curl https://crm.margav.energy/api/
```

## 📞 Support

If you encounter issues:

- Check Render logs in dashboard
- Verify DNS configuration
- Ensure environment variables are correct
- Test with default Render URLs first

## 🎯 Summary

1. **Deploy to Render** with default URLs
2. **Test everything works**
3. **Add custom domains**
4. **Configure DNS records**
5. **Update environment variables**
6. **Wait for SSL certificate**
7. **Your app is live at**: `https://crm.margav.energy`

Your custom domain will be fully functional with SSL encryption! 🚀
