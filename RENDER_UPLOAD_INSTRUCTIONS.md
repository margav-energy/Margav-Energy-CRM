# Where to Run the Import - Render Services Explained

## Your Render Setup

On Render, you likely have:

1. **Web Service** - Runs your Django backend (the app)
   - This is where you run Django commands
   - This is where your `manage.py` lives
   - This connects to your database

2. **Database Service** - PostgreSQL database
   - Just the database
   - Don't run Django commands here
   - Only use for direct SQL queries if needed

## ✅ Run the Import on: **WEB SERVICE**

The import script uses Django ORM (Django's database layer), so it MUST run on your web service where Django is installed.

## Step-by-Step Instructions

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Find your **Web Service** (the one that runs Django/backend)

### Step 2: Open Shell
1. Click on your web service
2. Look at the bottom of the page for **"Shell"** tab
3. Click on "Shell" tab

### Step 3: Upload Files

You have two options:

#### Option A: Upload via Shell Interface (Easiest)
1. In the Render shell window, look for file upload button
2. Upload these files:
   - `production_leads_export.json`
   - `import_leads_to_production.py`

#### Option B: Use Git to Deploy
1. Add both files to your repository
2. Push to GitHub/GitLab
3. Render will deploy them automatically
4. Then run the import command

#### Option C: Create Files Directly in Shell
1. In the shell, create the files:
```bash
# First, let me show you how to create the import script in the shell
# (We'll use a simpler method)
```

### Step 4: Run Import Command

Once files are in the web service, run:

```bash
python import_leads_to_production.py production_leads_export.json
```

Or if the files are in a subdirectory:

```bash
cd /path/to/your/app
python import_leads_to_production.py production_leads_export.json
```

## Alternative: Use Django Management Command

If uploading files is difficult, you can create a Django management command instead:

### On Your Local Machine:

1. Create the command file:

File: `backend/leads/management/commands/import_leads.py`

```python
from django.core.management.base import BaseCommand
from leads.models import Lead
from accounts.models import User
import json
from datetime import datetime

class Command(BaseCommand):
    help = 'Import leads from JSON file'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to JSON file')

    def handle(self, *args, **options):
        json_file = options['json_file']
        
        with open(json_file, 'r', encoding='utf-8') as f:
            leads_data = json.load(f)
        
        created = 0
        
        for lead_data in leads_data:
            try:
                # Get or create agent
                agent = None
                if lead_data.get('assigned_agent'):
                    agent = User.objects.get(username=lead_data['assigned_agent'])
                
                # Parse dates
                created_at = None
                if lead_data.get('created_at'):
                    created_at = datetime.fromisoformat(lead_data['created_at'].replace('Z', '+00:00'))
                
                appointment_date = None
                if lead_data.get('appointment_date'):
                    appointment_date = datetime.fromisoformat(lead_data['appointment_date'].split('T')[0]).date()
                
                # Check if exists
                existing_lead = Lead.objects.filter(phone=lead_data['phone']).first()
                
                if existing_lead:
                    # Update
                    existing_lead.full_name = lead_data['full_name']
                    existing_lead.status = lead_data['status']
                    existing_lead.assigned_agent = agent
                    existing_lead.save(skip_audit=True)
                else:
                    # Create
                    lead = Lead.objects.create(
                        full_name=lead_data['full_name'],
                        phone=lead_data['phone'],
                        status=lead_data['status'],
                        assigned_agent=agent
                    )
                    if created_at:
                        lead.created_at = created_at
                        lead.save(skip_audit=True)
                
                created += 1
                
                if created % 50 == 0:
                    self.stdout.write(f'Processed {created} leads...')
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Imported {created} leads!'))
```

2. Add both files to your Git repository
3. Push to GitHub
4. Render will deploy them

Then on Render web service shell:
```bash
# Upload the JSON file first, then:
python manage.py import_leads production_leads_export.json
```

## Quickest Method (Recommended)

**Since you already have the database on Render, here's the FASTEST way:**

### Use Render's PostgreSQL Connection

1. **Get your database connection string**:
   - Go to your Database service on Render
   - Click "Info" tab
   - Copy the "Internal Database URL"

2. **Connect from your local machine**:
```bash
# Use psql or pgAdmin to connect to Render database
psql "your-render-database-url"

# Or use pgAdmin/DBeaver with the connection string
```

3. **Import directly** (if you have direct database access):
```bash
# From your local machine with Render DB access:
cd backend
python import_leads_to_production.py production_leads_export.json
# (But connect to Render's database URL)
```

## The Easiest Method (For You)

**Best approach for your situation:**

1. **Commit and push the import script** to your GitHub repo
2. **Deploy to Render** (automatic on push)
3. **Upload JSON file via Render Shell**:
   - Go to Web Service → Shell tab
   - Look for file upload button
   - Upload `production_leads_export.json`
4. **Run in shell**:
```bash
python import_leads_to_production.py production_leads_export.json
```

## Summary

**Run on:** Web Service (Django backend)  
**Not on:** Database Service (just PostgreSQL)  
**Files needed:** Both `production_leads_export.json` and `import_leads_to_production.py`  
**Command:** `python import_leads_to_production.py production_leads_export.json`


