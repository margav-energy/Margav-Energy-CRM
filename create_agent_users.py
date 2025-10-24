#!/usr/bin/env python3
"""
Create Agent Users for Call Centre Lead Tracker
Creates users for all agents found in the Excel file
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from accounts.models import User

def create_agent_users():
    """Create users for all agents found in the Excel file"""
    
    # Clean agent names (remove trailing spaces and duplicates)
    agent_names = [
        'Caleb', 'Dani', 'Elliot', 'Elliott', 'Imani', 
        'Jake', 'Joanna', 'Leia', 'Libby', 'Tim', 'Tyler'
    ]
    
    created_users = []
    existing_users = []
    
    print("Creating agent users for Call Centre Lead Tracker...")
    print("=" * 50)
    
    for agent_name in agent_names:
        # Check if user already exists
        if User.objects.filter(username=agent_name).exists():
            print(f"* User '{agent_name}' already exists")
            existing_users.append(agent_name)
            continue
        
        try:
            # Create user
            user = User.objects.create_user(
                username=agent_name,
                email=f"{agent_name.lower()}@margavenergy.com",
                password=f"{agent_name.lower()}123",  # Default password
                first_name=agent_name,
                role='agent'  # Set role as agent
            )
            
            # User profile is already created with the user
            
            created_users.append(agent_name)
            print(f"+ Created user '{agent_name}' (ID: {user.id})")
            
        except Exception as e:
            print(f"- Error creating user '{agent_name}': {e}")
    
    print("\n" + "=" * 50)
    print(f"Summary:")
    print(f"  Created: {len(created_users)} users")
    print(f"  Already existed: {len(existing_users)} users")
    print(f"  Total agents: {len(agent_names)}")
    
    if created_users:
        print(f"\nNew users created:")
        for name in created_users:
            print(f"  - {name}")
    
    if existing_users:
        print(f"\nExisting users:")
        for name in existing_users:
            print(f"  - {name}")
    
    print(f"\nDefault passwords: {{username}}123 (e.g., tyler123)")
    print(f"Emails: {{username}}@margavenergy.com (e.g., tyler@margavenergy.com)")

if __name__ == "__main__":
    create_agent_users()

Create Agent Users for Call Centre Lead Tracker
Creates users for all agents found in the Excel file
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from accounts.models import User

def create_agent_users():
    """Create users for all agents found in the Excel file"""
    
    # Clean agent names (remove trailing spaces and duplicates)
    agent_names = [
        'Caleb', 'Dani', 'Elliot', 'Elliott', 'Imani', 
        'Jake', 'Joanna', 'Leia', 'Libby', 'Tim', 'Tyler'
    ]
    
    created_users = []
    existing_users = []
    
    print("Creating agent users for Call Centre Lead Tracker...")
    print("=" * 50)
    
    for agent_name in agent_names:
        # Check if user already exists
        if User.objects.filter(username=agent_name).exists():
            print(f"* User '{agent_name}' already exists")
            existing_users.append(agent_name)
            continue
        
        try:
            # Create user
            user = User.objects.create_user(
                username=agent_name,
                email=f"{agent_name.lower()}@margavenergy.com",
                password=f"{agent_name.lower()}123",  # Default password
                first_name=agent_name,
                role='agent'  # Set role as agent
            )
            
            # User profile is already created with the user
            
            created_users.append(agent_name)
            print(f"+ Created user '{agent_name}' (ID: {user.id})")
            
        except Exception as e:
            print(f"- Error creating user '{agent_name}': {e}")
    
    print("\n" + "=" * 50)
    print(f"Summary:")
    print(f"  Created: {len(created_users)} users")
    print(f"  Already existed: {len(existing_users)} users")
    print(f"  Total agents: {len(agent_names)}")
    
    if created_users:
        print(f"\nNew users created:")
        for name in created_users:
            print(f"  - {name}")
    
    if existing_users:
        print(f"\nExisting users:")
        for name in existing_users:
            print(f"  - {name}")
    
    print(f"\nDefault passwords: {{username}}123 (e.g., tyler123)")
    print(f"Emails: {{username}}@margavenergy.com (e.g., tyler@margavenergy.com)")

if __name__ == "__main__":
    create_agent_users()
