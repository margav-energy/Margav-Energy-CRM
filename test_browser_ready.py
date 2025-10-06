#!/usr/bin/env python3
"""
Quick test with unique phone number for browser testing.
"""

import requests
import json
import time
import random

def test_unique_lead():
    """Test with a unique phone number."""
    
    # Generate unique phone number
    random_suffix = random.randint(10000, 99999)
    phone = f"+4412345{random_suffix}"
    
    dialer_data = {
        "full_name": f"Test User {random_suffix}",
        "phone": phone,
        "email": f"test{random_suffix}@example.com",
        "notes": "Interested in solar panels, ready for browser testing",
        "agent_username": "agent1"
    }
    
    print(f"🧪 Testing with unique phone: {phone}")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/leads/from-dialer/",
            json=dialer_data,
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            lead_id = result['lead']['id']
            print(f"✅ Lead created successfully!")
            print(f"   Lead ID: {lead_id}")
            print(f"   Name: {result['lead']['full_name']}")
            print(f"   Phone: {result['lead']['phone']}")
            print(f"   Status: {result['lead']['status']}")
            
            # Generate the redirect URL for browser testing
            params = {
                'full_name': dialer_data['full_name'],
                'phone': dialer_data['phone'],
                'email': dialer_data['email'],
                'notes': dialer_data['notes'],
                'from_dialer': 'true',
                'lead_id': str(lead_id)
            }
            
            from urllib.parse import urlencode
            redirect_url = f"http://localhost:3000/agent-dashboard?{urlencode(params)}"
            print(f"\n🌐 Browser Test URL:")
            print(f"   {redirect_url}")
            print(f"\n📋 Instructions:")
            print(f"   1. Copy the URL above")
            print(f"   2. Open it in your browser")
            print(f"   3. Login as agent1")
            print(f"   4. Verify the form opens with prepopulated data")
            
        else:
            print(f"❌ Failed to create lead: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error creating lead: {e}")

if __name__ == "__main__":
    test_unique_lead()

