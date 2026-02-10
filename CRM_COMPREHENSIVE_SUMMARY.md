# Margav Energy CRM - Comprehensive System Summary

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Core Features](#core-features)
5. [Lead Management System](#lead-management-system)
6. [Integrations](#integrations)
7. [Field Agent & Canvasser Features](#field-agent--canvasser-features)
8. [Admin Features](#admin-features)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Deployment Information](#deployment-information)
12. [Development Setup](#development-setup)

---

## System Overview

The **Margav Energy CRM** is a comprehensive Customer Relationship Management system designed specifically for the solar energy sales industry. It manages the complete lead lifecycle from initial cold calls through qualification, appointment setting, field assessments, and final sale completion.

### Key Capabilities
- **Multi-role workflow management** for agents, qualifiers, sales reps, and field staff
- **External dialer integration** for seamless call center operations
- **Google Calendar & Sheets integration** for appointment management and data backup
- **Offline-capable field agent forms** with photo capture and signature functionality
- **Comprehensive lead tracking** with 18+ status types and detailed disposition tracking
- **Soft delete functionality** for data safety and recovery
- **Real-time notifications** and callback scheduling
- **Admin dashboard** with bulk operations and analytics

---

## Architecture & Technology Stack

### Backend
- **Framework**: Django 4.2.7 with Django REST Framework 3.14.0
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: Token-based authentication
- **API**: RESTful API with JSON responses
- **Additional Libraries**:
  - `django-cors-headers` - CORS handling
  - `django-filter` - Advanced filtering
  - `gunicorn` - Production WSGI server
  - `whitenoise` - Static file serving
  - `google-api-python-client` - Google services integration
  - `openpyxl` & `pandas` - Excel/CSV data handling

### Frontend
- **Framework**: React 18.2.0 with TypeScript 4.9.5
- **Styling**: Tailwind CSS 3.3.6
- **State Management**: React Context API
- **HTTP Client**: Axios 1.6.2
- **UI Components**: 
  - `react-hot-toast` & `react-toastify` - Notifications
  - `react-router-dom` - Navigation
  - `@dnd-kit` - Drag-and-drop functionality
  - `lucide-react` & `react-icons` - Icons
- **PWA Support**: Service workers for offline functionality

### Deployment
- **Platform**: Render.com
- **Domain**: `crm.margav.energy` (production)
- **Database**: PostgreSQL on Render
- **Static Files**: Served via WhiteNoise
- **SSL**: Automatic SSL certificates via Render

---

## User Roles & Permissions

### 1. **Agent** (Sales Agent)
**Primary Function**: Receive calls from dialer system, create/edit lead forms, manage customer interactions

**Capabilities**:
- View and manage only their assigned leads
- Create new leads from dialer data
- Update lead information and status
- Schedule callbacks for leads
- Receive notifications from qualifiers
- Access agent dashboard with assigned leads
- Mark leads as "Interested" to send to qualifiers

**Restrictions**:
- Cannot see other agents' leads
- Cannot qualify leads or set appointments
- Cannot access admin features

### 2. **Qualifier**
**Primary Function**: Review and qualify leads, set appointments, manage lead progression

**Capabilities**:
- View all leads with "Interested" status
- Review lead information and qualification criteria
- Update lead status to "Qualified" or "Not Interested"
- Set appointments with customers
- Sync appointments to Google Calendar
- Send notifications to agents
- Review field agent submissions
- Access qualifier dashboard with lead filtering

**Restrictions**:
- Cannot create new leads
- Cannot access admin features
- Cannot see leads in other statuses (unless assigned)

### 3. **SalesRep** (Sales Representative)
**Primary Function**: Manage appointments and finalize sales

**Capabilities**:
- View leads with "Appointment Set" status
- Manage appointments
- Update lead status to "Sale Made" or "Sale Lost"
- Record sale amounts
- Access sales dashboard

**Restrictions**:
- Limited to appointment-related leads
- Cannot qualify leads
- Cannot access admin features

### 4. **Canvasser**
**Primary Function**: Collect property assessment data in the field

**Capabilities**:
- Access canvasser portal
- Submit field assessment forms
- Capture property photos
- Work offline with automatic sync
- View submission history

**Restrictions**:
- Cannot access lead management
- Cannot view other users' data
- Limited to field submission functionality

### 5. **Staff4dshire**
**Primary Function**: Specialized role for 4dshire staff operations

**Capabilities**:
- Access to specialized dashboard
- Custom form submissions
- Field assessment capabilities

### 6. **Admin**
**Primary Function**: Complete system oversight and management

**Capabilities**:
- Full access to all users and leads
- User management (create, edit, delete, bulk operations)
- Lead management (view, edit, delete, bulk operations)
- System configuration
- Google integrations management
- Dialer integration management
- Data export (Excel, CSV)
- Google Sheets synchronization
- Soft delete management
- Analytics and reporting
- Access to Django admin interface

---

## Core Features

### Lead Management
- **18+ Lead Status Types**: From "Cold Call" to "Sold"
- **Custom Lead Numbers**: Auto-generated (ME001, ME002, etc.)
- **Comprehensive Lead Fields**: 100+ fields including:
  - Contact information (name, phone, email, address)
  - Property details (type, roof condition, energy usage)
  - Qualification criteria (age, employment, credit status)
  - Appointment scheduling
  - Sale tracking
  - Dialer integration fields (40+ fields)
- **Lead Assignment**: Automatic assignment to agents
- **Lead Filtering**: Advanced filtering by status, agent, date, etc.
- **Lead Search**: Full-text search across multiple fields

### Callback System
- **Scheduled Callbacks**: Set future call times for leads
- **Callback Status Tracking**: Scheduled, Completed, Cancelled, No Answer
- **Due Callback Alerts**: Automatic detection of callbacks due within 15 minutes
- **Overdue Tracking**: Identify and manage overdue callbacks
- **Callback Notes**: Add notes for callback context

### Notification System
- **Real-time Notifications**: Status updates and appointment alerts
- **Notification Types**: Status updates, appointment set, qualification results
- **Read/Unread Tracking**: Mark notifications as read
- **Agent Notifications**: Qualifiers can send notifications to agents

### Soft Delete System
- **Safe Deletion**: Leads are soft-deleted (marked as deleted, not removed)
- **Recovery**: Restore soft-deleted leads
- **Audit Trail**: Track who deleted and when
- **Deletion Reason**: Optional reason for deletion
- **Permanent Delete**: Admin option to permanently delete

### Audit Logging
- **Change Tracking**: Automatic logging of lead creation, updates, and deletions
- **User Attribution**: Track which user made changes
- **Timestamp Tracking**: Record when changes occurred

---

## Lead Management System

### Lead Status Flow

1. **Cold Call** → Initial status for new leads
2. **Interested** → Lead shows interest (agent action)
3. **Qualified** → Lead qualified by qualifier
4. **Appointment Set** → Appointment scheduled
5. **Appointment Completed** → Appointment finished
6. **Sale Made** → Sale completed
7. **Sale Lost** → Sale not completed

**Alternative Statuses**:
- **Not Interested** → Lead declined
- **Tenant** → Property is rented
- **No Contact** → Unable to reach lead
- **Callback** → Scheduled for callback
- **Pass Back to Agent** → Returned to agent
- **On Hold** → Temporarily paused
- **Sold** → Final sale status

### Lead Dispositions
- Not Interested
- Tenant
- Wrong Number
- No Answer
- Callback Requested
- Do Not Call
- Other

### Lead Fields Categories

#### Contact Information
- Full name, phone, email, address
- Postal code, city, state, province
- Preferred contact time
- Alternative phone

#### Property Information
- Property ownership status
- Property type (detached, semi-detached, terraced, bungalow, etc.)
- Roof type and condition
- Roof material and age
- Loft conversions, velux windows, dormers
- Building work status

#### Energy Information
- Monthly electricity spend
- Energy bill amount
- Energy type (gas, electric, dual)
- Current energy supplier
- EV charger status
- Day/night rate
- Previous quotes information

#### Qualification Criteria
- Age range (18-74)
- Employment status
- Credit status
- Income level
- Moving plans (within 5 years)
- Decision maker status
- Government grants awareness

#### Appointment Information
- Assessment date preference
- Assessment time preference
- Desktop roof check status
- Both homeowners present
- Property listed status
- Conservation area status
- Available within 3 working days

#### Dialer Integration Fields (40+ fields)
- Dialer lead ID, vendor ID, list ID
- Phone codes and numbers
- Name components (title, first, middle, last)
- Address components (address1, address2, address3)
- Campaign information
- Session information
- Recording file references

---

## Integrations

### 1. External Dialer Integration

**Purpose**: Receive lead data when agents click "Interested" in the dialer system

**Features**:
- **API Endpoint**: `POST /api/leads/from-dialer/`
- **Comprehensive Data**: Receives 40+ fields from dialer system
- **Smart Lead Detection**: Checks for existing leads by `dialer_lead_id` or phone
- **Automatic Assignment**: Assigns leads to agents based on dialer user mapping
- **Lead Number Generation**: Auto-generates ME### lead numbers
- **Duplicate Prevention**: Unique constraints prevent duplicate leads

**Dialer User Mapping**:
- Links dialer user IDs to CRM users
- Managed via admin interface
- Ensures correct lead assignment

**Dialer Control**:
- Admin can activate/deactivate dialer
- Tracks dialer status and activity

### 2. Google Calendar Integration

**Purpose**: Automatically sync appointments to Google Calendar

**Features**:
- **OAuth Authentication**: Secure OAuth 2.0 flow
- **Automatic Event Creation**: Creates calendar events when appointments are set
- **Event Updates**: Updates events when appointment details change
- **Event Deletion**: Removes events when appointments are cancelled
- **Email Notifications**: Sends reminders 24 hours and 1 hour before appointments
- **Calendar**: Syncs to `ella@margav.energy` calendar

**Setup**:
- Requires Google Cloud Project with Calendar API enabled
- Service account credentials
- Calendar sharing permissions

### 3. Google Sheets Integration

**Purpose**: Automatic backup and synchronization of lead data

**Features**:
- **Automatic Sync**: New leads automatically sync to Google Sheets
- **Update Sync**: Lead updates are reflected in sheets
- **Manual Sync**: Admin can force sync all leads
- **Bulk Operations**: Sync selected leads
- **Worksheet Management**: Data stored in "Leads" worksheet
- **Data Export**: Export to Excel or CSV formats

**Spreadsheet Structure**:
- Columns include: ID, Full Name, Phone, Email, Address, Postcode
- Status, Assigned Agent, Created Date, Updated Date
- Appointment Date, Notes, Property Information
- Energy Details, Timeframe, Deletion Status

**Setup**:
- Requires Google Sheets API access
- Spreadsheet ID configuration
- Automatic worksheet creation

---

## Field Agent & Canvasser Features

### Field Agent Form (PWA)

**Purpose**: Offline-capable property assessment form for field agents

**Features**:
- **Progressive Web App (PWA)**: Installable on mobile devices
- **Offline Support**: Works completely offline using IndexedDB
- **Photo Capture**: Mandatory property photos:
  - Front roof
  - Rear roof
  - Side roof
  - Energy bill
  - Additional photos
- **Auto Sync**: Automatically syncs when connection is restored
- **Background Sync**: Service worker handles sync in background

**Form Sections**:
1. **Contact Information**: Customer name, phone, email, address
2. **Property Information**: Type, bedrooms, roof details, condition
3. **Energy Usage**: Monthly bill, supplier, heating type
4. **Interest & Timeframe**: Quotes received, decision maker, moving plans
5. **Photos**: Mandatory photo capture
6. **Review**: Summary before submission

**Data Storage**:
- **Offline**: IndexedDB for local persistence
- **Online**: Syncs to backend via API
- **Bulk Sync**: Endpoint for syncing multiple submissions

### Canvasser Portal

**Purpose**: Portal for canvassers to submit field assessments

**Features**:
- **Canvasser Login**: Dedicated login for canvassers
- **Form Submission**: Comprehensive property assessment form
- **Photo Upload**: Multiple photo capture
- **Submission History**: View past submissions
- **Status Tracking**: Pending, Under Review, Completed, Rejected

### Field Submission Model

**Status Flow**:
1. **Pending Review** → Initial submission status
2. **Under Review** → Being reviewed by qualifier
3. **Completed** → Review completed, lead created
4. **Rejected** → Submission rejected

**Auto Lead Creation**:
- Field submissions automatically create leads for qualifier review
- Links field submission to created lead
- Preserves all assessment data

---

## Admin Features

### Admin Dashboard

**Statistics**:
- Total users (by role)
- Total leads (by status)
- Recent activity
- System health metrics

**Quick Actions**:
- Manage users
- Bulk create users
- Manage leads
- Export data
- Sync to Google Sheets
- Dialer management

### User Management

**Features**:
- **User List**: View all users with role filtering
- **User Creation**: Single or bulk user creation
- **Role Assignment**: Assign roles (agent, qualifier, salesrep, admin, canvasser, staff4dshire)
- **User Statistics**: Count by role
- **Dialer User Links**: Map dialer users to CRM users
- **Bulk Operations**: Create multiple users at once

**Bulk User Creation**:
- Create multiple users from list
- Automatic role assignment
- Dialer user link creation
- Validation and error handling

### Lead Management

**Features**:
- **Lead List**: View all leads with filtering and search
- **Bulk Operations**:
  - Bulk soft delete
  - Bulk permanent delete
  - Bulk status update
  - Export to Excel
  - Export to CSV
  - Sync to Google Sheets
- **Lead Details**: Comprehensive lead information view
- **Soft Delete Management**: Restore or permanently delete
- **Data Export**: Excel and CSV formats

**Export Options**:
- Download all leads as Excel
- Download all leads as CSV
- Download selected leads
- Custom field selection

### System Administration

**Features**:
- **Google Services Management**:
  - Google Calendar OAuth setup
  - Google Sheets configuration
  - Integration status monitoring
- **Dialer Management**:
  - Activate/deactivate dialer
  - Manage dialer user links
  - Monitor dialer activity
- **Data Management**:
  - Soft delete management
  - Data recovery
  - Bulk operations
- **Analytics**:
  - User statistics
  - Lead statistics
  - Performance metrics

---

## API Endpoints

### Authentication
- `POST /api/api-token-auth/` - Obtain authentication token
- `GET /api/users/me/` - Get current user details

### Users
- `GET /api/users/` - List all users (admin only)
- `POST /api/users/` - Create new user (admin only)
- `GET /api/users/{id}/` - Get user details
- `PUT/PATCH /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

### Leads
- `GET /api/leads/` - List leads (role-based filtering)
- `POST /api/leads/` - Create new lead
- `GET /api/leads/{id}/` - Get lead details
- `PUT/PATCH /api/leads/{id}/` - Update lead
- `DELETE /api/leads/{id}/` - Delete lead
- `GET /api/leads/my/` - Get current user's leads
- `POST /api/leads/from-dialer/` - Create lead from dialer data

### Callbacks
- `GET /api/callbacks/` - List callbacks
- `POST /api/callbacks/` - Create callback
- `GET /api/callbacks/{id}/` - Get callback details
- `PUT/PATCH /api/callbacks/{id}/` - Update callback
- `DELETE /api/callbacks/{id}/` - Delete callback
- `GET /api/callbacks/due/` - Get due callbacks

### Field Submissions
- `GET /api/field-submissions/` - List field submissions
- `POST /api/field-submissions/` - Create field submission
- `GET /api/field-submissions/{id}/` - Get submission details
- `PUT/PATCH /api/field-submissions/{id}/` - Update submission
- `POST /api/field-submissions/bulk-sync/` - Bulk sync offline submissions

### Notifications
- `GET /api/notifications/` - List notifications
- `PUT/PATCH /api/notifications/{id}/` - Mark notification as read

### Google Calendar
- `GET /api/google-calendar/auth/` - Get OAuth URL
- `GET /api/google-calendar/callback/` - OAuth callback
- `GET /api/google-calendar/status/` - Check connection status

### Google Sheets
- `POST /api/google-sheets/sync/` - Sync leads to sheets
- `POST /api/google-sheets/sync-lead/{id}/` - Sync single lead

---

## Database Schema

### Core Models

#### User Model
- **Fields**: username, email, password, role, phone, created_at, updated_at
- **Roles**: agent, qualifier, salesrep, admin, canvasser, staff4dshire
- **Relationships**: One-to-many with leads (assigned_agent, field_sales_rep)

#### Lead Model
- **Core Fields**: lead_number, full_name, phone, email, status, disposition
- **Assignment**: assigned_agent, assigned_agent_name, field_sales_rep
- **Appointment**: appointment_date, google_calendar_event_id
- **Property Fields**: 30+ property-related fields
- **Energy Fields**: 10+ energy-related fields
- **Qualification Fields**: 15+ qualification criteria fields
- **Dialer Fields**: 40+ dialer integration fields
- **Timestamps**: created_at, updated_at
- **Soft Delete**: is_deleted, deleted_at, deleted_by, deletion_reason

#### Callback Model
- **Fields**: lead, scheduled_time, status, notes, created_by, completed_at
- **Status**: scheduled, completed, cancelled, no_answer, sent_to_qualifier

#### FieldSubmission Model
- **Agent Info**: field_agent, canvasser_name, assessment_date, assessment_time
- **Customer Info**: customer_name, phone, email, address, postal_code
- **Property Info**: 15+ property assessment fields
- **Energy Info**: 5+ energy-related fields
- **Photos**: JSON field with base64 encoded images
- **Status**: pending, under_review, completed, rejected
- **Review**: reviewed_by, reviewed_at, review_notes

#### DialerUserLink Model
- **Fields**: dialer_user_id, dialer_username, crm_user
- **Purpose**: Maps dialer users to CRM users

#### Dialer Model
- **Fields**: is_active, created_by, created_at, updated_at
- **Purpose**: Tracks dialer system status

#### LeadNotification Model
- **Fields**: lead, agent, qualifier, message, notification_type, is_read, created_at
- **Types**: status_update, appointment_set, qualification_result

### Relationships
- User → Leads (assigned_agent, field_sales_rep)
- Lead → Callbacks (one-to-many)
- Lead → FieldSubmission (one-to-one)
- Lead → Notifications (one-to-many)
- User → DialerUserLink (one-to-one)

---

## Deployment Information

### Production Environment
- **Platform**: Render.com
- **Domain**: `crm.margav.energy`
- **Backend URL**: `https://margav-energy-crm.onrender.com`
- **Database**: PostgreSQL on Render
- **SSL**: Automatic SSL certificates

### Deployment Configuration
- **Build Command**: `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput`
- **Start Command**: `cd backend && gunicorn crm_backend.wsgi:application`
- **Environment Variables**: Configured via Render dashboard
- **Static Files**: Served via WhiteNoise
- **Database Migrations**: Run automatically on deployment

### Environment Variables Required
```
SECRET_KEY
DEBUG=False
ALLOWED_HOSTS
DATABASE_URL
GOOGLE_CREDENTIALS_PATH
GOOGLE_CALENDAR_EMAIL
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SHEETS_WORKSHEET_NAME
DIALER_API_KEY (if applicable)
```

### Deployment Process
1. Push code to Git repository
2. Render automatically builds and deploys
3. Database migrations run automatically
4. Static files collected
5. Application starts with Gunicorn

---

## Development Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- PostgreSQL (for production-like testing)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env file with your settings
   ```

5. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Create sample data** (optional):
   ```bash
   python manage.py create_users
   python manage.py generate_tokens
   python manage.py create_sample_leads
   ```

8. **Start development server**:
   ```bash
   python manage.py runserver
   ```

Backend available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

Frontend available at `http://localhost:3000`

### Demo Accounts
- **Admin**: `admin` / `123`
- **Agent**: `agent1` / `123`
- **Qualifier**: `qualifier1` / `123`
- **SalesRep**: `salesrep1` / `123`

### Development Tools
- **Django Admin**: `http://localhost:8000/admin/`
- **API Root**: `http://localhost:8000/api/`
- **API Documentation**: Available via Django REST Framework browsable API

---

## Additional Features

### Offline Authentication
- Token-based authentication with local storage
- Offline login capability
- Automatic token refresh

### PWA Features
- Service worker for offline functionality
- App manifest for installation
- Offline indicator
- Background sync

### Data Safety
- Soft delete for data recovery
- Audit logging for all changes
- Automatic backups to Google Sheets
- Export capabilities (Excel, CSV)

### Performance
- Pagination for large datasets
- Efficient database queries
- Caching where appropriate
- Optimized static file serving

### Security
- Token-based authentication
- Role-based access control
- CORS configuration
- CSRF protection
- Secure password handling

---

## Summary

The Margav Energy CRM is a comprehensive, production-ready system designed for the solar energy sales industry. It provides:

- **Complete lead lifecycle management** from cold calls to sales
- **Multi-role workflow** supporting agents, qualifiers, sales reps, and field staff
- **Seamless integrations** with dialer systems, Google Calendar, and Google Sheets
- **Offline-capable field forms** for mobile field agents
- **Comprehensive admin tools** for system management
- **Production deployment** on Render with PostgreSQL
- **Scalable architecture** built with modern technologies

The system is actively maintained, well-documented, and ready for production use.

---

**Last Updated**: 2025
**Version**: Production
**Status**: Active

