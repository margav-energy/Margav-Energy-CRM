# Soft Delete System Setup Guide

## 🛡️ **30-Day Safe Deletion System**

This system prevents data loss by implementing soft deletion with a 30-day retention period. Objects are marked as deleted but remain in the database for 30 days before being permanently removed.

## 🚀 **Quick Setup**

### **Step 1: Run Migrations**
```bash
cd backend
python manage.py migrate
```

### **Step 2: Test the System**
```bash
# Create a test lead and soft delete it
python manage.py shell -c "
from leads.models import Lead
from django.contrib.auth import get_user_model
User = get_user_model()

# Create a test lead
lead = Lead.objects.create(
    full_name='Test Lead',
    phone='555-1234',
    email='test@example.com'
)
print(f'Created lead: {lead.full_name}')

# Soft delete it
lead.soft_delete()
print(f'Lead soft deleted: {lead.is_deleted}')

# Check it's not in normal queries
print(f'Active leads: {Lead.objects.count()}')
print(f'All leads (including deleted): {Lead.all_objects.count()}')
"
```

## 📋 **Features**

### **✅ Soft Delete Protection**
- Objects are marked as deleted but not removed
- 30-day retention period before permanent deletion
- Full audit trail of who deleted what and when
- Reason tracking for deletions

### **✅ Admin Interface**
- View all objects including deleted ones
- Restore deleted objects
- See deletion status and expiration
- Bulk operations support soft delete

### **✅ Management Commands**
- Clean up expired objects
- List deleted objects
- Restore specific objects
- Statistics and monitoring

### **✅ Automatic Cleanup**
- Scheduled cleanup of expired objects
- Configurable retention period
- Safe deletion with logging

## 🔧 **Usage Examples**

### **Soft Delete a Lead**
```python
from leads.models import Lead
from django.contrib.auth import get_user_model

User = get_user_model()
lead = Lead.objects.get(pk=1)
user = User.objects.get(username='admin')

# Soft delete with reason
lead.soft_delete(deleted_by=user, reason="Customer requested removal")
```

### **Restore a Deleted Lead**
```python
# Find deleted lead
deleted_lead = Lead.objects.only_deleted().get(pk=1)

# Restore it
deleted_lead.restore(restored_by=user)
```

### **Check Expiration Status**
```python
lead = Lead.objects.only_deleted().get(pk=1)
if lead.is_expired():
    print("This lead has been deleted for 30+ days and can be permanently removed")
else:
    days_left = 30 - (timezone.now() - lead.deleted_at).days
    print(f"This lead will expire in {days_left} days")
```

## 🛠️ **Management Commands**

### **View Statistics**
```bash
python manage.py manage_soft_delete --stats
```

### **List Deleted Objects**
```bash
python manage.py manage_soft_delete --list-deleted
```

### **Clean Up Expired Objects**
```bash
python manage.py cleanup_expired_objects
```

### **Dry Run (See What Would Be Deleted)**
```bash
python manage.py cleanup_expired_objects --dry-run
```

### **Force Cleanup (Delete All Soft Deleted)**
```bash
python manage.py manage_soft_delete --force-cleanup
```

## 📊 **Admin Interface**

### **Access Soft Delete Management**
1. Go to Django Admin: http://localhost:8000/admin/
2. Navigate to "Leads" or "Callbacks"
3. You'll see all objects including deleted ones
4. Deleted objects show status and expiration info

### **Restore Objects**
1. Find the deleted object in the admin
2. Click "Restore" button
3. Object will be restored to active status

## ⏰ **Automated Cleanup**

### **Set Up Daily Cleanup (Windows Task Scheduler)**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "Daily"
4. Set action to start program: `python`
5. Add arguments: `manage.py cleanup_expired_objects`
6. Set start directory to your backend folder

### **Set Up Daily Cleanup (Linux Cron)**
```bash
# Add to crontab
0 2 * * * cd /path/to/your/backend && python manage.py cleanup_expired_objects
```

## 🔍 **Monitoring**

### **Check System Status**
```bash
# View statistics
python manage.py manage_soft_delete --stats

# List recent deletions
python manage.py manage_soft_delete --list-deleted
```

### **Log Files**
The system logs all soft delete operations:
- Object deletions
- Restorations
- Permanent deletions
- Cleanup operations

## 🚨 **Emergency Recovery**

### **If You Accidentally Delete Important Data**
1. **Don't panic!** Data is still in the database
2. Go to admin interface
3. Find the deleted object
4. Click "Restore" button
5. Object will be immediately restored

### **Bulk Restore**
```python
# Restore all deleted leads
from leads.models import Lead
deleted_leads = Lead.objects.only_deleted()
for lead in deleted_leads:
    lead.restore()
```

## 📈 **Benefits**

### **🛡️ Data Protection**
- No more accidental data loss
- 30-day safety net
- Full audit trail
- Easy recovery

### **🔍 Transparency**
- See who deleted what
- Track deletion reasons
- Monitor system health
- Full visibility

### **⚡ Performance**
- Normal queries only see active objects
- Deleted objects don't affect performance
- Automatic cleanup prevents database bloat
- Optimized queries

## 🎯 **Best Practices**

1. **Always use soft delete** - Never use hard delete in production
2. **Set up automated cleanup** - Run daily cleanup tasks
3. **Monitor the system** - Check statistics regularly
4. **Train your team** - Make sure everyone knows about the restore feature
5. **Document deletions** - Use the reason field to track why objects were deleted

## 🚀 **Next Steps**

1. **Run the migration** to add soft delete fields
2. **Test the system** with a few sample objects
3. **Set up automated cleanup** for your environment
4. **Train your team** on the new system
5. **Monitor and maintain** the system

Your data is now protected with a 30-day safety net! 🎉
