from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    """
    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for admins
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners or admins to access objects.
    """
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_admin:
            return True
        
        # Owner permissions
        return obj == request.user


class IsAgentOrAdmin(permissions.BasePermission):
    """
    Custom permission for agents and admins.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_agent or request.user.is_admin
        )
