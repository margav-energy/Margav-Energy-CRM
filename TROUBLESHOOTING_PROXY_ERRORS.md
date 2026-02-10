# Troubleshooting Proxy Errors (ECONNRESET)

## Problem
You're seeing proxy errors like:
```
Proxy error: Could not proxy request /canvasser from localhost:3000 to http://localhost:8000/.
ECONNRESET
```

This means the React frontend (port 3000) cannot connect to the Django backend (port 8000).

## Solutions

### 1. Check if Django Backend is Running

**Windows:**
```bash
# Check if Django is running on port 8000
netstat -ano | findstr :8000
```

**Linux/Mac:**
```bash
# Check if Django is running on port 8000
lsof -i :8000
# or
netstat -an | grep 8000
```

### 2. Start the Django Backend Server

If the backend isn't running, start it:

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (if using one)
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Run Django development server
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### 3. Verify Backend is Accessible

Open your browser and go to:
- http://localhost:8000/api/ (should show API endpoints or error page)
- http://localhost:8000/admin/ (should show Django admin login)

If these don't load, the backend isn't running properly.

### 4. Check for Port Conflicts

If port 8000 is already in use by another process:

**Option A: Use a different port**
```bash
python manage.py runserver 8001
```

Then update `frontend/package.json`:
```json
"proxy": "http://localhost:8001"
```

**Option B: Kill the process using port 8000**

**Windows:**
```bash
# Find process ID
netstat -ano | findstr :8000
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
```

### 5. Check Django Settings

Make sure `ALLOWED_HOSTS` in `backend/crm_backend/settings.py` includes:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']
```

### 6. Restart Both Servers

1. **Stop the frontend** (Ctrl+C in the terminal running React)
2. **Stop the backend** (Ctrl+C in the terminal running Django)
3. **Start backend first:**
   ```bash
   cd backend
   python manage.py runserver
   ```
4. **Then start frontend** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

### 7. Clear Browser Cache

Sometimes cached requests can cause issues:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### 8. Check Firewall/Antivirus

Firewall or antivirus software might be blocking the connection:
- Temporarily disable to test
- Add exceptions for localhost:8000 and localhost:3000

### 9. Check Django Logs

Look at the Django terminal output for errors:
- Database connection errors
- Import errors
- Permission errors
- Any tracebacks

### 10. Verify CORS Settings (if applicable)

If you're using CORS middleware, ensure it's configured correctly in `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## Quick Fix Checklist

- [ ] Django backend is running (`python manage.py runserver`)
- [ ] Backend is accessible at http://localhost:8000
- [ ] No port conflicts (port 8000 is free)
- [ ] `ALLOWED_HOSTS` includes 'localhost'
- [ ] Both servers restarted
- [ ] Browser cache cleared
- [ ] No firewall blocking connections

## Still Having Issues?

1. Check Django terminal for error messages
2. Check React terminal for more detailed error messages
3. Try accessing the API directly: http://localhost:8000/api/leads/
4. Check if you need to run migrations: `python manage.py migrate`

