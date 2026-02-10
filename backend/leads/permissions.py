from rest_framework import permissions


class LeadPermission(permissions.BasePermission):
    """
    Custom permission for lead access based on user roles.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can do everything
        if request.user.is_admin:
            return True
        
        # Agents can only see their own leads
        if request.user.is_agent:
            return True
        
        # Staff4dshire users can create leads
        if request.user.is_staff4dshire:
            return True
        
        # Qualifiers can see leads with status 'interested'
        if request.user.is_qualifier:
            return True
        
        # SalesReps can see leads with appointments
        if request.user.is_salesrep:
            return True
        
        # AI Agents (Sam) can see their own leads
        if request.user.is_ai_agent:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can do everything
        if request.user.is_admin:
            return True
        
        # Agents can access their own leads for any operation
        if request.user.is_agent:
            return obj.assigned_agent == request.user
        
        # Staff4dshire users can access their own leads
        if request.user.is_staff4dshire:
            return obj.assigned_agent == request.user
        
        # Qualifiers can access leads they've processed (sent_to_kelly and beyond)
        if request.user.is_qualifier:
            return obj.status in ['sent_to_kelly', 'qualified', 'appointment_set', 'not_interested', 'no_contact', 'blow_out', 'callback', 'pass_back_to_agent']
        
        # SalesReps can access leads with appointments
        if request.user.is_salesrep:
            return obj.status == 'appointment_set'
        
        # AI Agents (Sam) can access their own leads
        if request.user.is_ai_agent:
            return obj.assigned_agent == request.user
        
        return False