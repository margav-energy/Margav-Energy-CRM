#!/usr/bin/env python
"""
Script to set up dialer user mapping for EllaA
Run this from the backend directory: python setup_dialer_user.py
"""

import os
import sys
import django

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from leads.models import DialerUserLink

User = get_user_model()

def setup_dialer_user():
    """Set up dialer user mapping for EllaA"""
    
    # Check if EllaA user exists
    try:
        ella_user = User.objects.get(username='EllaA')
        print(f"✅ User 'EllaA' already exists: {ella_user.get_full_name()}")
    except User.DoesNotExist:
        print("❌ User 'EllaA' does not exist. Creating...")
        
        # Create the user
        ella_user = User.objects.create_user(
            username='EllaA',
            email='ella@margav.energy',
            first_name='Ella',
            last_name='Agent',
            password='temp_password_123',  # User should change this
            role='agent'
        )
        print(f"✅ Created user 'EllaA': {ella_user.get_full_name()}")
    
    # Check if dialer mapping exists
    try:
        mapping = DialerUserLink.objects.get(dialer_user_id='EllaA')
        print(f"✅ Dialer mapping already exists: {mapping}")
    except DialerUserLink.DoesNotExist:
        print("Creating dialer user mapping...")
        
        # Create the mapping
        mapping = DialerUserLink.objects.create(
            dialer_user_id='EllaA',
            dialer_username='EllaA',
            crm_user=ella_user
        )
        print(f"✅ Created dialer mapping: {mapping}")
    
    print("\n🎉 Dialer user setup complete!")
    print(f"   - CRM User: {ella_user.username} ({ella_user.get_full_name()})")
    print(f"   - Dialer ID: {mapping.dialer_user_id}")
    print(f"   - Role: {ella_user.role}")
    
    return ella_user, mapping

if __name__ == '__main__':
    try:
        setup_dialer_user()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
"""
Script to set up dialer user mapping for EllaA
Run this from the backend directory: python setup_dialer_user.py
"""

import os
import sys
import django

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from leads.models import DialerUserLink

User = get_user_model()

def setup_dialer_user():
    """Set up dialer user mapping for EllaA"""
    
    # Check if EllaA user exists
    try:
        ella_user = User.objects.get(username='EllaA')
        print(f"✅ User 'EllaA' already exists: {ella_user.get_full_name()}")
    except User.DoesNotExist:
        print("❌ User 'EllaA' does not exist. Creating...")
        
        # Create the user
        ella_user = User.objects.create_user(
            username='EllaA',
            email='ella@margav.energy',
            first_name='Ella',
            last_name='Agent',
            password='temp_password_123',  # User should change this
            role='agent'
        )
        print(f"✅ Created user 'EllaA': {ella_user.get_full_name()}")
    
    # Check if dialer mapping exists
    try:
        mapping = DialerUserLink.objects.get(dialer_user_id='EllaA')
        print(f"✅ Dialer mapping already exists: {mapping}")
    except DialerUserLink.DoesNotExist:
        print("Creating dialer user mapping...")
        
        # Create the mapping
        mapping = DialerUserLink.objects.create(
            dialer_user_id='EllaA',
            dialer_username='EllaA',
            crm_user=ella_user
        )
        print(f"✅ Created dialer mapping: {mapping}")
    
    print("\n🎉 Dialer user setup complete!")
    print(f"   - CRM User: {ella_user.username} ({ella_user.get_full_name()})")
    print(f"   - Dialer ID: {mapping.dialer_user_id}")
    print(f"   - Role: {ella_user.role}")
    
    return ella_user, mapping

if __name__ == '__main__':
    try:
        setup_dialer_user()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)






