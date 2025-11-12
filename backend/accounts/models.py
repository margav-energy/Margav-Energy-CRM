from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model with role-based access control.
    """
    ROLE_CHOICES = [
        ('agent', 'Agent'),
        ('qualifier', 'Qualifier'),
        ('salesrep', 'SalesRep'),
        ('admin', 'Admin'),
        ('canvasser', 'Canvasser'),
        ('staff4dshire', 'Staff4dshire'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='agent',
        help_text='User role for access control'
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='User phone number'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_agent(self):
        return self.role == 'agent'
    
    @property
    def is_qualifier(self):
        return self.role == 'qualifier'
    
    @property
    def is_salesrep(self):
        return self.role == 'salesrep'
    
    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser
    
    @property
    def is_canvasser(self):
        return self.role == 'canvasser'
    
    @property
    def is_staff4dshire(self):
        return self.role == 'staff4dshire'
