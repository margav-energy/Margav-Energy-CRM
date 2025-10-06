from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.management import call_command
from io import StringIO
import sys
import json


@staff_member_required
def bulk_user_creation(request):
    """
    Custom admin view for bulk user creation.
    """
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'create_dialer_users':
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = captured_output = StringIO()
            
            try:
                # Run the management command
                call_command('create_dialer_users', verbosity=2)
                output = captured_output.getvalue()
                
                messages.success(
                    request,
                    f"Dialer users created successfully!\n{output}"
                )
            except Exception as e:
                messages.error(
                    request,
                    f"Error creating dialer users: {str(e)}"
                )
            finally:
                sys.stdout = old_stdout
                
            return redirect('admin:accounts_user_changelist')
    
    return render(request, 'admin/accounts/user/bulk_creation.html', {
        'title': 'Bulk User Creation',
        'opts': {'verbose_name': 'User', 'verbose_name_plural': 'Users'},
    })


@staff_member_required
@require_POST
@csrf_exempt
def create_single_user(request):
    """
    AJAX endpoint to create a single user with dialer link.
    """
    try:
        data = json.loads(request.body)
        dialer_user_id = data.get('dialer_user_id')
        full_name = data.get('full_name', '')
        username = data.get('username')
        password = data.get('password', '123')
        role = data.get('role', 'agent')
        
        if not dialer_user_id or not username:
            return JsonResponse({'error': 'dialer_user_id and username are required'}, status=400)
        
        from accounts.models import User
        from leads.models import DialerUserLink
        
        # Create user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'first_name': full_name.split()[0] if full_name and ' ' in full_name else '',
                'last_name': ' '.join(full_name.split()[1:]) if full_name and ' ' in full_name else full_name,
                'email': f"{username}@margavenergy.com",
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
                'role': role,
            }
        )
        
        user.set_password(password)
        user.save()
        
        # Create dialer link
        dialer_link, link_created = DialerUserLink.objects.get_or_create(
            dialer_user_id=dialer_user_id,
            defaults={'crm_user': user}
        )
        
        if not link_created and dialer_link.crm_user != user:
            dialer_link.crm_user = user
            dialer_link.save()
        
        return JsonResponse({
            'success': True,
            'user_created': created,
            'link_created': link_created,
            'user_id': user.id,
            'username': user.username
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
@require_POST
@csrf_exempt
def delete_user(request, username):
    """
    Delete a user by username.
    """
    try:
        from accounts.models import User
        from leads.models import DialerUserLink
        
        # Find user by username
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'error': f'User "{username}" not found'}, status=404)
        
        # Prevent deletion of superuser
        if user.is_superuser:
            return JsonResponse({'error': 'Cannot delete superuser'}, status=400)
        
        # Delete associated dialer links
        DialerUserLink.objects.filter(crm_user=user).delete()
        
        # Delete user
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'User "{username}" deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
@require_POST
@csrf_exempt
def reset_user_password(request):
    """
    Reset a user's password.
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password', '123')
        
        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)
        
        from accounts.models import User
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'error': f'User "{username}" not found'}, status=404)
        
        user.set_password(password)
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Password reset successfully for user "{username}"'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
def get_user_stats(request):
    """
    Get user statistics for the dashboard.
    """
    try:
        from accounts.models import User
        from leads.models import Lead
        
        user_stats = {
            'total': User.objects.count(),
            'agents': User.objects.filter(role='agent').count(),
            'qualifiers': User.objects.filter(role='qualifier').count(),
            'salesreps': User.objects.filter(role='salesrep').count(),
            'admins': User.objects.filter(role='admin').count(),
        }
        
        lead_stats = {
            'total': Lead.objects.count(),
            'interested': Lead.objects.filter(status='interested').count(),
            'sent_to_kelly': Lead.objects.filter(status='sent_to_kelly').count(),
            'qualified': Lead.objects.filter(status='qualified').count(),
        }
        
        return JsonResponse({
            'user_stats': user_stats,
            'lead_stats': lead_stats
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)