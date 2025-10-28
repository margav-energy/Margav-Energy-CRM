# Missing Agents from Import

Based on the import logs, the following agent names were not found in the production database:

## Missing Agent Names:

1. **Leia** - 2 leads affected
2. **Caleb** - 40+ leads affected  
3. **Jake** - 15+ leads affected
4. **Elliot** - 1 lead affected
5. **Jane** - 1 lead affected

## Total Impact:
- **58 leads failed** due to missing agents
- **158 leads successfully created** with valid agents
- **1 lead successfully updated**

## Action Required:

You need to create these users in your production system with the exact usernames shown above. Here are the steps:

### Option 1: Create via Admin Dashboard
1. Go to your production admin panel
2. Navigate to Users
3. Create new users with these exact usernames:
   - `Leia`
   - `Caleb`
   - `Jake`
   - `Elliot`
   - `Jane`

### Option 2: Create via Django Shell
If you have shell access to your production server, you can create these users:

```python
from accounts.models import User
from django.contrib.auth import get_user_model

User = get_user_model()

# Create missing agents
agents = ['Leia', 'Caleb', 'Jake', 'Elliot', 'Jane']

for agent_name in agents:
    try:
        User.objects.get(username=agent_name)
        print(f"{agent_name} already exists")
    except User.DoesNotExist:
        # Create a new user
        User.objects.create_user(
            username=agent_name,
            email=f"{agent_name.lower()}@margav.energy",
            password="changeme123!",  # User should change this
            role='agent',
            first_name=agent_name
        )
        print(f"Created user: {agent_name}")
```

### Option 3: Use Default Agent
If you prefer to keep the current data as-is, the import script will use a default agent for these missing users.

## After Creating Users:

1. **Re-run the import** to import the failed leads:
   ```bash
   cd /opt/render/project/src
   python import_leads_to_production.py production_leads_export.json
   ```

2. **Or create a follow-up import script** that just imports the failed leads.

---

## Leads Affected by Agent

### Leads that need "Leia":
- Andrea Harper (MS003)
- Zaffar Iqbark (MS045)

### Leads that need "Caleb":
- Daniel Geeson (MS006)
- Jamie Walters (MS025)
- Josh Buchanan (MS018)
- Debbie Lloyd (MS020)
- Aaron Johnson (MS070)
- Saima Usman (MS074)
- Gary Newman (MS101)
- Chris Mccormick (MS102)
- Graham Savdilands (MS107)
- Saima Usman (MS074)
- And many more...

### Leads that need "Jake":
- Ian Mansell (MS021)
- Victoria Simpson (MS022)
- Umar Nazir (MS023)
- Joanne Thompson (MS026)
- Julian Smith (MS029)
- And more...

### Leads that need "Elliot":
- Alan Davies (MS110)

### Leads that need "Jane":
- Hello World (MS217)

---

## Recommendation:

Create all 5 users, then re-import the data to ensure all leads are properly assigned to their original agents.

