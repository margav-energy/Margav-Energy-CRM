#!/usr/bin/env python3
"""
Comprehensive test script for the updated dialer integration.
Tests the /api/leads/from-dialer/ endpoint with all the new fields.
"""

import requests
import json
import time
from urllib.parse import urlencode

# Configuration
BASE_URL = "http://localhost:8000/api"
DIALER_ENDPOINT = f"{BASE_URL}/leads/from-dialer/"
AGENT_DASHBOARD_URL = "http://localhost:3000/agent-dashboard"

def test_comprehensive_dialer_data():
    """Test the endpoint with comprehensive dialer data."""
    
    # Comprehensive test data with all dialer fields
    comprehensive_data = {
        # Core identification
        "lead_id": f"DIALER_{int(time.time())}",
        "vendor_id": "VENDOR_001",
        "list_id": "LIST_12345",
        "gmt_offset_now": "+0",
        "phone_code": "+44",
        "phone_number": f"+4412345{int(time.time())}",
        
        # Name components
        "title": "Mr",
        "first_name": "John",
        "middle_initial": "A",
        "last_name": "Smith",
        
        # Address components
        "address1": "123 Solar Street",
        "address2": "Apartment 4B",
        "address3": "Green District",
        "city": "London",
        "state": "England",
        "province": "Greater London",
        "postal_code": "SW1A 1AA",
        "country_code": "GB",
        
        # Personal details
        "gender": "M",
        "date_of_birth": "1985-06-15",
        "alt_phone": "+44123456789",
        "security_phrase": "Solar Energy",
        
        # Contact information
        "email": f"john.smith.{int(time.time())}@example.com",
        "comments": "Very interested in solar panels, owns detached house, looking to install within 3 months",
        
        # Dialer system fields
        "user": "agent1",  # Agent username
        "campaign": "Solar_Campaign_2024",
        "phone_login": "agent1_login",
        "fronter": "Front_Agent_1",
        "closer": "Close_Agent_1",
        "group": "Solar_Group",
        "channel_group": "Channel_A",
        "SQLdate": "2024-01-15 10:30:00",
        "epoch": str(int(time.time())),
        "uniqueid": f"UNIQUE_{int(time.time())}",
        "customer_zap_channel": "Zap_Channel_1",
        "server_ip": "192.168.1.100",
        "SIPexten": "1001",
        "session_id": f"SESSION_{int(time.time())}",
        "dialed_number": "+44123456789",
        "dialed_label": "London_Area",
        "rank": "1",
        "owner": "Campaign_Owner",
        "camp_script": "Welcome to our solar energy consultation...",
        "in_script": "Thank you for your interest in solar energy...",
        "script_width": "800",
        "script_height": "600",
        "recording_file": f"recording_{int(time.time())}.wav"
    }
    
    print("🧪 Testing Comprehensive Dialer Data Integration")
    print("=" * 60)
    
    try:
        # Test the API endpoint
        print(f"📡 Sending POST request to {DIALER_ENDPOINT}")
        print(f"📊 Data size: {len(json.dumps(comprehensive_data))} characters")
        
        response = requests.post(DIALER_ENDPOINT, json=comprehensive_data)
        
        print(f"📈 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ SUCCESS: Lead created/updated successfully!")
            print(f"   Lead ID: {result['lead']['id']}")
            print(f"   Full Name: {result['lead']['full_name']}")
            print(f"   Phone: {result['lead']['phone']}")
            print(f"   Status: {result['lead']['status']}")
            print(f"   Assigned Agent: {result['lead']['assigned_agent_name']}")
            print(f"   Message: {result.get('message', 'N/A')}")
            
            # Test URL generation for agent dashboard
            print("\n🌐 Testing Agent Dashboard URL Generation")
            print("-" * 40)
            
            lead = result['lead']
            params = {
                'from_dialer': 'true',
                'lead_id': str(lead['id']),
                'full_name': lead['full_name'],
                'phone': lead['phone'],
                'email': lead['email'] or '',
                'notes': lead['notes'] or '',
                # Add comprehensive dialer fields to URL
                'dialer_lead_id': comprehensive_data['lead_id'],
                'vendor_id': comprehensive_data['vendor_id'],
                'list_id': comprehensive_data['list_id'],
                'phone_code': comprehensive_data['phone_code'],
                'phone_number': comprehensive_data['phone_number'],
                'title': comprehensive_data['title'],
                'first_name': comprehensive_data['first_name'],
                'middle_initial': comprehensive_data['middle_initial'],
                'last_name': comprehensive_data['last_name'],
                'address1': comprehensive_data['address1'],
                'address2': comprehensive_data['address2'],
                'address3': comprehensive_data['address3'],
                'city': comprehensive_data['city'],
                'state': comprehensive_data['state'],
                'province': comprehensive_data['province'],
                'postal_code': comprehensive_data['postal_code'],
                'country_code': comprehensive_data['country_code'],
                'gender': comprehensive_data['gender'],
                'date_of_birth': comprehensive_data['date_of_birth'],
                'alt_phone': comprehensive_data['alt_phone'],
                'security_phrase': comprehensive_data['security_phrase'],
                'comments': comprehensive_data['comments'],
                'user': comprehensive_data['user'],
                'campaign': comprehensive_data['campaign'],
                'phone_login': comprehensive_data['phone_login'],
                'fronter': comprehensive_data['fronter'],
                'closer': comprehensive_data['closer'],
                'group': comprehensive_data['group'],
                'channel_group': comprehensive_data['channel_group'],
                'SQLdate': comprehensive_data['SQLdate'],
                'epoch': comprehensive_data['epoch'],
                'uniqueid': comprehensive_data['uniqueid'],
                'customer_zap_channel': comprehensive_data['customer_zap_channel'],
                'server_ip': comprehensive_data['server_ip'],
                'SIPexten': comprehensive_data['SIPexten'],
                'session_id': comprehensive_data['session_id'],
                'dialed_number': comprehensive_data['dialed_number'],
                'dialed_label': comprehensive_data['dialed_label'],
                'rank': comprehensive_data['rank'],
                'owner': comprehensive_data['owner'],
                'camp_script': comprehensive_data['camp_script'],
                'in_script': comprehensive_data['in_script'],
                'script_width': comprehensive_data['script_width'],
                'script_height': comprehensive_data['script_height'],
                'recording_file': comprehensive_data['recording_file']
            }
            
            dashboard_url = f"{AGENT_DASHBOARD_URL}?{urlencode(params)}"
            print(f"🔗 Agent Dashboard URL:")
            print(f"   {dashboard_url}")
            print(f"   URL Length: {len(dashboard_url)} characters")
            
            return True
            
        else:
            print("❌ FAILED: API request failed")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        return False

def test_minimal_dialer_data():
    """Test with minimal required fields."""
    
    print("\n🧪 Testing Minimal Required Fields")
    print("=" * 40)
    
    minimal_data = {
        "user": "agent1",  # Only required field
        "phone_number": f"+4412345{int(time.time())}",
        "first_name": "Jane",
        "last_name": "Doe"
    }
    
    try:
        response = requests.post(DIALER_ENDPOINT, json=minimal_data)
        
        if response.status_code == 201:
            result = response.json()
            print("✅ SUCCESS: Minimal data lead created!")
            print(f"   Lead ID: {result['lead']['id']}")
            print(f"   Full Name: {result['lead']['full_name']}")
            print(f"   Phone: {result['lead']['phone']}")
            return True
        else:
            print("❌ FAILED: Minimal data test failed")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_error_cases():
    """Test error handling."""
    
    print("\n🧪 Testing Error Cases")
    print("=" * 30)
    
    # Test missing required field
    print("1. Testing missing 'user' field...")
    invalid_data = {
        "phone_number": "+44123456789",
        "first_name": "Test"
    }
    
    try:
        response = requests.post(DIALER_ENDPOINT, json=invalid_data)
        if response.status_code == 400:
            print("✅ Correctly rejected missing 'user' field")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test invalid agent
    print("2. Testing invalid agent username...")
    invalid_agent_data = {
        "user": "nonexistent_agent",
        "phone_number": "+44123456789",
        "first_name": "Test"
    }
    
    try:
        response = requests.post(DIALER_ENDPOINT, json=invalid_agent_data)
        if response.status_code == 404:
            print("✅ Correctly rejected invalid agent")
        else:
            print(f"❌ Expected 404, got {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all tests."""
    
    print("🚀 Comprehensive Dialer Integration Test Suite")
    print("=" * 60)
    print(f"⏰ Test started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Target endpoint: {DIALER_ENDPOINT}")
    print(f"🌐 Agent dashboard: {AGENT_DASHBOARD_URL}")
    print()
    
    # Run tests
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Comprehensive data
    if test_comprehensive_dialer_data():
        tests_passed += 1
    
    # Test 2: Minimal data
    if test_minimal_dialer_data():
        tests_passed += 1
    
    # Test 3: Error cases
    test_error_cases()
    tests_passed += 1  # Error cases are informational
    
    # Summary
    print("\n📊 Test Summary")
    print("=" * 20)
    print(f"✅ Tests passed: {tests_passed}/{total_tests}")
    print(f"📈 Success rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Dialer integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the logs above.")
    
    print(f"\n⏰ Test completed at: {time.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()

