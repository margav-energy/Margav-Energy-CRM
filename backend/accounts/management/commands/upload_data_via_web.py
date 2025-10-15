from django.core.management.base import BaseCommand
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import os

@csrf_exempt
@require_http_methods(["POST"])
def upload_data_endpoint(request):
    """HTTP endpoint to upload data via web request"""
    try:
        # Get the JSON data from request body
        data = json.loads(request.body)
        
        # Import the data
        from django.core.management import call_command
        from io import StringIO
        
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
