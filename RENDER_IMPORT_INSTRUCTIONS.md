# Render Lead Import Instructions

## Problem
The import script is failing because it can't find agents with names like "Leia", "Caleb", "Jake", "Elliot" - but these agents exist in your production database with usernames like "LeiaG", "CalebG", "JakeR", "Elliott".

## Solution

### Step 1: Connect to Render Shell

```bash
# From your local terminal, use Render CLI or web console
# Or SSH into the Render instance
```

### Step 2: Check Existing Agents

Run this in the Render shell to see what agents exist:

```bash
cd /opt/render/project/src/backend
python manage.py shell
```

Then in the Django shell:

```python
from accounts.models import User

# List all users with their roles
agents = User.objects.filter(role__in=['agent', 'canvasser'])
for agent in agents:
    print(f"Username: {agent.username}, Name: {agent.first_name}, Role: {agent.role}")

# Exit the shell
exit()
```

### Step 3: Update the Import Script

The import script has been updated with the correct mapping. You need to:
1. Pull the latest changes from GitHub
2. Push the updated script to GitHub
3. The import script will map the agent names correctly

### Step 4: Run the Import

```bash
cd /opt/render/project/src
python import_leads_to_production.py production_leads_export.json
```

## Troubleshooting

### If the script still shows "Agent not found"

Check the actual usernames in your database:

```python
from accounts.models import User

# List all users
all_users = User.objects.all()
for user in all_users:
    print(f"ID: {user.id}, Username: {user.username}, First Name: {user.first_name}, Role: {user.role}")
```

### Expected Agent Names

Based on your information:
- `LeiaG` (not "Leia")
- `CalebG` (not "Caleb")  
- `JakeR` (not "Jake")
- `Elliott` (not "Elliot")

The mapping has been added to handle this. Just ensure you pull the latest code with the mapping.

### Commands to Run on Render

1. **Pull latest code:**
   ```bash
   cd /opt/render/project/src
   git pull origin main
   ```

2. **Run the import:**
   ```bash
   python import_leads_to_production.py production_leads_export.json
   ```

## Notes

- The script now handles duplicates - it updates existing leads instead of creating duplicates
- The script uses a default agent if the specified agent is not found
- Check the output for warnings about missing agents


