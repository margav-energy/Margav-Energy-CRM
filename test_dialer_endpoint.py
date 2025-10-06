#!/usr/bin/env python3
"""
Test script for the new dialer endpoint.
"""
import requests
import json

# Test data
test_data = {
    "full_name": "John Doe",
    "phone": "+1234567890",
    "email": "john.doe@example.com",
    "notes": "Client showed interest in solar panels",
    "agent_username": "agent1"  # This should be an existing agent username
}

# Test the endpoint
def test_dialer_endpoint():
    url = "http://localhost:8000/api/leads/from-dialer/"
    
    try:
        response = requests.post(url, json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("✅ Test passed! Lead created successfully.")
        else:
            print("❌ Test failed!")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_dialer_endpoint()

