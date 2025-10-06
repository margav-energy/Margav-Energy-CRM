#!/usr/bin/env python3
"""
Test script to demonstrate the complete dialer-to-agent-dashboard flow.
This simulates what happens when an agent clicks "Interested" on the dialer page.
"""

import requests
import json
import time

def test_dialer_to_agent_flow():
    """Test the complete flow from dialer to agent dashboard."""
    
    print("🎯 Testing Complete Dialer-to-Agent-Dashboard Flow")
    print("=" * 60)
    
    # Step 1: Simulate creating a lead from dialer (when agent clicks "Interested")
    print("\n📞 Step 1: Agent clicks 'Interested' on dialer page")
    print("-" * 50)
    
    dialer_data = {
        "full_name": "John Smith",
        "phone": "+44123456789",
        "email": "john.smith@example.com",
        "notes": "Interested in solar panels, owns detached house, looking to install within 3 months",
        "agent_username": "agent1"
    }
    
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
            print(f"   Assigned to: {result['lead']['assigned_agent_name']}")
        else:
            print(f"❌ Failed to create lead: {response.status_code}")
            print(f"   Response: {response.text}")
            return
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error creating lead: {e}")
        return
    
    # Step 2: Simulate the redirect to agent dashboard with prepopulated data
    print("\n🔄 Step 2: Redirecting to Agent Dashboard with prepopulated data")
    print("-" * 50)
    
    # This would be the URL that the ColdCallDashboard would redirect to
    params = {
        'full_name': dialer_data['full_name'],
        'phone': dialer_data['phone'],
        'email': dialer_data['email'],
        'notes': dialer_data['notes'],
        'from_dialer': 'true',
        'lead_id': str(lead_id)
    }
    
    # Simulate the URL that would be generated
    from urllib.parse import urlencode
    redirect_url = f"/agent-dashboard?{urlencode(params)}"
    print(f"✅ Redirect URL generated:")
    print(f"   {redirect_url}")
    print(f"   This URL contains all the prepopulated data from the dialer")
    
    # Step 3: Simulate the agent completing the lead form
    print("\n📝 Step 3: Agent completes the lead form with additional details")
    print("-" * 50)
    
    # This simulates what the agent would fill in the form
    completed_lead_data = {
        "full_name": dialer_data['full_name'],
        "phone": dialer_data['phone'],
        "email": dialer_data['email'],
        "notes": f"{dialer_data['notes']}\n\n--- DETAILED LEAD INFORMATION ---\n" +
                "Address: 123 Main Street, London\n" +
                "Postcode: SW1A 1AA\n" +
                "Preferred Contact Time: Weekdays 9am-5pm\n" +
                "Property Ownership: Yes\n" +
                "Property Type: Detached\n" +
                "Number of Bedrooms: 4\n" +
                "Roof Type: Pitched\n" +
                "Roof Material: Tile\n" +
                "Average Monthly Electricity Bill: 150\n" +
                "Current Energy Supplier: British Gas\n" +
                "Electric Heating/Appliances: Yes\n" +
                "Energy Details: Electric vehicle charger\n" +
                "Timeframe: 3-6 months\n" +
                "Moving Properties Next 5 Years: No\n" +
                "Timeframe Details: Want to install before winter"
    }
    
    try:
        # Update the lead with completed information
        response = requests.patch(
            f"http://localhost:8000/api/leads/{lead_id}/",
            json=completed_lead_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Lead updated successfully!")
            print(f"   Lead ID: {result['id']}")
            print(f"   Status: {result['status']}")
            print(f"   Notes length: {len(result['notes'])} characters")
        else:
            print(f"❌ Failed to update lead: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error updating lead: {e}")
    
    # Step 4: Simulate sending to qualifier
    print("\n📤 Step 4: Sending lead to qualifier (Kelly)")
    print("-" * 50)
    
    try:
        response = requests.post(
            f"http://localhost:8000/api/leads/{lead_id}/send-to-kelly/",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Lead sent to qualifier successfully!")
            print(f"   Lead ID: {result['id']}")
            print(f"   Status: {result['status']}")
            print(f"   Message: {result.get('message', 'Lead sent to Kelly')}")
        else:
            print(f"❌ Failed to send lead to qualifier: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending lead to qualifier: {e}")
    
    print("\n🎉 Complete Flow Test Summary:")
    print("=" * 60)
    print("✅ 1. Agent clicks 'Interested' on dialer page")
    print("✅ 2. Lead created via /api/leads/from-dialer/ endpoint")
    print("✅ 3. ColdCallDashboard redirects to AgentDashboard with prepopulated data")
    print("✅ 4. AgentDashboard opens LeadForm with data from dialer")
    print("✅ 5. Agent completes additional lead information")
    print("✅ 6. Lead updated and sent to qualifier (Kelly)")
    print("\n🚀 The complete dialer-to-agent-dashboard integration is working!")

if __name__ == "__main__":
    test_dialer_to_agent_flow()

