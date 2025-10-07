# 🚀 Margav Energy CRM Deployment Guide

## Overview

This is a full-stack application with:

- **Backend**: Django REST API (Python)
- **Frontend**: React TypeScript application
- **Database**: SQLite (development) / PostgreSQL (production)

## ❌ Why Vercel Won't Work

Vercel is designed for:

- Static websites
- Serverless functions
- JAMstack applications

**Your app needs:**

- Python runtime for Django
- Persistent database
- Backend API server
- Full-stack architecture

## ✅ Recommended Deployment Platforms

### Option 1: Railway (Recommended)

**Why Railway:**

- Perfect for full-stack apps
- Built-in PostgreSQL database
- Automatic deployments
- Easy Django + React setup

**Steps:**

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy both frontend and backend

### Option 2: Render

**Why Render:**

- Good for full-stack applications
- Free tier available
- Easy setup

**Steps:**

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Add PostgreSQL database
5. Configure build and start commands

### Option 3: DigitalOcean App Platform

**Why DigitalOcean:**

- Production-ready
- Managed databases
- Good performance

**Steps:**

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Create new app from GitHub
3. Add database component
4. Configure environment variables

## 🔧 Frontend-Only Deployment (Vercel)

If you want to deploy just the frontend to Vercel:

### 1. Build the Frontend

```bash
cd frontend
npm run build
```

### 2. Configure Environment Variables

Create `.env.local` in the frontend directory:

```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

### 3. Update API Configuration

Update `frontend/src/api.ts`:

```typescript
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";
```

### 4. Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Set environment variables in Vercel dashboard

## 🗄️ Database Options

### Development (SQLite)

- Already configured
- No additional setup needed

### Production (PostgreSQL)

- **Railway**: Built-in PostgreSQL
- **Render**: Add PostgreSQL service
- **DigitalOcean**: Managed PostgreSQL

## 🔐 Environment Variables

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgresql://user:pass@host:port/dbname
DIALER_API_KEY=your-dialer-api-key
```

### Frontend (.env.local)

```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

## 📁 Project Structure for Deployment

```
Margav Energy CRM/
├── backend/           # Django API
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
├── frontend/          # React App
│   ├── package.json
│   ├── build/         # Built for production
│   └── ...
└── vercel.json        # Vercel configuration (if using Vercel)
```

## 🚀 Quick Start with Railway

1. **Fork/Clone the repository**
2. **Go to [railway.app](https://railway.app)**
3. **Connect GitHub repository**
4. **Add PostgreSQL database**
5. **Set environment variables:**
   ```
   SECRET_KEY=your-secret-key
   DEBUG=False
   ALLOWED_HOSTS=*.railway.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DIALER_API_KEY=margav-dialer-2024-secure-key-12345
   ```
6. **Deploy!**

## 🔧 Build Commands

### Backend (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py collectstatic
python manage.py migrate
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend
npm install
npm run build
```

## 📊 Monitoring & Logs

- **Railway**: Built-in monitoring
- **Render**: Logs in dashboard
- **DigitalOcean**: App platform logs

## 🔒 Security Considerations

1. **Set DEBUG=False** in production
2. **Use strong SECRET_KEY**
3. **Configure ALLOWED_HOSTS**
4. **Use HTTPS**
5. **Set up CORS properly**

## 🆘 Troubleshooting

### Common Issues:

1. **Database connection errors**

   - Check DATABASE_URL
   - Ensure database is running

2. **CORS errors**

   - Update CORS_ALLOWED_ORIGINS
   - Check frontend API URL

3. **Static files not loading**

   - Run `python manage.py collectstatic`
   - Check STATIC_URL configuration

4. **Environment variables not loading**
   - Check .env file location
   - Verify variable names

## 📞 Support

For deployment issues:

- Check platform-specific documentation
- Review logs in deployment dashboard
- Ensure all environment variables are set
- Verify database connectivity

## 🎯 Recommended Approach

**For Production:**

1. **Use Railway** for full-stack deployment
2. **Set up PostgreSQL database**
3. **Configure environment variables**
4. **Enable automatic deployments**

**For Development:**

1. **Run locally** with SQLite
2. **Use ngrok** for external access
3. **Test with production-like environment**
