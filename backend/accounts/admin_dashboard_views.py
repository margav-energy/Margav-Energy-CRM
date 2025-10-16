from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from leads.models import Lead, Callback
from django.contrib.admin.models import LogEntry
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

def admin_dashboard(request):
    """Enhanced admin dashboard with real activity data"""
    
    # Get user counts by role
    agents_count = User.objects.filter(role='agent').count()
    qualifiers_count = User.objects.filter(role='qualifier').count()
    salesreps_count = User.objects.filter(role='salesrep').count()
    total_users = User.objects.count()
    total_leads = Lead.objects.count()
    
    # Get recent activity (last 24 hours)
    yesterday = timezone.now() - timedelta(days=1)
    
    # Get recent log entries
    recent_logs = LogEntry.objects.filter(
        action_time__gte=yesterday
    ).order_by('-action_time')[:10]
    
    # Get recent leads
    recent_leads = Lead.objects.filter(
        created_at__gte=yesterday
    ).order_by('-created_at')[:5]
    
    # Get recent callbacks (using scheduled_time since created_at doesn't exist)
    recent_callbacks = Callback.objects.filter(
        scheduled_time__gte=yesterday
    ).order_by('-scheduled_time')[:5]
    
    # Process activity items
    activity_items = []
    
    # Add recent log entries
    for log in recent_logs:
        if log.content_type.model == 'user':
            activity_items.append({
                'type': 'user',
                'title': f"User {log.get_action_flag_display().lower()}: {log.object_repr}",
                'time': log.action_time,
                'icon': '👤'
            })
        elif log.content_type.model == 'lead':
            activity_items.append({
                'type': 'lead',
                'title': f"Lead {log.get_action_flag_display().lower()}: {log.object_repr}",
                'time': log.action_time,
                'icon': '📋'
            })
    
    # Add recent leads
    for lead in recent_leads:
        activity_items.append({
            'type': 'lead',
            'title': f"New lead created: {lead.full_name}",
            'time': lead.created_at,
            'icon': '📋'
        })
    
    # Add recent callbacks
    for callback in recent_callbacks:
        activity_items.append({
            'type': 'callback',
            'title': f"Callback scheduled: {callback.lead.full_name}",
            'time': callback.scheduled_time,
            'icon': '⏰'
        })
    
    # Sort by time and take the most recent 5
    activity_items.sort(key=lambda x: x['time'], reverse=True)
    activity_items = activity_items[:5]
    
    # If no recent activity, show some default items
    if not activity_items:
        activity_items = [
            {
                'type': 'system',
                'title': 'System initialized',
                'time': timezone.now(),
                'icon': '🚀'
            }
        ]
    
    context = {
        'agents_count': agents_count,
        'qualifiers_count': qualifiers_count,
        'salesreps_count': salesreps_count,
        'total_users': total_users,
        'total_leads': total_leads,
        'activity_items': activity_items,
    }
    
    return render(request, 'admin/index.html', context)
