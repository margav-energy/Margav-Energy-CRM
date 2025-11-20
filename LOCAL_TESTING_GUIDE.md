# 🧪 Local Testing Guide for Agent Form

## Prerequisites

1. **Backend running** on `http://localhost:8000`
2. **Frontend running** on `http://localhost:3000`
3. **Database** set up and migrated
4. **User account** created in the CRM

## Step 1: Start the Backend

### Option A: Using Django's development server

```bash
cd backend
python manage.py runserver
```

The backend should be running on `http://localhost:8000`

### Option B: Using virtual environment

```bash
cd backend
# Activate virtual environment (if you have one)
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Run migrations (if needed)
python manage.py migrate

# Start server
python manage.py runserver
```

## Step 2: Start the Frontend

```bash
cd frontend
npm install  # Only needed first time or after package changes
npm start
```

The frontend should open automatically at `http://localhost:3000`

## Step 3: Login to the CRM

1. Open `http://localhost:3000` in your browser
2. Login with your credentials
3. Make sure you're logged in as an agent user

## Step 4: Test the Agent Form URL

### Test URL (Localhost)

```
http://localhost:3000/agent-form?data_list_name=Test_Campaign&first_name=Jane&last_name=Doe&email=jane.doe@example.com&phone=%2B44123456789&postcode=SW1A%201AA&agent=Test%20Agent&source=Test_Campaign
```

### What to Expect

1. **Form opens** with pre-filled data:
   - Name: "Jane Doe"
   - Phone: "+44123456789"
   - Email: "jane.doe@example.com"
   - Postcode: "SW1A 1AA"

2. **Green banner** shows: "Pre-filled from dialer: Jane Doe - +44123456789 - jane.doe@example.com"

3. **Form fields** are ready to complete:
   - Property information
   - Energy usage
   - Timeframe details
   - Additional notes

4. **Submit button** creates the lead

## Step 5: Test Different Scenarios

### Test 1: Full Data

```
http://localhost:3000/agent-form?data_list_name=Full_Test&first_name=John&last_name=Smith&email=john.smith@example.com&phone=%2B447956582788&postcode=SW1A%201AA&agent=John%20Doe&source=Full_Test
```

### Test 2: Minimal Data (Only Required Fields)

```
http://localhost:3000/agent-form?first_name=Test&phone=%2B44123456789
```

### Test 3: Missing Required Fields

```
http://localhost:3000/agent-form?first_name=Test
```

**Expected:** Error message showing missing phone number

### Test 4: Not Logged In

1. Logout from the CRM
2. Try the URL again
3. **Expected:** Redirects to login page
4. After login, **Expected:** Redirects back to form with parameters preserved

## Step 6: Test Form Submission

1. Fill out the form with test data
2. Click "Create Lead"
3. **Expected:**
   - Success toast notification
   - Redirect to agent dashboard after 1.5 seconds
   - Lead appears in your dashboard

## Step 7: Verify Lead Creation

1. Go to Agent Dashboard
2. Check if the lead appears in your leads list
3. Click on the lead to view details
4. Verify all form data was saved correctly

## Troubleshooting

### Issue: "Cannot connect to API"

**Solution:**
- Make sure backend is running on `http://localhost:8000`
- Check backend terminal for errors
- Verify `API_BASE_URL` in `frontend/src/api.ts` is set to `http://localhost:8000/api`

### Issue: "404 Not Found" for /agent-form

**Solution:**
- Make sure frontend is running
- Check browser console for errors
- Verify the route is in `frontend/src/App.tsx`
- Try refreshing the page

### Issue: "Redirects to login but doesn't come back"

**Solution:**
- Check browser console for errors
- Verify `redirect` parameter is in the login URL
- Check that login redirects to the `redirect` path

### Issue: "Form doesn't show pre-filled data"

**Solution:**
- Open browser console (F12)
- Check for URL parameter parsing errors
- Verify parameters are in the URL
- Check the console.log output from AgentFormPage

### Issue: "Lead not created after submission"

**Solution:**
- Check browser console for API errors
- Check backend terminal for errors
- Verify you're logged in
- Check network tab in browser DevTools

## Quick Test Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Logged in to CRM
- [ ] Can access `/agent-form` route
- [ ] URL parameters are parsed correctly
- [ ] Form shows pre-filled data
- [ ] Can submit form successfully
- [ ] Lead appears in dashboard
- [ ] Login redirect preserves parameters

## Testing with Different Browsers

Test in multiple browsers to ensure compatibility:
- Chrome
- Firefox
- Edge
- Safari (if on Mac)

## Testing URL Parameters

You can test with different parameter combinations:

### All Parameters
```
http://localhost:3000/agent-form?data_list_name=Campaign1&first_name=John&last_name=Smith&email=john@example.com&phone=%2B44123456789&postcode=SW1A%201AA&agent=Agent%20Name&source=Campaign1
```

### Only Required
```
http://localhost:3000/agent-form?first_name=Jane&phone=%2B44123456789
```

### With Special Characters
```
http://localhost:3000/agent-form?first_name=José&last_name=García&phone=%2B44123456789&postcode=SW1A%201AA
```

## Next Steps After Local Testing

Once local testing is successful:

1. ✅ Commit and push changes
2. ✅ Deploy to production
3. ✅ Test on production URL
4. ✅ Share URL with dialer creator

---

**Happy Testing!** 🚀

