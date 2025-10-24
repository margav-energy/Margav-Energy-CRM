#!/usr/bin/env python3
"""
Test agent name trimming
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def map_agent_name(agent_name):
    """Map agent names from JSON to actual database usernames"""
    agent_name = agent_name.strip()
    
    # Mapping dictionary for agent name variations
    agent_mapping = {
        'CalebG': 'Caleb',
        'Leia': 'Leia',  # This one exists
        'Tyler': 'Tyler',  # This one exists
        'Libby': 'Libby',  # This one exists
        'Imani': 'Imani',  # This one exists
        'Jake': 'Jake',  # This one exists
        'EllaA': 'EllaA',  # This one exists
    }
    
    return agent_mapping.get(agent_name, agent_name)

def test_agent_names():
    """Test agent name trimming and matching"""
    
    # Test cases with whitespace
    test_agent_names = [
        "CalebG ",
        " Tyler ",
        "Leia ",
        "Jake",
        " Libby ",
        "EllaA "
    ]
    
    print("Testing agent name trimming:")
    print("=" * 50)
    
    for agent_name in test_agent_names:
        agent_name_trimmed = agent_name.strip()
        agent_name_mapped = map_agent_name(agent_name_trimmed)
        
        print(f"Original: '{agent_name}' -> Trimmed: '{agent_name_trimmed}' -> Mapped: '{agent_name_mapped}'")
        
        try:
            agent = User.objects.get(username=agent_name_mapped)
            print(f"  ✅ Found agent: {agent.username} (ID: {agent.id})")
        except User.DoesNotExist:
            print(f"  ❌ Agent '{agent_name_mapped}' not found")
    
    print("\nAll available agents:")
    print("=" * 50)
    agents = User.objects.filter(role='agent')
    for agent in agents:
        print(f"- {agent.username} (ID: {agent.id})")

if __name__ == "__main__":
    test_agent_names()

Test agent name trimming
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def map_agent_name(agent_name):
    """Map agent names from JSON to actual database usernames"""
    agent_name = agent_name.strip()
    
    # Mapping dictionary for agent name variations
    agent_mapping = {
        'CalebG': 'Caleb',
        'Leia': 'Leia',  # This one exists
        'Tyler': 'Tyler',  # This one exists
        'Libby': 'Libby',  # This one exists
        'Imani': 'Imani',  # This one exists
        'Jake': 'Jake',  # This one exists
        'EllaA': 'EllaA',  # This one exists
    }
    
    return agent_mapping.get(agent_name, agent_name)

def test_agent_names():
    """Test agent name trimming and matching"""
    
    # Test cases with whitespace
    test_agent_names = [
        "CalebG ",
        " Tyler ",
        "Leia ",
        "Jake",
        " Libby ",
        "EllaA "
    ]
    
    print("Testing agent name trimming:")
    print("=" * 50)
    
    for agent_name in test_agent_names:
        agent_name_trimmed = agent_name.strip()
        agent_name_mapped = map_agent_name(agent_name_trimmed)
        
        print(f"Original: '{agent_name}' -> Trimmed: '{agent_name_trimmed}' -> Mapped: '{agent_name_mapped}'")
        
        try:
            agent = User.objects.get(username=agent_name_mapped)
            print(f"  ✅ Found agent: {agent.username} (ID: {agent.id})")
        except User.DoesNotExist:
            print(f"  ❌ Agent '{agent_name_mapped}' not found")
    
    print("\nAll available agents:")
    print("=" * 50)
    agents = User.objects.filter(role='agent')
    for agent in agents:
        print(f"- {agent.username} (ID: {agent.id})")

if __name__ == "__main__":
    test_agent_names()
