from pathlib import Path
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

# Explicitly specify .env file path
import os
env_path = BASE_DIR / '.env'
if env_path.exists():
    os.environ.setdefault('DECOUPLE_CONFIG', str(env_path))

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,crm.margav.energy,www.crm.margav.energy,testserver,margav-crm-backend.onrender.com,margav-energy-crm.onrender.com').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'accounts',
    'leads',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'crm_backend.csrf_exempt_middleware.CSRFExemptAPIMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Disable CSRF for DRF views entirely
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# Disable CSRF for API endpoints
CSRF_TRUSTED_ORIGINS = [
    'https://crm.margav.energy',
    'https://www.crm.margav.energy',
    'https://margav-energy-crm.onrender.com',
]

# Disable CSRF for DRF views
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

ROOT_URLCONF = 'crm_backend.urls'

# --------------------
# Templates
# --------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',  # your Django templates
            BASE_DIR.parent / 'frontend' / 'build'  # React index.html location
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'crm_backend.wsgi.application'

# --------------------
# Database
# --------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'margav_crm',
        'USER': 'margav_user',
        'PASSWORD': 'margav-energy',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Use SQLite as fallback if DATABASE_URL is not provided
if config('DATABASE_URL', default=None):
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(config('DATABASE_URL'))
# --------------------
# Auth & Passwords
# --------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 3}},
]

AUTH_USER_MODEL = 'accounts.User'

# --------------------
# Timezone Settings
# --------------------
TIME_ZONE = 'Europe/London'
USE_TZ = True

# --------------------
# Internationalization
# --------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/London'
USE_I18N = True
USE_TZ = True

# --------------------
# Static files (CSS, JavaScript, Images)
# --------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # collected static files

# Static files directories - only add if the directory exists
frontend_static_dir = BASE_DIR.parent / 'frontend' / 'build' / 'static'
frontend_build_dir = BASE_DIR.parent / 'frontend' / 'build'

STATICFILES_DIRS = []
if frontend_static_dir.exists():
    STATICFILES_DIRS.append(frontend_static_dir)
    print(f"Added frontend static directory: {frontend_static_dir}")
else:
    print(f"Frontend static directory not found: {frontend_static_dir}")

# Also add the entire frontend build directory for index.html
if frontend_build_dir.exists():
    STATICFILES_DIRS.append(frontend_build_dir)
    print(f"Added frontend build directory: {frontend_build_dir}")
else:
    print(f"Frontend build directory not found: {frontend_build_dir}")

# WhiteNoise settings for proper MIME types and static file serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True
WHITENOISE_MANIFEST_STRICT = False

# --------------------
# REST Framework
# --------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.TokenAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# --------------------
# CORS
# --------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "https://crm.margav.energy",
    "https://www.crm.margav.energy",
    "https://margav-crm-frontend.onrender.com",
]

CORS_ALLOWED_ORIGINS.extend(config('CORS_ALLOWED_ORIGINS', default='').split(',') if config('CORS_ALLOWED_ORIGINS', default='') else [])
CORS_ALLOW_CREDENTIALS = True

# --------------------
# Google / API Keys
# --------------------
GOOGLE_CREDENTIALS_PATH = config('GOOGLE_CREDENTIALS_PATH', default=None)
GOOGLE_CALENDAR_EMAIL = config('GOOGLE_CALENDAR_EMAIL', default='sales@margav.energy')
DIALER_API_KEY = config('DIALER_API_KEY', default=None)

# --------------------
# Logging
# --------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'level': 'INFO', 'class': 'logging.StreamHandler'}},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'INFO', 'propagate': True},
        'leads': {'handlers': ['console'], 'level': 'INFO', 'propagate': True},
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --------------------
# Admin Site Configuration
# --------------------
ADMIN_SITE_HEADER = "Margav Energy CRM Administration"
ADMIN_SITE_TITLE = "Margav Energy CRM Administration"
ADMIN_INDEX_TITLE = "Margav Energy CRM Administration"

# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='your_google_client_id_here')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='your_google_client_secret_here')
GOOGLE_REDIRECT_URI = config('GOOGLE_REDIRECT_URI', default='http://localhost:8000/api/auth/google/callback')
GOOGLE_REFRESH_TOKEN = config('GOOGLE_REFRESH_TOKEN', default='your_google_refresh_token_here')

# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID = config('GOOGLE_SHEETS_SPREADSHEET_ID', default='')
GOOGLE_SHEETS_WORKSHEET_NAME = config('GOOGLE_SHEETS_WORKSHEET_NAME', default='Leads')
