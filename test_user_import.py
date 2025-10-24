#!/usr/bin/env python3
"""
Test User Import in Django
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

def test_user_import():
    """Test that User model can be imported correctly"""
    
    try:
        User = get_user_model()
        print(f"+ User model imported successfully: {User}")
        
        # Test querying users
        users = User.objects.all()
        print(f"+ Found {users.count()} users in database")
        
        # Test agent users
        agents = User.objects.filter(role='agent')
        print(f"+ Found {agents.count()} agent users")
        
        for agent in agents:
            print(f"  - {agent.username} (ID: {agent.id})")
        
        return True
        
    except Exception as e:
        print(f"- Error importing User model: {e}")
        return False

if __name__ == "__main__":
    print("Testing User model import...")
    success = test_user_import()
    if success:
        print("\n+ User import test passed!")
    else:
        print("\n- User import test failed!")

Test User Import in Django
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

def test_user_import():
    """Test that User model can be imported correctly"""
    
    try:
        User = get_user_model()
        print(f"+ User model imported successfully: {User}")
        
        # Test querying users
        users = User.objects.all()
        print(f"+ Found {users.count()} users in database")
        
        # Test agent users
        agents = User.objects.filter(role='agent')
        print(f"+ Found {agents.count()} agent users")
        
        for agent in agents:
            print(f"  - {agent.username} (ID: {agent.id})")
        
        return True
        
    except Exception as e:
        print(f"- Error importing User model: {e}")
        return False

if __name__ == "__main__":
    print("Testing User model import...")
    success = test_user_import()
    if success:
        print("\n+ User import test passed!")
    else:
        print("\n- User import test failed!")
