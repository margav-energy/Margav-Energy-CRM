# 🚀 **Render Deployment Guide for Margav Energy CRM**

This guide will help you deploy your CRM system to Render with both backend and frontend.

## **📋 Prerequisites**

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Google Cloud Console**: For Google Sheets and Calendar APIs
4. **Environment Variables**: Prepare all required API keys

## **🔧 Step 1: Backend Deployment**

### **1.1 Create Backend Service on Render**

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name**: `margav-crm-backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt
     cd backend
     python manage.py collectstatic --noinput
     python manage.py migrate
     ```
   - **Start Command**: 
     ```bash
     cd backend && gunicorn crm_backend.wsgi:application
     ```

### **1.2 Set Environment Variables**

In the Render dashboard, go to **Environment** tab and add:

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=crm.margav.energy,www.crm.margav.energy,api.crm.margav.energy,margav-crm-backend.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://crm.margav.energy,https://www.crm.margav.energy,https://margav-crm-frontend.onrender.com,http://localhost:3000

# Database (will be set automatically by Render)
DATABASE_URL=postgresql://...

# Google APIs
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.crm.margav.energy/api/auth/google/callback
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SHEETS_WORKSHEET_NAME=Leads
GOOGLE_CALENDAR_EMAIL=your-calendar-email

# Dialer API
DIALER_API_KEY=your-dialer-api-key
```

### **1.3 Create Database**

1. **Go to Render Dashboard** → **New** → **PostgreSQL**
2. **Name**: `margav-crm-db`
3. **Plan**: Starter (Free tier)
4. **Connect to your backend service**

## **🎨 Step 2: Frontend Deployment**

### **2.1 Create Frontend Service on Render**

1. **Go to Render Dashboard** → **New** → **Static Site**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name**: `margav-crm-frontend`
   - **Build Command**: 
     ```bash
     cd frontend
     npm install
     npm run build
     ```
   - **Publish Directory**: `frontend/build`

### **2.2 Set Frontend Environment Variables**

```bash
REACT_APP_API_URL=https://api.crm.margav.energy
```

## **🔐 Step 3: Google Cloud Console Setup**

### **3.1 Update OAuth Redirect URIs**

1. **Go to Google Cloud Console** → **APIs & Services** → **Credentials**
2. **Edit your OAuth 2.0 Client**
3. **Add Authorized Redirect URIs:**
   ```
   https://api.crm.margav.energy/api/auth/google/callback
   ```

### **3.2 Update Google Sheets API**

1. **Go to Google Sheets** → **Share** → **Add people**
2. **Add your service account email** (from Google Cloud Console)
3. **Give Editor permissions**

## **📱 Step 4: Frontend Build Configuration**

### **4.1 Update API Configuration**

The frontend is already configured to use environment variables for the API URL.

### **4.2 Build Process**

The build process will:
1. Install dependencies
2. Build the React app
3. Deploy static files to Render

## **🚀 Step 5: Deployment Process**

### **5.1 Deploy Backend First**

1. **Push your code to GitHub**
2. **Render will automatically build and deploy**
3. **Check the logs for any errors**
4. **Test the API endpoints**

### **5.2 Deploy Frontend**

1. **After backend is running, deploy frontend**
2. **Update CORS settings if needed**
3. **Test the full application**

## **🔍 Step 6: Testing & Verification**

### **6.1 Backend Testing**

Test these endpoints:
- `https://crm.margav.energy/api/leads/`
- `https://crm.margav.energy/admin/`
- `https://crm.margav.energy/api/auth/google/`

### **6.2 Frontend Testing**

- Visit `https://crm.margav.energy`
- Test login functionality
- Test lead creation
- Test callback scheduling

## **📊 Step 7: Monitoring & Maintenance**

### **7.1 Render Dashboard**

- **Monitor logs** for errors
- **Check metrics** for performance
- **Set up alerts** for downtime

### **7.2 Database Management**

- **Regular backups** (Render handles this)
- **Monitor database usage**
- **Scale up if needed**

## **🛠️ Troubleshooting**

### **Common Issues:**

1. **Build Failures**
   - Check build logs in Render dashboard
   - Verify all dependencies are in requirements.txt

2. **CORS Errors**
   - Update CORS_ALLOWED_ORIGINS in backend
   - Ensure frontend URL is included

3. **Database Connection**
   - Verify DATABASE_URL is set correctly
   - Check database service is running

4. **Google API Errors**
   - Verify all Google API keys are correct
   - Check OAuth redirect URIs

## **💰 Cost Considerations**

### **Render Free Tier Limits:**
- **Backend**: 750 hours/month
- **Database**: 1GB storage
- **Frontend**: Unlimited static hosting

### **Scaling Options:**
- **Starter Plan**: $7/month for backend
- **Database**: $7/month for 1GB
- **Custom Domains**: Free

## **🔒 Security Considerations**

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Render provides SSL certificates
3. **CORS**: Properly configured for production
4. **Database**: Secure connection strings

## **📈 Performance Optimization**

1. **Static Files**: Served by WhiteNoise
2. **Database**: Optimized queries
3. **Frontend**: Built for production
4. **CDN**: Render provides global CDN

## **🌐 Step 7: Custom Domain Setup (crm.margav.energy)**

### **7.1 Domain Structure**
- **Main CRM**: `https://crm.margav.energy` (React frontend)
- **API**: `https://crm.margav.energy/api/` (Backend API endpoints)
- **Admin**: `https://crm.margav.energy/admin/` (Django admin)

### **7.2 DNS Configuration**
1. **Add CNAME Record** to your domain provider:
   ```
   crm → margav-crm-backend.onrender.com
   ```

2. **Configure Custom Domain** in Render:
   - **Backend Service**: Add `crm.margav.energy`
   - **Note**: The backend serves both API and React frontend

3. **SSL Certificates**: Render automatically provisions SSL certificates

### **7.3 Update Environment Variables**
- **Backend**: Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
- **Frontend**: Update `REACT_APP_API_URL` to `https://crm.margav.energy`
- **Google OAuth**: Update redirect URIs to `https://crm.margav.energy/api/auth/google/callback`

## **🎯 Next Steps After Deployment**

1. **Set up monitoring** with Render's built-in tools
2. **Configure custom domain** (crm.margav.energy)
3. **Set up automated backups**
4. **Monitor performance** and scale as needed
5. **Test all functionality** in production environment

---

## **📞 Support**

If you encounter issues:
1. **Check Render logs** first
2. **Verify environment variables**
3. **Test API endpoints** individually
4. **Check Google API quotas**

Your CRM system will be live and accessible worldwide! 🌍
