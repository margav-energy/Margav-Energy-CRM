# 🚀 Final Instructions - Upload Your 217 Leads to Production

## Answer to Your Question

**You run the import on: WEB SERVICE** (the one serving your backend/frontend)
**NOT on:** Database service (that's just PostgreSQL)

The import script needs Django, which is installed on your web service.

---

## ⚡ Super Simple Method (3 Steps)

### Step 1: Go to Render Web Service

1. Visit: https://dashboard.render.com
2. Click on your **Web Service** (the app that serves your Django backend)
3. Click the **"Shell"** tab at the bottom

### Step 2: Upload JSON File

Upload `production_leads_export.json` to the Render shell:
- Look for "Upload File" button in the shell interface
- Or drag and drop the file

### Step 3: Run Import

In the Render shell, run:

```bash
python paste_into_render_shell.py
```

OR paste the entire content of `paste_into_render_shell.py` into the shell and run it.

---

## Alternative: Use Git Method

### Step 1: On Your Local Machine

```bash
git add production_leads_export.json import_leads_to_production.py
git commit -m "Add production lead import"
git push origin main
```

### Step 2: Wait for Render to Deploy
(This happens automatically)

### Step 3: Run in Render Shell

```bash
python import_leads_to_production.py production_leads_export.json
```

---

## 📊 Your Export is Ready

**File:** `production_leads_export.json`  
**Location:** In your project root  
**Size:** 178 KB  
**Leads:** 217

**Breakdown:**
- Qualified: 66
- Blow Out: 47
- Cold Call: 35
- No Contact: 28
- Qualifier Callback: 22
- Callback: 18
- Sent to Kelly: 1

---

## ✅ Data Safety - IMPORTANT!

**Your existing production data is SAFE:**

1. ✅ **ADD operation** - Only adds new leads
2. ✅ **UPDATE operation** - Updates matching leads (by phone number)
3. ❌ **NO DELETE** - Never deletes existing data
4. ❌ **NO OVERWRITE** - Doesn't replace your production database

The script checks by phone number:
- If lead with that phone exists → **Update it**
- If phone doesn't exist → **Create new lead**
- Your existing production leads remain untouched

---

## 🔍 Quick Check

After running the import, verify:

1. Go to your production site: https://crm.margav.energy
2. Login as admin
3. Dashboard should show 217 leads (or more if you had existing ones)

---

## Need Help?

If you get errors in Render shell, share the error message and I'll help fix it!

The most common issues:
- ❌ File not found → Upload the JSON file first
- ❌ Module not found → Run from the correct directory
- ❌ Database error → Check your database is running on Render

---

## Summary

**Where:** Web Service Shell (NOT database service)  
**What:** Upload JSON file → Run Python script  
**Time:** 2-3 minutes  
**Safety:** ✅ No data loss, only adds/updates


