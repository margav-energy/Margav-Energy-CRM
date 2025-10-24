#!/usr/bin/env python3
"""
Test the upload function directly
"""

import os
import sys
import django
import json

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from leads.models import Lead
from leads.views import upload_json_leads
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

def test_upload_function():
    """Test the upload function directly"""
    
    print("Testing upload function directly...")
    
    # Create a test admin user
    admin_user, created = User.objects.get_or_create(
        username='test_admin',
        defaults={
            'email': 'admin@test.com',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        admin_user.set_password('test123')
        admin_user.save()
        print(f"+ Created test admin user: {admin_user.username}")
    else:
        print(f"* Test admin user already exists: {admin_user.username}")
    
    # Create test JSON data
    test_data = [
        {
            "full_name": "Test Lead 1",
            "phone": "1234567890",
            "email": "test1@example.com",
            "address1": "123 Test Street",
            "city": "Test City",
            "postal_code": "TE1 1ST",
            "notes": "Test lead 1",
            "status": "cold_call",
            "energy_bill_amount": None,
            "has_ev_charger": None,
            "day_night_rate": None,
            "has_previous_quotes": None,
            "previous_quotes_details": "",
            "assigned_agent": "Tyler",
            "appointment_date": None
        },
        {
            "full_name": "Test Lead 2",
            "phone": "0987654321",
            "email": "test2@example.com",
            "address1": "456 Test Avenue",
            "city": "Test City",
            "postal_code": "TE2 2ND",
            "notes": "Test lead 2",
            "status": "interested",
            "energy_bill_amount": None,
            "has_ev_charger": None,
            "day_night_rate": None,
            "has_previous_quotes": None,
            "previous_quotes_details": "",
            "assigned_agent": "Leia",
            "appointment_date": None
        }
    ]
    
    # Create a temporary JSON file
    test_file_path = 'test_upload_data.json'
    with open(test_file_path, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    try:
        # Create a mock request
        factory = RequestFactory()
        
        # Create a file-like object
        from django.core.files.uploadedfile import SimpleUploadedFile
        with open(test_file_path, 'rb') as f:
            uploaded_file = SimpleUploadedFile(
                name='test_upload_data.json',
                content=f.read(),
                content_type='application/json'
            )
        
        # Create the request
        request = factory.post('/api/leads/upload-json/', {'file': uploaded_file})
        request.user = admin_user
        
        # Call the upload function
        from rest_framework.response import Response
        response = upload_json_leads(request)
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data}")
        
        if response.status_code == 201:
            print("+ Upload test successful!")
            
            # Check if leads were created
            created_leads = Lead.objects.filter(full_name__startswith='Test Lead')
            print(f"+ Created {created_leads.count()} test leads")
            
            for lead in created_leads:
                print(f"  - {lead.full_name} (ID: {lead.id}) - Agent: {lead.assigned_agent}")
            
            # Clean up test leads
            created_leads.delete()
            print("+ Cleaned up test leads")
            
        else:
            print(f"- Upload test failed: {response.data}")
            
    except Exception as e:
        print(f"- Error during upload test: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

if __name__ == "__main__":
    test_upload_function()
"""
Test the upload function directly
"""

import os
import sys
import django
import json

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from leads.models import Lead
from leads.views import upload_json_leads
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

def test_upload_function():
    """Test the upload function directly"""
    
    print("Testing upload function directly...")
    
    # Create a test admin user
    admin_user, created = User.objects.get_or_create(
        username='test_admin',
        defaults={
            'email': 'admin@test.com',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        admin_user.set_password('test123')
        admin_user.save()
        print(f"+ Created test admin user: {admin_user.username}")
    else:
        print(f"* Test admin user already exists: {admin_user.username}")
    
    # Create test JSON data
    test_data = [
        {
            "full_name": "Test Lead 1",
            "phone": "1234567890",
            "email": "test1@example.com",
            "address1": "123 Test Street",
            "city": "Test City",
            "postal_code": "TE1 1ST",
            "notes": "Test lead 1",
            "status": "cold_call",
            "energy_bill_amount": None,
            "has_ev_charger": None,
            "day_night_rate": None,
            "has_previous_quotes": None,
            "previous_quotes_details": "",
            "assigned_agent": "Tyler",
            "appointment_date": None
        },
        {
            "full_name": "Test Lead 2",
            "phone": "0987654321",
            "email": "test2@example.com",
            "address1": "456 Test Avenue",
            "city": "Test City",
            "postal_code": "TE2 2ND",
            "notes": "Test lead 2",
            "status": "interested",
            "energy_bill_amount": None,
            "has_ev_charger": None,
            "day_night_rate": None,
            "has_previous_quotes": None,
            "previous_quotes_details": "",
            "assigned_agent": "Leia",
            "appointment_date": None
        }
    ]
    
    # Create a temporary JSON file
    test_file_path = 'test_upload_data.json'
    with open(test_file_path, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    try:
        # Create a mock request
        factory = RequestFactory()
        
        # Create a file-like object
        from django.core.files.uploadedfile import SimpleUploadedFile
        with open(test_file_path, 'rb') as f:
            uploaded_file = SimpleUploadedFile(
                name='test_upload_data.json',
                content=f.read(),
                content_type='application/json'
            )
        
        # Create the request
        request = factory.post('/api/leads/upload-json/', {'file': uploaded_file})
        request.user = admin_user
        
        # Call the upload function
        from rest_framework.response import Response
        response = upload_json_leads(request)
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data}")
        
        if response.status_code == 201:
            print("+ Upload test successful!")
            
            # Check if leads were created
            created_leads = Lead.objects.filter(full_name__startswith='Test Lead')
            print(f"+ Created {created_leads.count()} test leads")
            
            for lead in created_leads:
                print(f"  - {lead.full_name} (ID: {lead.id}) - Agent: {lead.assigned_agent}")
            
            # Clean up test leads
            created_leads.delete()
            print("+ Cleaned up test leads")
            
        else:
            print(f"- Upload test failed: {response.data}")
            
    except Exception as e:
        print(f"- Error during upload test: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

if __name__ == "__main__":
    test_upload_function()






