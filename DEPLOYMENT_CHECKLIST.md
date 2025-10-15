# ✅ **Deployment Checklist for Margav Energy CRM**

## **🔧 Pre-Deployment Setup**

### **Backend Preparation**
- [ ] **Django Settings**: Updated for production (DEBUG=False)
- [ ] **Requirements**: All dependencies listed in requirements.txt
- [ ] **Database**: PostgreSQL configuration ready
- [ ] **Static Files**: WhiteNoise configured for serving
- [ ] **CORS**: Configured for frontend domain
- [ ] **Environment Variables**: All secrets prepared

### **Frontend Preparation**
- [ ] **Build Script**: Production build script created
- [ ] **Environment Variables**: API URL configured
- [ ] **Dependencies**: All packages in package.json
- [ ] **Build Output**: Static files ready for deployment

### **Google APIs Setup**
- [ ] **OAuth Client**: Created in Google Cloud Console
- [ ] **Redirect URIs**: Updated for production domain
- [ ] **Sheets API**: Enabled and configured
- [ ] **Calendar API**: Enabled and configured
- [ ] **Service Account**: Created with proper permissions

## **🚀 Render Deployment Steps**

### **Step 1: Backend Deployment**
- [ ] **Create Web Service** on Render
- [ ] **Connect GitHub Repository**
- [ ] **Set Build Command**: `pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput && python manage.py migrate`
- [ ] **Set Start Command**: `cd backend && gunicorn crm_backend.wsgi:application`
- [ ] **Create PostgreSQL Database**
- [ ] **Set Environment Variables**:
  - [ ] `DEBUG=False`
  - [ ] `SECRET_KEY=your-secret-key`
  - [ ] `DATABASE_URL=postgresql://...`
  - [ ] `ALLOWED_HOSTS=margav-crm-backend.onrender.com`
  - [ ] `CORS_ALLOWED_ORIGINS=https://margav-crm-frontend.onrender.com`
  - [ ] `GOOGLE_CLIENT_ID=your-client-id`
  - [ ] `GOOGLE_CLIENT_SECRET=your-client-secret`
  - [ ] `GOOGLE_REDIRECT_URI=https://margav-crm-backend.onrender.com/api/auth/google/callback`
  - [ ] `GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id`
  - [ ] `GOOGLE_SHEETS_WORKSHEET_NAME=Leads`
  - [ ] `GOOGLE_CALENDAR_EMAIL=your-calendar-email`
  - [ ] `DIALER_API_KEY=your-dialer-key`

### **Step 2: Frontend Deployment**
- [ ] **Create Static Site** on Render
- [ ] **Connect GitHub Repository**
- [ ] **Set Build Command**: `cd frontend && npm install && npm run build`
- [ ] **Set Publish Directory**: `frontend/build`
- [ ] **Set Environment Variables**:
  - [ ] `REACT_APP_API_URL=https://margav-crm-backend.onrender.com`

### **Step 3: Database Setup**
- [ ] **Create PostgreSQL Database** on Render
- [ ] **Connect Database to Backend Service**
- [ ] **Run Migrations** (automatic during build)
- [ ] **Create Superuser** (if needed)

## **🔍 Testing & Verification**

### **Backend Testing**
- [ ] **API Endpoints**: Test all API endpoints
- [ ] **Admin Interface**: Access Django admin
- [ ] **Google OAuth**: Test Google authentication
- [ ] **Database**: Verify database connection
- [ ] **Static Files**: Check static file serving

### **Frontend Testing**
- [ ] **Login**: Test user authentication
- [ ] **Lead Creation**: Test lead form submission
- [ ] **Callback Scheduling**: Test callback functionality
- [ ] **Google Sheets**: Test data synchronization
- [ ] **Google Calendar**: Test calendar integration

### **Integration Testing**
- [ ] **End-to-End Flow**: Complete user journey
- [ ] **Data Persistence**: Verify data is saved
- [ ] **Error Handling**: Test error scenarios
- [ ] **Performance**: Check response times

## **🔒 Security Checklist**

- [ ] **HTTPS**: SSL certificates enabled
- [ ] **Environment Variables**: No secrets in code
- [ ] **CORS**: Properly configured
- [ ] **Database**: Secure connection
- [ ] **API Keys**: Properly secured
- [ ] **User Permissions**: Role-based access

## **📊 Monitoring Setup**

- [ ] **Render Dashboard**: Monitor service health
- [ ] **Logs**: Check application logs
- [ ] **Metrics**: Monitor performance
- [ ] **Alerts**: Set up error notifications
- [ ] **Backups**: Database backup strategy

## **🌐 Domain & DNS (Optional)**

- [ ] **Custom Domain**: Configure if needed
- [ ] **DNS Records**: Point domain to Render
- [ ] **SSL Certificate**: Verify HTTPS
- [ ] **Subdomain**: Configure if needed

## **📱 Mobile Testing**

- [ ] **Responsive Design**: Test on mobile devices
- [ ] **Touch Interface**: Verify touch interactions
- [ ] **Performance**: Check mobile performance
- [ ] **Cross-Browser**: Test in different browsers

## **🔄 Post-Deployment**

- [ ] **User Training**: Train users on new system
- [ ] **Data Migration**: Import existing data if needed
- [ ] **Backup Strategy**: Implement regular backups
- [ ] **Monitoring**: Set up ongoing monitoring
- [ ] **Documentation**: Update user documentation

## **🚨 Rollback Plan**

- [ ] **Backup Strategy**: Keep previous version ready
- [ ] **Database Backup**: Recent database backup
- [ ] **Code Repository**: Tag stable versions
- [ ] **Environment Variables**: Document all settings
- [ ] **Dependencies**: Document all versions

## **📈 Performance Optimization**

- [ ] **Database Indexing**: Optimize database queries
- [ ] **Static Files**: Optimize static file serving
- [ ] **Caching**: Implement caching strategies
- [ ] **CDN**: Use CDN for static assets
- [ ] **Monitoring**: Set up performance monitoring

## **🔧 Maintenance Tasks**

- [ ] **Regular Updates**: Keep dependencies updated
- [ ] **Security Patches**: Apply security updates
- [ ] **Database Maintenance**: Regular database cleanup
- [ ] **Log Rotation**: Manage log files
- [ ] **Backup Verification**: Test backup restoration

---

## **📞 Support Contacts**

- **Render Support**: [render.com/support](https://render.com/support)
- **Google Cloud Support**: [cloud.google.com/support](https://cloud.google.com/support)
- **Django Documentation**: [docs.djangoproject.com](https://docs.djangoproject.com)
- **React Documentation**: [reactjs.org/docs](https://reactjs.org/docs)

---

**✅ Complete this checklist before going live!**
