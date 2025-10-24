from django.contrib import admin
from django.conf import settings
# from accounts.admin_dashboard_views import admin_dashboard

# Configure the admin site
admin.site.site_header = getattr(settings, 'ADMIN_SITE_HEADER', 'Margav Energy CRM Administration')
admin.site.site_title = getattr(settings, 'ADMIN_SITE_TITLE', 'Margav Energy CRM Administration')
admin.site.index_title = getattr(settings, 'ADMIN_INDEX_TITLE', 'Margav Energy CRM Administration')

# Override the admin index view
# admin.site.index = admin_dashboard
