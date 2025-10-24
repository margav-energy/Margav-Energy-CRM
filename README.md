# Margav Energy CRM

A comprehensive Customer Relationship Management system built with Django REST Framework backend and React + TypeScript frontend.

## Features

### Backend (Django + DRF)

- Custom user model with roles: Agent, Qualifier, SalesRep, Admin
- Lead management system with status tracking
- Role-based permissions and access control
- Token-based authentication
- RESTful API endpoints
- CORS configuration for frontend integration

### Frontend (React + TypeScript)

- Modern React with TypeScript
- Role-based dashboards
- Lead management interface
- Call simulation for testing
- Toast notifications
- Responsive design with Tailwind CSS

## Project Structure

```
Margav Energy CRM/
├── backend/
│   ├── crm_backend/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── permissions.py
│   │   ├── admin.py
│   │   ├── urls.py
│   │   └── management/
│   │       └── commands/
│   │           ├── create_users.py
│   │           └── generate_tokens.py
│   ├── leads/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── permissions.py
│   │   ├── admin.py
│   │   ├── urls.py
│   │   └── management/
│   │       └── commands/
│   │           └── create_sample_leads.py
│   ├── manage.py
│   ├── requirements.txt
│   └── env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Login.tsx
    │   │   ├── Layout.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── AgentDashboard.tsx
    │   │   ├── QualifierDashboard.tsx
    │   │   ├── LeadCard.tsx
    │   │   ├── LeadForm.tsx
    │   │   ├── LeadUpdateModal.tsx
    │   │   └── CallSimulator.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── api.ts
    │   ├── App.tsx
    │   ├── index.tsx
    │   └── index.css
    ├── package.json
    └── tsconfig.json
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:

   ```bash
   cp env.example .env
   # Edit .env file with your settings
   ```

5. Run migrations:

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. Create superuser:

   ```bash
   python manage.py createsuperuser
   ```

7. Create sample users and data:

   ```bash
   python manage.py create_users
   python manage.py generate_tokens
   python manage.py create_sample_leads
   ```

8. Start the development server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000` (development) or `https://crm.margav.energy` (production)

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000` (development) or `https://crm.margav.energy` (production)

## Demo Accounts

The system comes with pre-configured demo accounts:

- **Admin**: `admin` / `123`
- **Agent**: `agent1` / `123`
- **Qualifier**: `qualifier1` / `123`
- **SalesRep**: `salesrep1` / `123`

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

## Role-Based Permissions

### Agents

- Can only see their own assigned leads
- Can create new leads
- Can update their own leads

### Qualifiers

- Can see all leads with "Interested" status
- Can update lead status to "Qualified" or "Not Interested"
- Can schedule appointments

### SalesReps

- Can see leads with "Appointment Set" status
- Can manage appointments

### Admins

- Full access to all users and leads
- Can manage user accounts
- Can view all data

## Lead Status Flow

1. **Interested** - Initial status when lead shows interest
2. **Qualified** - Lead has been qualified by a qualifier
3. **Appointment Set** - Appointment has been scheduled
4. **Not Interested** - Lead is not interested

## Development

### Backend Development

- The backend uses Django REST Framework
- Custom permissions are implemented in `permissions.py`
- Role-based filtering is handled in views
- Token authentication is used for API access

### Frontend Development

- Built with React 18 and TypeScript
- Uses Context API for state management
- Axios for API communication
- Tailwind CSS for styling
- React Router for navigation

### Adding New Features

1. **Backend**: Add models, serializers, views, and URLs
2. **Frontend**: Add components, types, and API calls
3. **Permissions**: Update role-based access control
4. **Testing**: Test with different user roles

## Deployment

### Backend Deployment

1. Set `DEBUG = False` in settings
2. Configure production database
3. Set up static file serving
4. Configure CORS for production domain
5. Set up environment variables

### Frontend Deployment

1. Build the project: `npm run build`
2. Serve the build folder
3. Update API base URL for production
4. Configure environment variables

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS is properly configured in Django settings
2. **Token Issues**: Check if tokens are being stored and sent correctly
3. **Permission Errors**: Verify user roles and permissions
4. **Database Issues**: Run migrations and check database configuration

### Debug Mode

- Backend: Set `DEBUG = True` in settings.py
- Frontend: Use browser developer tools
- Check network tab for API requests
- Verify authentication headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
# Trigger deployment Fri, Oct 24, 2025  3:48:00 PM
