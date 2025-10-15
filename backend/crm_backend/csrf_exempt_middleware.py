from django.utils.deprecation import MiddlewareMixin
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse

class CSRFExemptAPIMiddleware(MiddlewareMixin):
    """
    Middleware to exempt API endpoints from CSRF protection
    """
    def process_request(self, request):
        # Check if the request is to an API endpoint
        if request.path.startswith('/api/') or request.path.startswith('/leads/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Set a flag to skip CSRF verification
            request._dont_enforce_csrf_checks = True
        return None
