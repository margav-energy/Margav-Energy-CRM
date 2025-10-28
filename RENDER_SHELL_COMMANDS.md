# Render Shell Commands - Import Leads

## Quick Import Commands

Run these commands in the Render shell to import your leads:

```bash
# Navigate to project directory
cd /opt/render/project/src

# Verify files are present
ls import_leads_to_production.py
ls production_leads_export.json

# Run the import script
python import_leads_to_production.py production_leads_export.json
```

## Alternative: If files are in subdirectories

If the files aren't in the root, check where they are:

```bash
# Find the import script
find . -name "import_leads_to_production.py"

# Find the JSON file
find . -name "production_leads_export.json"

# Once found, run the import from the correct location
python import_leads_to_production.py production_leads_export.json
```

## If You Need to Pull Latest Code

Since Render auto-deploys from GitHub, your code should already be up to date. However, if you need to pull:

```bash
cd /opt/render/project/src
git status
git checkout main
git pull
```

## Testing the Script Locally First

To test before running on production:

```bash
# Just check if the script loads Django properly
python -c "import django; print('Django imported successfully')"

# Check if leads module exists
python -c "from leads.models import Lead; print('Lead model imported successfully')"
```

## What to Expect

When you run the import script, you should see output like:

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

## Troubleshooting

### Error: "No module named 'leads'"
**Solution:** Make sure you're in the correct directory with the Django project structure.

### Error: "File not found"
**Solution:** The JSON file might be in a different location. Use `find` command to locate it.

### Error: "Django settings not configured"
**Solution:** Make sure you're in the project root where the `crm_backend` directory is located.

