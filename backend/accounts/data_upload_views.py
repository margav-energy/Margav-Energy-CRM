from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.management import call_command
import json
import os

@csrf_exempt
@require_http_methods(["POST"])
def upload_data(request):
    """HTTP endpoint to upload data via web request"""
    try:
        # Get the JSON data from request body
        data = json.loads(request.body)
        
        # Create a temporary file with the data
        temp_file = 'temp_data_import.json'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f)
        
        # Import the data
        call_command('loaddata', temp_file, verbosity=0)
        
        # Clean up
        os.remove(temp_file)
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully imported {len(data)} records'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@require_http_methods(["GET"])
def upload_status(request):
    """Check if data has been uploaded"""
    from django.contrib.auth import get_user_model
    from leads.models import Lead
    
    User = get_user_model()
    
    user_count = User.objects.count()
    lead_count = Lead.objects.count()
    
    return JsonResponse({
        'users': user_count,
        'leads': lead_count,
        'has_data': user_count > 1 or lead_count > 0
    })
