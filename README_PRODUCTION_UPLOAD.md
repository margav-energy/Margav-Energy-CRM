# Upload Your 217 Leads to Production - SAFE MODE

## ✅ Data Safety Guarantee

**YOUR EXISTING PRODUCTION DATA IS SAFE!**

This import script:
- ✅ **APPENDS** new leads (doesn't delete anything)
- ✅ **UPDATES** existing leads if phone numbers match
- ✅ **PRESERVES** all your existing production data
- ✅ **NEVER** deletes or overwrites without matching

### How It Works

1. Checks if a lead with that phone number already exists
2. If exists → Updates that lead with new data
3. If doesn't exist → Creates a new lead
4. **Existing leads in production are NEVER deleted**

## Quick Upload (3 Steps)

### Step 1: Prepare Files
Make sure you have in your project root:
- ✅ `production_leads_export.json` (your 217 leads)
- ✅ `import_leads_to_production.py` (import script)

### Step 2: Upload to Render Shell

1. Go to Render Dashboard: https://dashboard.render.com
2. Click on your **web service**
3. Click the **"Shell"** tab (bottom of the page)
4. In the shell, upload both files using:
   ```bash
   # You can drag & drop files in the Render shell interface
   # Or use the file browser in the shell window
   ```

### Step 3: Run Import

In the Render shell, run:
```bash
python import_leads_to_production.py production_leads_export.json
```

That's it! Your 217 leads will be added to production.

## What You'll See

```
Loading leads from production_leads_export.json...
Found 217 leads to import
   Processed 50 leads...
   Processed 100 leads...
   Processed 150 leads...
   Processed 200 leads...

============================================================
IMPORT COMPLETE
============================================================
Successfully created: 217 leads
Successfully updated: 0 leads
Failed: 0 leads
Total processed: 217 leads

Done! 217 new leads, 0 updated
```

## Verify Upload

1. Go to your production URL: https://crm.margav.energy
2. Login as admin
3. Check Dashboard → You should now see 217 leads!

## Troubleshooting

### Error: "File not found"
- Make sure you uploaded both files to Render shell
- Check file names are exactly: `production_leads_export.json` and `import_leads_to_production.py`

### Error: "Agent not found"
- Some leads have agents assigned that don't exist in production
- The script will create those leads anyway (without agent assignment)
- You can manually assign agents later from the admin panel

### Error: "Database connection failed"
- Your Render service might be sleeping
- Go to Render dashboard and "Resume" the service
- Try again

## Alternative: Direct Database Import

If you prefer using psql:

```bash
# Connect to Render database
psql [your-render-database-url]

# Then run the import from the Python shell
```

## Data Safety Details

The import script uses these safety checks:

```python
# Line 51: Check for existing lead by phone number
existing_lead = Lead.objects.filter(phone=lead_data['phone']).first()

if existing_lead:
    # Update existing lead (preserves other fields)
    existing_lead.full_name = lead_data['full_name']
    # ... update other fields
    existing_lead.save()
else:
    # Create new lead
    lead = Lead(...)
    lead.save()
```

This means:
- ❌ **WILL NOT** delete existing leads
- ❌ **WILL NOT** modify unrelated data
- ✅ **WILL** add new leads
- ✅ **WILL** update matching leads only

## Your Export Details

- **File**: `production_leads_export.json`
- **Total Leads**: 217
- **File Size**: 178 KB
- **Status Breakdown**:
  - Qualified: 66
  - Blow Out: 47
  - Cold Call: 35
  - No Contact: 28
  - Qualifier Callback: 22
  - Callback: 18
  - Sent to Kelly: 1

## Need Help?

Check `PRODUCTION_LEAD_UPLOAD_GUIDE.md` for detailed instructions.


