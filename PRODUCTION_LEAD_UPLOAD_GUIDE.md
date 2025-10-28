# Production Lead Upload Guide

## Overview
Your 217 leads have been successfully exported from your local PostgreSQL database to `production_leads_export.json`.

## Export Summary
- **Total Leads**: 217
- **File**: `production_leads_export.json` (178KB)
- **Status Breakdown**:
  - Qualified: 66
  - Blow Out: 47
  - Cold Call: 35
  - No Contact: 28
  - Qualifier Callback: 22
  - Callback: 18
  - Sent to Kelly: 1

## Upload Methods

### Method 1: Using Render Shell (Recommended)

1. **Upload the JSON file to Render**:
   - Go to your Render dashboard at https://dashboard.render.com
   - Navigate to your web service
   - Click on the "Shell" tab
   - Upload `production_leads_export.json` file

2. **Upload the import script**:
   - Upload `import_leads_to_production.py` to your Render server

3. **Run the import**:
   ```bash
   python import_leads_to_production.py production_leads_export.json
   ```

### Method 2: Using Render Database Connection

1. **Get your production database connection string**:
   - Go to Render dashboard
   - Click on your PostgreSQL database service
   - Go to "Info" tab
   - Copy the "Internal Database URL" or "External Connection" string

2. **Connect to your database** using a PostgreSQL client:
   ```bash
   psql [your-connection-string]
   ```

3. **Or use Django on production**:
   ```bash
   # On Render shell
   python manage.py shell
   
   # Then run this Python code:
   import json
   import sys
   sys.path.append('/opt/render/project/src')
   
   from leads.models import Lead
   from accounts.models import User
   from django.utils import timezone
   from datetime import datetime
   
   # Load the JSON file
   with open('production_leads_export.json', 'r') as f:
       leads_data = json.load(f)
   
   # Import logic (see import_leads_to_production.py for full code)
   created = 0
   for lead_data in leads_data:
       # Import logic here
       created += 1
   
   print(f"Imported {created} leads")
   ```

### Method 3: Direct Database Import (Advanced)

1. **Export directly from local database** using Django's dumpdata:
   ```bash
   cd backend
   python manage.py dumpdata leads.Lead --natural-foreign --natural-primary > leads_export.json
   ```

2. **Upload to production**:
   ```bash
   python manage.py loaddata leads_export.json
   ```

## Step-by-Step: Method 1 (Easiest)

### On Your Local Machine:
1. The file `production_leads_export.json` is ready in your project root

### On Render Dashboard:
1. Go to: https://dashboard.render.com
2. Click on your web service
3. Click "Shell" tab
4. Upload both files:
   - `production_leads_export.json`
   - `import_leads_to_production.py`
5. Run the import:
   ```bash
   python import_leads_to_production.py production_leads_export.json
   ```

### Expected Output:
```
Loading leads from production_leads_export.json...
Found 217 leads to import
Processed 217 leads...

============================================================
IMPORT COMPLETE
============================================================
Successfully created: 217 leads
Failed: 0 leads
Total processed: 217 leads

Done! 217 new leads
```

## Verification

After upload, verify in your production admin:
1. Go to your production URL: https://crm.margav.energy/admin/
2. Navigate to Leads
3. You should see all 217 leads

## Troubleshooting

### If you get "Agent not found" errors:
- Some leads may be assigned to agents that don't exist in production
- The script will create those leads without agent assignment
- You can manually assign agents later from the admin panel

### If you get "Duplicate lead" errors:
- Leads are matched by phone number
- Duplicates will be updated instead of created
- This is expected behavior to prevent duplicate leads

### If the import fails:
- Check that all required fields are present
- Verify your production database is accessible
- Check the error messages in the console

## Next Steps After Upload

1. **Verify the data**:
   - Check admin panel for all 217 leads
   - Verify statuses are correct
   - Check agent assignments

2. **Test in production**:
   - View leads in dashboard
   - Test agent workflows
   - Verify appointments are visible

3. **Monitor for issues**:
   - Check for any missing data
   - Verify appointments are syncing
   - Test notification system

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify your database connection
3. Check that all agents exist in production
4. Review the export file for any issues

## File Locations

- Export file: `production_leads_export.json` (in project root)
- Import script: `import_leads_to_production.py` (in project root)
- Export script: `export_leads_to_production.py` (for future use)


