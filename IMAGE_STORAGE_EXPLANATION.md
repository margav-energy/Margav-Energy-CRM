# How Images Are Stored in the Backend

## Storage Method

Images from the CanvasserForm are stored in the PostgreSQL database as **Base64-encoded JSON strings**.

## Technical Details

### Database Field

In `backend/leads/models.py`, line 609-612:

```python
photos = models.JSONField(
    default=dict, 
    help_text='Base64 encoded photos (dict with keys: roof, frontRear, energyBill)'
)
```

### Data Structure

The images are stored as a JSON object with three keys:

```json
{
  "roof": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "frontRear": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "energyBill": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

### How It Works

1. **Capture**: Photos are captured using the device camera via HTML5 `<video>` and `<canvas>`
2. **Encode**: Images are converted to base64 using `canvas.toDataURL('image/jpeg', 0.8)`
3. **Store**: The base64 string is sent to the backend via API
4. **Database**: Django's JSONField stores the entire object as JSON in PostgreSQL

### In the Database

When you query the database, you'll see:

```sql
SELECT photos FROM leads_fieldsubmission WHERE id = 1;

-- Result:
{"roof": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...", 
 "frontRear": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...", 
 "energyBill": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."}
```

### Advantages

✅ **Simple**: No need for file storage infrastructure  
✅ **Contained**: All data in the database  
✅ **Easy to backup**: Database backup includes images  
✅ **Works offline**: Images stored locally in IndexedDB first  

### Disadvantages

❌ **Large database size**: Base64 increases size by ~33%  
❌ **Slower queries**: Large JSON fields can slow down queries  
❌ **Not optimized**: Not ideal for very large images  

### For Your Use Case

This approach works well for:
- Small to medium images (phone camera photos)
- Simple deployment (no S3/AWS needed)
- Quick development (no file upload infrastructure)

## Admin Panel Display

When viewing field submissions in the Django admin:

### Option 1: Display as Images

You can modify the admin to display photos:

```python
# backend/leads/admin.py
class FieldSubmissionAdmin(admin.ModelAdmin):
    def photo_roof(self, obj):
        if obj.photos.get('roof'):
            return format_html('<img src="{}" height="100"/>', obj.photos['roof'])
        return "No photo"
    photo_roof.short_description = 'Roof Photo'
    
    list_display = ['customer_name', 'photo_roof', 'property_type', 'status']
```

### Option 2: Open in New Window

```python
def photo_roof(self, obj):
    if obj.photos.get('roof'):
        return format_html('<a href="{}" target="_blank">View Roof Photo</a>', obj.photos['roof'])
    return "No photo"
```

## Alternative: File Storage (Future Enhancement)

If you want to optimize storage later, you could:

1. **Keep base64 for now** (current implementation)
2. **Add file storage later** using Django's FileField
3. **Create a migration** to move existing base64 images to files

Example using Django FileField:

```python
# New model fields:
roof_photo = models.ImageField(upload_to='field_submissions/roof/')
front_rear_photo = models.ImageField(upload_to='field_submissions/front-rear/')
energy_bill_photo = models.ImageField(upload_to='field_submissions/bills/')
```

Then update the API to:
1. Accept base64 from frontend
2. Convert to actual images on backend
3. Store in `/media/field_submissions/`
4. Return URLs instead of base64

## Current Implementation Summary

✅ **Working**: Photos stored as base64 JSON in database  
✅ **Simple**: No additional infrastructure needed  
✅ **Deployed**: Works on Render without any file storage setup  
⏳ **Future**: Can migrate to file storage if database grows too large  

## Viewing Images in Admin

When you access the admin panel at `https://crm.margav.energy/admin/`:

1. Go to "Field Submissions"
2. Click on any submission
3. The photos field will contain a JSON string
4. Copy the base64 data URL
5. Paste into any browser address bar to view the image

Or you can modify the admin to display the images directly (code above).

## Checking Database Size

To see how much space photos are using:

```sql
SELECT 
  pg_size_pretty(pg_column_size(photos)) as photo_size,
  customer_name,
  created_at
FROM leads_fieldsubmission
ORDER BY created_at DESC
LIMIT 10;
```

## Recommendation

For now, keep the base64 storage. It's:
- Simple to maintain
- No additional services needed
- Works out of the box on Render

If database grows to >1GB, consider migrating to S3 or Django's media storage.


