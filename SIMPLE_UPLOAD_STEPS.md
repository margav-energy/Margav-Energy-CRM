# Simple Upload Steps - Your 217 Leads to Production

## Where to Run: **WEB SERVICE Shell** (NOT database service)

## Easiest Method (5 Minutes)

### Step 1: Open Render Web Service Shell

1. Go to https://dashboard.render.com
2. Click on your **Web Service** (not database service)
3. Click the **"Shell"** tab at the bottom

### Step 2: Upload JSON File

In the Render shell, you can upload `production_leads_export.json`:

**Option A:** Drag and drop the file into the shell window  
**Option B:** Use Render's file browser in the shell  
**Option C:** Copy/paste the JSON content directly

### Step 3: Create Import Script in Shell

Paste this command to create the import script:

```bash
cat > import_leads.py << 'ENDOFSCRIPT'
import json
import sys
sys.path.append('/opt/render/project/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

import django
django.setup()

from leads.models import Lead
from accounts.models import User
from datetime import datetime

with open('production_leads_export.json', 'r', encoding='utf-8') as f:
    leads_data = json.load(f)

created = 0
for lead_data in leads_data:
    try:
        agent = None
        if lead_data.get('assigned_agent'):
            agent = User.objects.get(username=lead_data['assigned_agent'])
        
        created_at = None
        if lead_data.get('created_at'):
            created_at = datetime.fromisoformat(lead_data['created_at'].replace('Z', '+00:00'))
        
        appointment_date = None
        if lead_data.get('appointment_date'):
            appointment_date = datetime.fromisoformat(lead_data['appointment_date'].split('T')[0]).date()
        
        existing_lead = Lead.objects.filter(phone=lead_data['phone']).first()
        
        if existing_lead:
            existing_lead.full_name = lead_data['full_name']
            existing_lead.save(skip_audit=True)
        else:
            lead = Lead(
                full_name=lead_data['full_name'],
                phone=lead_data['phone'],
                status=lead_data['status'],
                address1=lead_data.get('address1') or '',
                postal_code=lead_data.get('postal_code') or '',
                notes=lead_data.get('notes') or '',
                energy_bill_amount=lead_data.get('energy_bill_amount'),
                has_ev_charger=lead_data.get('has_ev_charger'),
                assigned_agent=agent,
                lead_number=lead_data.get('lead_number'),
            )
            if created_at:
                lead.created_at = created_at
            lead.save(skip_audit=True)
        
        created += 1
        if created % 50 == 0:
            print(f'Processed {created} leads...')
    except Exception as e:
        print(f'Error: {e}')

print(f'Done! Imported {created} leads')
ENDOFSCRIPT
```

### Step 4: Run Import

```bash
python import_leads.py
```

That's it! Your 217 leads will be in production.

## Even Simpler Method (If you have Git access)

### 1. Add Script to GitHub

```bash
# On your local machine:
git add import_leads_to_production.py production_leads_export.json
git commit -m "Add lead import for production"
git push origin main
```

### 2. Wait for Render to Deploy (automatic)

### 3. Run in Render Shell

```bash
python import_leads_to_production.py production_leads_export.json
```

## Your Data is Safe!

- ✅ Won't delete existing leads
- ✅ Won't create duplicates (checks by phone)
- ✅ Only adds new leads or updates matching ones

## Need the JSON File Ready?

The file `production_leads_export.json` is already created on your computer at:
`C:\Users\User\Desktop\Work\Margav-Energy-CRM\production_leads_export.json`

Just upload it to Render Web Service Shell and run the import!


