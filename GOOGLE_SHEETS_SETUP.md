# Google Sheets Integration Setup Guide

This guide will help you set up automatic lead backup to Google Sheets for the Margav Energy CRM.

## 🚀 Quick Setup

### 1. Prerequisites
- Google Calendar OAuth must be set up first (run `python manage.py setup_google_calendar`)
- Django server must be running

### 2. Set Up Google Sheets Integration

#### Option A: Create New Spreadsheet (Recommended)
```bash
cd backend
python manage.py setup_google_sheets --create-spreadsheet
```

#### Option B: Use Existing Spreadsheet
```bash
cd backend
python manage.py setup_google_sheets --spreadsheet-id YOUR_SPREADSHEET_ID
```

### 3. Verify Setup
- Check the `.env` file for `GOOGLE_SHEETS_SPREADSHEET_ID`
- Visit the admin interface at `http://localhost:8000/admin/leads/lead/`
- You should see new download and sync buttons

## 📊 Features

### Admin Interface Features
- **Download All as Excel** - Export all leads to Excel format
- **Download All as CSV** - Export all leads to CSV format  
- **Sync All to Google Sheets** - Backup all leads to Google Sheets
- **Bulk Actions** - Select specific leads and download/sync them

### Automatic Synchronization
- **Real-time Sync** - New leads are automatically synced to Google Sheets
- **Update Sync** - Lead updates are automatically reflected in Google Sheets
- **Backup Protection** - Your data is safely backed up in Google Sheets

## 🔧 Configuration

### Environment Variables
Add these to your `.env` file:
```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_WORKSHEET_NAME=Leads
```

### Spreadsheet Structure
The Google Sheets will have these columns:
- ID, Full Name, Phone, Email, Address, Postcode
- Status, Assigned Agent, Created Date, Updated Date
- Appointment Date, Notes, Property Information
- Energy Details, Timeframe, Deletion Status

## 📋 Usage

### Downloading Data
1. Go to `http://localhost:8000/admin/leads/lead/`
2. Click "📊 Download All as Excel" or "📄 Download All as CSV"
3. File will be downloaded with timestamp

### Syncing to Google Sheets
1. Go to `http://localhost:8000/admin/leads/lead/`
2. Click "🔄 Sync All to Google Sheets"
3. All leads will be backed up to your Google Sheet

### Bulk Operations
1. Select specific leads using checkboxes
2. Choose action from dropdown:
   - "Download Selected as Excel"
   - "Download Selected as CSV" 
   - "Sync Selected to Google Sheets"

## 🔄 Automatic Backup

Once configured, the system will automatically:
- ✅ Sync new leads to Google Sheets
- ✅ Update existing leads in Google Sheets
- ✅ Maintain data consistency between CRM and Sheets

## 🛠️ Troubleshooting

### Common Issues

#### "Google Sheets credentials not configured"
- Run `python manage.py setup_google_calendar` first
- Ensure `.env` file has OAuth credentials

#### "No spreadsheet ID configured"
- Run `python manage.py setup_google_sheets --create-spreadsheet`
- Or provide existing spreadsheet ID

#### "Failed to sync leads"
- Check internet connection
- Verify Google Sheets permissions
- Check Django logs for detailed error messages

### Manual Sync
If automatic sync fails, you can manually sync:
```bash
cd backend
python manage.py shell
>>> from leads.google_sheets_service import google_sheets_service
>>> result = google_sheets_service.sync_all_leads_to_sheets()
>>> print(f"Synced {result['success']} leads")
```

## 📈 Benefits

### Data Protection
- **Automatic Backup** - Never lose lead data
- **Real-time Sync** - Always up-to-date backup
- **Multiple Formats** - Excel, CSV, and Google Sheets

### Business Continuity
- **Offline Access** - View data in Google Sheets when CRM is down
- **Team Collaboration** - Share data with team members
- **Data Analysis** - Use Google Sheets tools for reporting

### Compliance
- **Audit Trail** - Track all lead changes
- **Data Retention** - Maintain historical records
- **Export Capability** - Easy data portability

## 🔐 Security

- OAuth 2.0 authentication ensures secure access
- No passwords stored in plain text
- Google's security infrastructure protects your data
- Automatic token refresh maintains access

## 📞 Support

If you encounter issues:
1. Check Django logs for error messages
2. Verify Google OAuth setup
3. Ensure spreadsheet permissions are correct
4. Contact support with specific error messages

---

**Note**: This integration requires Google Calendar OAuth to be set up first. The same OAuth credentials are used for both Calendar and Sheets integration.
