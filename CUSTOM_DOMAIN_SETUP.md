# 🌐 **Custom Domain Setup for crm.margav.energy**

This guide will help you configure your custom domain `crm.margav.energy` with Render deployment.

## **📋 Domain Structure**

- **Main CRM**: `https://crm.margav.energy` (React frontend)
- **API**: `https://crm.margav.energy/api/` (Backend API endpoints)
- **Admin**: `https://crm.margav.energy/admin/` (Django admin)

## **🔧 Step 1: DNS Configuration**

### **1.1 DNS Records Setup**

Add this DNS record to your domain provider (where you manage margav.energy):

```
Type: CNAME
Name: crm
Value: margav-crm-backend.onrender.com
TTL: 300
```

**Note**: Since we're using a single domain, we only need one CNAME record pointing to the backend service, which will serve both the API and the React frontend.

### **1.2 Alternative DNS Setup (if CNAME not supported)**

If your DNS provider doesn't support CNAME for root domains, use A records:

```
Type: A
Name: crm
Value: [Render IP Address]
TTL: 300
```

## **🚀 Step 2: Render Configuration**

### **2.1 Backend Service (Serves Both API and Frontend)**

1. **Go to your backend service** in Render dashboard
2. **Settings** → **Custom Domains**
3. **Add Custom Domain**: `crm.margav.energy`
4. **SSL Certificate**: Render will automatically provision SSL

**Note**: You only need to configure the backend service with the custom domain. The backend will serve both the API endpoints and the React frontend.

## **🔐 Step 3: Environment Variables Update**

### **3.1 Backend Environment Variables**

Update these in your Render backend service:

```bash
# Domain Configuration
ALLOWED_HOSTS=crm.margav.energy,www.crm.margav.energy,margav-crm-backend.onrender.com,localhost,127.0.0.1

# CORS Configuration  
CORS_ALLOWED_ORIGINS=https://crm.margav.energy,https://www.crm.margav.energy,https://margav-crm-frontend.onrender.com,http://localhost:3000,http://127.0.0.1:3000

# Google OAuth
GOOGLE_REDIRECT_URI=https://crm.margav.energy/api/auth/google/callback
```

### **3.2 Frontend Environment Variables**

Update these in your Render frontend service:

```bash
REACT_APP_API_URL=https://crm.margav.energy
```

## **🔧 Step 4: Google Cloud Console Updates**

### **4.1 Update OAuth Redirect URIs**

1. **Go to Google Cloud Console** → **APIs & Services** → **Credentials**
2. **Edit your OAuth 2.0 Client**
3. **Update Authorized Redirect URIs:**
   ```
   https://crm.margav.energy/api/auth/google/callback
   ```

### **4.2 Update Google Sheets API**

1. **Go to Google Sheets** → **Share** → **Add people**
2. **Add your service account email**
3. **Give Editor permissions**

## **📱 Step 5: Frontend API Configuration**

The frontend is already configured to use environment variables. The `REACT_APP_API_URL` will automatically point to your custom domain.

## **🔍 Step 6: Testing Your Custom Domain**

### **6.1 Test Backend API**

```bash
# Test API endpoints
curl https://crm.margav.energy/api/leads/
curl https://crm.margav.energy/admin/
```

### **6.2 Test Frontend**

1. **Visit**: `https://crm.margav.energy`
2. **Test login functionality**
3. **Test lead creation**
4. **Test callback scheduling**

### **6.3 Test Google Integration**

1. **Test Google OAuth login**
2. **Test Google Sheets sync**
3. **Test Google Calendar integration**

## **🛠️ Step 7: SSL Certificate Setup**

Render automatically provides SSL certificates for custom domains:

1. **Automatic SSL**: Render handles SSL certificate provisioning
2. **Force HTTPS**: Redirects HTTP to HTTPS automatically
3. **Certificate Renewal**: Automatic renewal

## **📊 Step 8: Monitoring & Maintenance**

### **8.1 Domain Health Checks**

- **DNS Propagation**: Check with `nslookup crm.margav.energy`
- **SSL Certificate**: Verify SSL is working
- **API Endpoints**: Test all API endpoints
- **Frontend Loading**: Test frontend loading

### **8.2 Performance Optimization**

- **CDN**: Render provides global CDN
- **Caching**: Configure appropriate caching headers
- **Compression**: Enable gzip compression

## **🚨 Troubleshooting**

### **Common Issues:**

1. **DNS Not Propagating**
   - Wait 24-48 hours for DNS propagation
   - Check DNS records are correct
   - Use `dig` or `nslookup` to verify

2. **SSL Certificate Issues**
   - Wait for SSL certificate provisioning (up to 24 hours)
   - Check domain is properly configured in Render
   - Verify DNS is pointing to Render

3. **CORS Errors**
   - Update CORS_ALLOWED_ORIGINS in backend
   - Ensure frontend domain is included
   - Check environment variables

4. **API Connection Issues**
   - Verify REACT_APP_API_URL is correct
   - Check backend is accessible
   - Test API endpoints directly

## **🔒 Security Considerations**

1. **HTTPS Only**: All traffic should be HTTPS
2. **CORS Configuration**: Properly configured for your domain
3. **Environment Variables**: Secure API keys
4. **Database Security**: Secure connection strings

## **📈 Performance Optimization**

1. **CDN**: Render provides global CDN
2. **Static Files**: Optimized serving
3. **Database**: Optimized queries
4. **Caching**: Appropriate caching headers

## **🎯 Final URLs**

After setup, your CRM will be accessible at:

- **Main CRM**: `https://crm.margav.energy`
- **API**: `https://crm.margav.energy/api/`
- **Admin**: `https://crm.margav.energy/admin/`
- **Google OAuth**: `https://crm.margav.energy/api/auth/google/`

## **📞 Support**

If you encounter issues:

1. **Check DNS propagation**: Use online DNS checkers
2. **Verify SSL certificates**: Check certificate status
3. **Test API endpoints**: Use curl or Postman
4. **Check Render logs**: Monitor application logs

---

**✅ Your custom domain setup is complete!**
