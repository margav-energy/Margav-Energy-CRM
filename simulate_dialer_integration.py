#!/usr/bin/env python3
"""
Simulation script to test the dialer integration with the CRM system.
This script simulates multiple agents receiving leads from a dialer system.
"""

import requests
import json
import time
import random
from datetime import datetime
from typing import List, Dict

# Configuration
API_BASE_URL = "http://localhost:8000/api"
SIMULATION_DURATION = 60  # seconds
LEAD_INTERVAL = 5  # seconds between new leads

# Sample data for simulation
SAMPLE_LEADS = [
    {
        "full_name": "John Smith",
        "phone": "+1234567890",
        "email": "john.smith@email.com",
        "notes": "Interested in solar panels for residential property",
        "agent_username": "agent1"
    },
    {
        "full_name": "Sarah Johnson",
        "phone": "+1234567891",
        "email": "sarah.j@email.com",
        "notes": "Looking for energy efficiency solutions",
        "agent_username": "agent2"
    },
    {
        "full_name": "Mike Wilson",
        "phone": "+1234567892",
        "email": "mike.wilson@email.com",
        "notes": "Commercial property owner interested in solar",
        "agent_username": "agent1"
    },
    {
        "full_name": "Emily Davis",
        "phone": "+1234567893",
        "email": "emily.davis@email.com",
        "notes": "Homeowner with high electricity bills",
        "agent_username": "agent2"
    },
    {
        "full_name": "Robert Brown",
        "phone": "+1234567894",
        "email": "robert.brown@email.com",
        "notes": "Interested in battery storage solutions",
        "agent_username": "agent1"
    },
    {
        "full_name": "Lisa Anderson",
        "phone": "+1234567895",
        "email": "lisa.anderson@email.com",
        "notes": "New homeowner looking for energy solutions",
        "agent_username": "agent2"
    },
    {
        "full_name": "David Miller",
        "phone": "+1234567896",
        "email": "david.miller@email.com",
        "notes": "Retirement planning - wants to reduce energy costs",
        "agent_username": "agent1"
    },
    {
        "full_name": "Jennifer Taylor",
        "phone": "+1234567897",
        "email": "jennifer.taylor@email.com",
        "notes": "Environmental conscious homeowner",
        "agent_username": "agent2"
    }
]

class DialerSimulator:
    def __init__(self):
        self.endpoint_url = f"{API_BASE_URL}/leads/from-dialer/"
        self.created_leads = []
        self.errors = []
        
    def check_server_connection(self) -> bool:
        """Check if the Django server is running."""
        try:
            response = requests.get(f"{API_BASE_URL}/leads/", timeout=5)
            return response.status_code in [200, 401]  # 401 is OK (auth required)
        except requests.exceptions.ConnectionError:
            return False
    
    def create_lead(self, lead_data: Dict) -> Dict:
        """Create a lead via the dialer endpoint."""
        try:
            print(f"📞 Dialer: Creating lead for {lead_data['full_name']}...")
            
            response = requests.post(
                self.endpoint_url,
                json=lead_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                lead = result['lead']
                print(f"✅ Lead created successfully!")
                print(f"   📋 Lead ID: {lead['id']}")
                print(f"   👤 Name: {lead['full_name']}")
                print(f"   📱 Phone: {lead['phone']}")
                print(f"   👨‍💼 Agent: {lead['assigned_agent_name']} ({lead['assigned_agent_username']})")
                print(f"   📊 Status: {lead['status']}")
                print(f"   ⏰ Created: {lead['created_at']}")
                print()
                
                self.created_leads.append(lead)
                return {'success': True, 'lead': lead}
            else:
                error_msg = f"Failed to create lead: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('error', 'Unknown error')}"
                except:
                    error_msg += f" - {response.text}"
                
                print(f"❌ {error_msg}")
                self.errors.append({'lead_data': lead_data, 'error': error_msg})
                return {'success': False, 'error': error_msg}
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error: {str(e)}"
            print(f"❌ {error_msg}")
            self.errors.append({'lead_data': lead_data, 'error': error_msg})
            return {'success': False, 'error': error_msg}
    
    def simulate_dialer_session(self, duration: int = SIMULATION_DURATION):
        """Simulate a dialer session creating leads over time."""
        print("🚀 Starting Dialer Simulation")
        print("=" * 50)
        print(f"⏱️  Duration: {duration} seconds")
        print(f"📊 Lead interval: {LEAD_INTERVAL} seconds")
        print(f"🎯 Target endpoint: {self.endpoint_url}")
        print()
        
        if not self.check_server_connection():
            print("❌ Cannot connect to Django server!")
            print("   Make sure the Django development server is running:")
            print("   cd backend && python manage.py runserver")
            return
        
        print("✅ Server connection confirmed")
        print()
        
        start_time = time.time()
        lead_count = 0
        
        while time.time() - start_time < duration:
            # Select a random lead from our sample data
            lead_data = random.choice(SAMPLE_LEADS).copy()
            
            # Add some randomization to make it more realistic
            lead_data['phone'] = f"+1234567{random.randint(890, 999)}"
            lead_data['notes'] += f" (Simulated at {datetime.now().strftime('%H:%M:%S')})"
            
            # Create the lead
            result = self.create_lead(lead_data)
            lead_count += 1
            
            # Wait before creating the next lead
            if time.time() - start_time < duration:
                print(f"⏳ Waiting {LEAD_INTERVAL} seconds before next lead...")
                time.sleep(LEAD_INTERVAL)
        
        # Print simulation summary
        self.print_simulation_summary(lead_count)
    
    def print_simulation_summary(self, total_attempts: int):
        """Print a summary of the simulation results."""
        print("\n" + "=" * 50)
        print("📊 SIMULATION SUMMARY")
        print("=" * 50)
        print(f"🎯 Total lead creation attempts: {total_attempts}")
        print(f"✅ Successful lead creations: {len(self.created_leads)}")
        print(f"❌ Failed lead creations: {len(self.errors)}")
        print(f"📈 Success rate: {(len(self.created_leads) / total_attempts * 100):.1f}%")
        
        if self.created_leads:
            print(f"\n📋 Created Leads:")
            for i, lead in enumerate(self.created_leads, 1):
                print(f"   {i}. {lead['full_name']} → {lead['assigned_agent_name']} (ID: {lead['id']})")
        
        if self.errors:
            print(f"\n❌ Errors:")
            for i, error in enumerate(self.errors, 1):
                print(f"   {i}. {error['lead_data']['full_name']}: {error['error']}")
        
        print(f"\n🎉 Simulation completed!")
        print(f"💡 Check your agent dashboards to see the new leads appear!")

def test_endpoint_validation():
    """Test the endpoint with various validation scenarios."""
    print("🧪 Testing Endpoint Validation")
    print("=" * 30)
    
    simulator = DialerSimulator()
    
    # Test cases
    test_cases = [
        {
            "name": "Valid lead data",
            "data": {
                "full_name": "Test User",
                "phone": "+1234567899",
                "email": "test@example.com",
                "notes": "Test lead",
                "agent_username": "agent1"
            },
            "expected": "success"
        },
        {
            "name": "Missing required field (full_name)",
            "data": {
                "phone": "+1234567899",
                "agent_username": "agent1"
            },
            "expected": "error"
        },
        {
            "name": "Missing required field (phone)",
            "data": {
                "full_name": "Test User",
                "agent_username": "agent1"
            },
            "expected": "error"
        },
        {
            "name": "Missing required field (agent_username)",
            "data": {
                "full_name": "Test User",
                "phone": "+1234567899"
            },
            "expected": "error"
        },
        {
            "name": "Invalid agent username",
            "data": {
                "full_name": "Test User",
                "phone": "+1234567899",
                "agent_username": "nonexistent_agent"
            },
            "expected": "error"
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        result = simulator.create_lead(test_case['data'])
        
        if test_case['expected'] == 'success' and result['success']:
            print("✅ Test passed")
        elif test_case['expected'] == 'error' and not result['success']:
            print("✅ Test passed (expected error)")
        else:
            print("❌ Test failed")

def main():
    """Main function to run the simulation."""
    print("🎭 Dialer Integration Simulation")
    print("=" * 40)
    print("This script simulates a dialer system sending leads to the CRM.")
    print("Make sure:")
    print("1. Django server is running (python manage.py runserver)")
    print("2. You have agents with usernames 'agent1' and 'agent2'")
    print("3. Agent dashboards are open to see real-time updates")
    print()
    
    choice = input("Choose simulation type:\n1. Full simulation (creates leads over time)\n2. Validation tests only\n3. Both\nEnter choice (1-3): ").strip()
    
    if choice in ['1', '3']:
        simulator = DialerSimulator()
        simulator.simulate_dialer_session()
    
    if choice in ['2', '3']:
        test_endpoint_validation()
    
    print("\n🎯 Next Steps:")
    print("1. Open agent dashboards in your browser")
    print("2. Watch for new leads appearing every 2 seconds")
    print("3. Check toast notifications for new leads")
    print("4. Verify leads are assigned to correct agents")

if __name__ == "__main__":
    main()

