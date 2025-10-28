# Render Data Migration Steps - Using GitHub Repository

## Overview
Migrate your local leads data to the Render production environment using GitHub repository.

## Prerequisites
1. Your local database has 217 leads ready to export
2. Render service is running on Render.com
3. GitHub repository is connected to Render

---

## Step 1: Export Leads from Local Database

On your local machine, run this command to export leads to JSON:

```bash
# Navigate to project root
cd C:\Users\User\Desktop\Work\Margav-Energy-CRM

# Export leads (this creates production_leads_export.json)
python export_leads_to_production.py
```

This will:
- Export all leads from your local PostgreSQL database
- Create `production_leads_export.json` file
- Show summary of exported leads by status

**Expected Output:**
```
Exported 217 leads
Summary by status:
  - interested: 50
  - sent_to_kelly: 30
  - ...
```

---

## Step 2: Upload JSON File to GitHub

**Option A: Using GitHub Web Interface**
1. Go to your GitHub repository: `https://github.com/margav-energy/Margav-Energy-CRM`
2. Click "Add file" → "Upload files"
3. Select `production_leads_export.json`
4. Add commit message: "Add production leads data for migration"
5. Click "Commit changes"

**Option B: Using Git Command Line**
```bash
git add production_leads_export.json
git commit -m "Add production leads data for migration"
git push origin main
```

---

## Step 3: Access Render Shell

1. Log in to **Render.com**
2. Go to your **Web Service** dashboard
3. Click on **Shell** tab (in the left sidebar)
4. Wait for shell to connect (green indicator)

---

## Step 4: Download JSON File from GitHub in Render Shell

Once connected to Render shell, run:

```bash
# Navigate to project directory
cd /opt/render/project/src

# Download the JSON file from GitHub
curl -o production_leads_export.json https://raw.githubusercontent.com/margav-energy/Margav-Energy-CRM/main/production_leads_export.json

# Verify file was downloaded
ls -lh production_leads_export.json
```

---

## Step 5: Import Leads to Production Database

In the Render shell, run:

```bash
# Make sure you're in the project root
cd /opt/render/project/src

# Import the leads
python import_leads_to_production.py
```

This will:
- Connect to Render's PostgreSQL database
- Import all leads from the JSON file
- Update existing leads by phone number (if duplicates exist)
- Create new leads that don't exist
- Show progress and summary

**Expected Output:**
```
Connected to production database
Starting import...
Importing lead 1/217: Bernard Aziegben...
Importing lead 2/217: John Smith...
...
Import complete!
Summary:
  - New leads created: 217
  - Existing leads updated: 0
```

---

## Step 6: Clean Up (Optional)

After successful import, you can remove the JSON file from GitHub:

**Using Git Command Line:**
```bash
git rm production_leads_export.json
git commit -m "Remove production leads data after migration"
git push origin main
```

Or leave it for future reference.

---

## Step 7: Verify in Render Admin Panel

1. Go to your Render Web Service URL
2. Navigate to `/admin/`
3. Check the leads list to verify all 217 leads are present
4. Verify stats on the admin dashboard

---

## Troubleshooting

### Issue: Import fails with "authentication required"
**Solution:** Check that your Render service has correct `DATABASE_URL` environment variable set.

### Issue: File not found
**Solution:** Make sure you uploaded the JSON file to GitHub and downloaded it in the Render shell.

### Issue: Database connection error
**Solution:** Verify your Render PostgreSQL service is running and DATABASE_URL is correct.

### Issue: Import shows 0 leads created
**Solution:** Check if all leads already exist (phone numbers match). The script updates existing leads instead of creating duplicates.

---

## Data Safety Features

The import script includes these safety mechanisms:

1. **Duplicate Prevention:** Checks for existing leads by phone number
2. **Update Existing:** Updates existing leads instead of creating duplicates
3. **Safe Append:** Only creates leads that don't exist
4. **Progress Tracking:** Shows progress during import
5. **Error Handling:** Continues even if individual leads fail

---

## Important Notes

1. **Backup First:** The import updates existing leads. Make sure you have a backup of production data if needed.

2. **Network Requirements:** You need stable internet connection for GitHub download in Render shell.

3. **Timing:** Import may take 5-10 minutes depending on data size.

4. **Rollback:** If something goes wrong, you can restore from your local database (re-export and re-import).

---

## Quick Reference Commands

```bash
# 1. Local export
python export_leads_to_production.py

# 2. Upload to GitHub (via web or git)

# 3. In Render Shell:
curl -o production_leads_export.json https://raw.githubusercontent.com/margav-energy/Margav-Energy-CRM/main/production_leads_export.json
python import_leads_to_production.py

# 4. Verify in admin panel
```

---

## Need Help?

If you encounter issues:
1. Check the Render logs for errors
2. Verify database connection settings
3. Ensure JSON file is valid and accessible
4. Check GitHub repository has the latest commits

