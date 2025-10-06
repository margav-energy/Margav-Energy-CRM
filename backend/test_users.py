#!/usr/bin/env python
"""
Test script to verify dialer users were created correctly.
"""
import os
import sys
import django

# Setup Django
sys.path.append('/Users/elarh/Desktop/Margav Energy CRM/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from accounts.models import User
from leads.models import DialerUserLink

def test_users():
    print("=== Testing Dialer Users ===")
    
    # Check total users
    total_users = User.objects.count()
    print(f"Total users in database: {total_users}")
    
    # Check dialer links
    total_links = DialerUserLink.objects.count()
    print(f"Total dialer links: {total_links}")
    
    # List all users with their roles
    print("\n=== Users by Role ===")
    for role, _ in User.ROLE_CHOICES:
        count = User.objects.filter(role=role).count()
        print(f"{role}: {count} users")
    
    # Show some sample users
    print("\n=== Sample Users ===")
    sample_users = User.objects.all()[:10]
    for user in sample_users:
        links = DialerUserLink.objects.filter(crm_user=user)
        dialer_ids = [link.dialer_user_id for link in links]
        print(f"  {user.username} ({user.get_role_display()}) - Dialer IDs: {dialer_ids}")
    
    # Test password verification
    print("\n=== Password Test ===")
    test_user = User.objects.filter(username='andy').first()
    if test_user:
        password_check = test_user.check_password('123')
        print(f"User 'andy' password '123' check: {'✓ PASS' if password_check else '✗ FAIL'}")
    else:
        print("User 'andy' not found")
    
    # Show dialer links
    print("\n=== Dialer Links ===")
    links = DialerUserLink.objects.all()[:10]
    for link in links:
        print(f"  {link.dialer_user_id} -> {link.crm_user.username} ({link.crm_user.get_role_display()})")

if __name__ == '__main__':
    test_users()
