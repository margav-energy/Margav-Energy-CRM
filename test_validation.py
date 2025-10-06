#!/usr/bin/env python3
"""
Simple validation test for the dialer endpoint.
"""

import requests
import json

def test_validation():
    """Test various validation scenarios."""
    
    url = "http://localhost:8000/api/leads/from-dialer/"
    
    print("🧪 Testing Dialer Endpoint Validation")
    print("=" * 40)
    
    # Test 1: Valid request
    print("\n✅ Test 1: Valid Request")
    valid_data = {
        "full_name": "Test User",
        "phone": "+1234567899",
        "email": "test@example.com",
        "notes": "Test lead",
        "agent_username": "agent1"
    }
    
    try:
        response = requests.post(url, json=valid_data, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"   ✅ Success: Lead ID {result['lead']['id']}")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Missing required field
    print("\n❌ Test 2: Missing Required Field (full_name)")
    invalid_data = {
        "phone": "+1234567899",
        "agent_username": "agent1"
    }
    
    try:
        response = requests.post(url, json=invalid_data, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 400:
            result = response.json()
            print(f"   ✅ Correctly rejected: {result.get('error', 'Unknown error')}")
        else:
            print(f"   ❌ Unexpected status: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Invalid agent
    print("\n❌ Test 3: Invalid Agent Username")
    invalid_agent_data = {
        "full_name": "Test User",
        "phone": "+1234567899",
        "agent_username": "nonexistent_agent"
    }
    
    try:
        response = requests.post(url, json=invalid_agent_data, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 404:
            result = response.json()
            print(f"   ✅ Correctly rejected: {result.get('error', 'Unknown error')}")
        else:
            print(f"   ❌ Unexpected status: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n🎉 Validation tests completed!")

if __name__ == "__main__":
    test_validation()

