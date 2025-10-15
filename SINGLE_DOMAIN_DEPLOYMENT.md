# 🌐 **Single Domain Deployment: crm.margav.energy**

This guide shows how to deploy your CRM system using a single domain `crm.margav.energy` for both frontend and backend.

## **📋 Architecture Overview**

```
crm.margav.energy
├── / (React Frontend)
├── /api/ (Django API)
└── /admin/ (Django Admin)
```

## **🚀 Deployment Steps**

### **Step 1: Deploy Backend to Render**

1. **Create Web Service** on Render
2. **Connect GitHub repository**
3. **Configure service:**
   - **Build Command**: `pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command**: `cd backend && gunicorn crm_backend.wsgi:application`

### **Step 2: Set Environment Variables**

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=crm.margav.energy,www.crm.margav.energy,margav-crm-backend.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://crm.margav.energy,https://www.crm.margav.energy,https://margav-crm-frontend.onrender.com,http://localhost:3000,http://127.0.0.1:3000

# Database
DATABASE_URL=postgresql://... (auto-set by Render)

# Google APIs
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://crm.margav.energy/api/auth/google/callback
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SHEETS_WORKSHEET_NAME=Leads
GOOGLE_CALENDAR_EMAIL=your-calendar-email

# Dialer API
DIALER_API_KEY=your-dialer-api-key
```

### **Step 3: Configure DNS**

Add this CNAME record to your domain provider:
```
Type: CNAME
Name: crm
Value: margav-crm-backend.onrender.com
TTL: 300
```

### **Step 4: Add Custom Domain in Render**

1. **Go to your backend service** in Render dashboard
2. **Settings** → **Custom Domains**
3. **Add Custom Domain**: `crm.margav.energy`
4. **SSL Certificate**: Automatic

### **Step 5: Update Google OAuth**

1. **Go to Google Cloud Console** → **APIs & Services** → **Credentials**
2. **Edit your OAuth 2.0 Client**
3. **Update Authorized Redirect URIs:**
   ```
   https://crm.margav.energy/api/auth/google/callback
   ```

## **🎯 Final URLs**

After deployment, your CRM will be accessible at:

- **Main CRM**: `https://crm.margav.energy`
- **API**: `https://crm.margav.energy/api/`
- **Admin**: `https://crm.margav.energy/admin/`
- **Google OAuth**: `https://crm.margav.energy/api/auth/google/`

## **🔧 How It Works**

1. **Django Backend** serves both API and React frontend
2. **URL Routing**:
   - `/api/*` → Django API endpoints
   - `/admin/*` → Django admin interface
   - `/*` → React frontend (catch-all)
3. **Single Domain** simplifies deployment and management

## **✅ Benefits of Single Domain**

- **Simpler DNS**: Only one CNAME record needed
- **Easier SSL**: One SSL certificate for everything
- **No CORS Issues**: Same origin for frontend and API
- **Simpler Configuration**: Fewer environment variables
- **Better Performance**: No cross-domain requests

## **🚨 Important Notes**

1. **Frontend Build**: The React frontend is built and served by Django
2. **Static Files**: WhiteNoise serves static files in production
3. **URL Patterns**: Django catches all non-API routes for React
4. **Environment Variables**: Only backend service needs custom domain

## **📊 Testing Checklist**

- [ ] **Main Site**: `https://crm.margav.energy` loads
- [ ] **API Endpoints**: `https://crm.margav.energy/api/leads/` works
- [ ] **Admin Interface**: `https://crm.margav.energy/admin/` accessible
- [ ] **Google OAuth**: Login with Google works
- [ ] **Lead Creation**: Full CRM functionality works
- [ ] **Callback Scheduling**: All features functional

---

**🎉 Your CRM is now live at crm.margav.energy!**
