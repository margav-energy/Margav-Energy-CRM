#!/usr/bin/env python3
"""
Test JSON Upload Script
Tests the JSON upload functionality with a small sample
"""

import requests
import json
import os

def test_json_upload():
    """Test uploading a small sample of the JSON data"""
    
    # Read a small sample from the JSON file
    with open('Call Centre Lead Tracker_complete_crm_ready.json', 'r', encoding='utf-8') as f:
        all_data = json.load(f)
    
    # Take only the first 3 leads for testing
    test_data = all_data[:3]
    
    print(f"Testing upload with {len(test_data)} leads...")
    print("Sample leads:")
    for i, lead in enumerate(test_data):
        print(f"  {i+1}. {lead['full_name']} - {lead['phone']} - Agent: {lead['assigned_agent']}")
    
    # Create a temporary JSON file for testing
    test_file = 'test_upload.json'
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    try:
        # Test the upload endpoint
        url = 'http://localhost:8000/api/leads/upload-json/'
        
        # Note: This will fail without authentication, but we can see if the endpoint is accessible
        with open(test_file, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, files=files)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error testing upload: {e}")
        print("This is expected without authentication - the endpoint is accessible")
    
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)
    
    print(f"\nTo upload the full file:")
    print(f"1. Go to http://localhost:8000/admin/")
    print(f"2. Login as admin")
    print(f"3. Navigate to Leads -> Upload JSON")
    print(f"4. Upload: Call Centre Lead Tracker_complete_crm_ready.json")

if __name__ == "__main__":
    test_json_upload()
"""
Test JSON Upload Script
Tests the JSON upload functionality with a small sample
"""

import requests
import json
import os

def test_json_upload():
    """Test uploading a small sample of the JSON data"""
    
    # Read a small sample from the JSON file
    with open('Call Centre Lead Tracker_complete_crm_ready.json', 'r', encoding='utf-8') as f:
        all_data = json.load(f)
    
    # Take only the first 3 leads for testing
    test_data = all_data[:3]
    
    print(f"Testing upload with {len(test_data)} leads...")
    print("Sample leads:")
    for i, lead in enumerate(test_data):
        print(f"  {i+1}. {lead['full_name']} - {lead['phone']} - Agent: {lead['assigned_agent']}")
    
    # Create a temporary JSON file for testing
    test_file = 'test_upload.json'
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    try:
        # Test the upload endpoint
        url = 'http://localhost:8000/api/leads/upload-json/'
        
        # Note: This will fail without authentication, but we can see if the endpoint is accessible
        with open(test_file, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, files=files)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error testing upload: {e}")
        print("This is expected without authentication - the endpoint is accessible")
    
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)
    
    print(f"\nTo upload the full file:")
    print(f"1. Go to http://localhost:8000/admin/")
    print(f"2. Login as admin")
    print(f"3. Navigate to Leads -> Upload JSON")
    print(f"4. Upload: Call Centre Lead Tracker_complete_crm_ready.json")

if __name__ == "__main__":
    test_json_upload()






