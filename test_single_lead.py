#!/usr/bin/env python3
"""
Quick demo script to test the dialer endpoint with a single lead.
"""

import requests
import json

def test_single_lead():
    """Test creating a single lead via the dialer endpoint."""
    
    # Test data
    lead_data = {
        "full_name": "Demo User",
        "phone": "+1234567899",
        "email": "demo@example.com",
        "notes": "This is a test lead from the simulation",
        "agent_username": "agent1"  # Make sure this agent exists
    }
    
    url = "http://localhost:8000/api/leads/from-dialer/"
    
    print("🎭 Testing Dialer Endpoint")
    print("=" * 30)
    print(f"📡 URL: {url}")
    print(f"📋 Data: {json.dumps(lead_data, indent=2)}")
    print()
    
    try:
        print("📞 Sending request...")
        response = requests.post(url, json=lead_data, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            lead = result['lead']
            print("✅ SUCCESS!")
            print(f"   🆔 Lead ID: {lead['id']}")
            print(f"   👤 Name: {lead['full_name']}")
            print(f"   📱 Phone: {lead['phone']}")
            print(f"   👨‍💼 Agent: {lead['assigned_agent_name']}")
            print(f"   📊 Status: {lead['status']}")
            print()
            print("🎉 Lead created successfully!")
            print("💡 Check your agent dashboard to see the new lead!")
            
        else:
            print("❌ FAILED!")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR!")
        print("   Make sure Django server is running:")
        print("   cd backend && python manage.py runserver")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_single_lead()

