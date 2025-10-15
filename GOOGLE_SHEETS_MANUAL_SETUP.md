# Google Sheets Manual Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Google Spreadsheet

1. **Go to Google Sheets**: https://sheets.google.com
2. **Click "Blank"** to create a new spreadsheet
3. **Rename the spreadsheet** to "Margav Energy CRM - Leads"
4. **Copy the Spreadsheet ID** from the URL:
   - The URL will look like: `https://docs.google.com/spreadsheets/d/1ABC123...XYZ/edit`
   - Copy the part between `/d/` and `/edit` (e.g., `1ABC123...XYZ`)

### Step 2: Configure the Spreadsheet ID

1. **Open the `.env` file** in the `backend` folder
2. **Find the line**: `GOOGLE_SHEETS_SPREADSHEET_ID=`
3. **Add your spreadsheet ID** after the equals sign:
   ```
   GOOGLE_SHEETS_SPREADSHEET_ID=1ABC123...XYZ
   ```

### Step 3: Test the Setup

1. **Restart the Django server** (if running)
2. **Go to the admin interface**: http://localhost:8000/admin/leads/lead/
3. **Click "🔄 Sync All to Google Sheets"**
4. **Check your Google Spreadsheet** - you should see your leads!

## 📊 What You'll See

Once configured, your Google Spreadsheet will have these columns:
- ID, Full Name, Phone, Email, Address, City, State, Postal Code
- Status, Disposition, Assigned Agent, Field Sales Rep
- Created Date, Updated Date, Appointment Date, Sale Amount
- Notes, Dialer Lead ID, Campaign, Fronter, Closer
- Is Deleted, Deleted Date

## 🔄 Automatic Sync

After setup, the system will automatically:
- ✅ Sync new leads to Google Sheets
- ✅ Update existing leads in Google Sheets
- ✅ Maintain data consistency

## 🛠️ Troubleshooting

### "No leads found to sync"
- Check that `GOOGLE_SHEETS_SPREADSHEET_ID` is set in `.env`
- Restart the Django server after adding the ID

### "Failed to sync leads"
- Check that the spreadsheet ID is correct
- Ensure the spreadsheet is accessible
- Check Django logs for detailed error messages

### "Permission denied"
- Make sure the Google account has access to the spreadsheet
- Check that OAuth credentials are properly configured

## 📞 Need Help?

If you encounter issues:
1. Check the Django server logs
2. Verify the spreadsheet ID is correct
3. Ensure OAuth credentials are set up
4. Contact support with specific error messages

---

**Note**: The spreadsheet ID is the long string in the Google Sheets URL between `/d/` and `/edit`.
