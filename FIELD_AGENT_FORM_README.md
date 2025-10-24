# Field Agent Form - Offline Capable PWA

## Overview

The Field Agent Form is a Progressive Web App (PWA) designed for field agents to collect property assessment data offline and sync when back online. It includes mandatory photo capture and signature functionality.

## Features

### ✅ Core Functionality
- **Offline Support**: Works completely offline using IndexedDB storage
- **Photo Capture**: Mandatory property photos using device camera
- **Signature Capture**: Mandatory customer signature on touchscreen
- **Auto Sync**: Automatically syncs data when connection is restored
- **PWA Support**: Installable as a native app on mobile devices

### 📱 Mobile Optimized
- Responsive design for tablets and phones
- Touch-friendly interface
- Camera integration for photo capture
- Signature pad for customer signatures
- Offline indicator and sync status

### 🔄 Data Management
- **Offline Storage**: Uses IndexedDB for local data persistence
- **Background Sync**: Service worker handles sync when online
- **Data Validation**: Client-side validation for required fields
- **Error Handling**: Graceful error handling and user feedback

## Technical Architecture

### Frontend (React + TypeScript)
- **FieldAgentForm.tsx**: Main form component
- **PWA Manifest**: App installation and metadata
- **Service Worker**: Offline functionality and background sync
- **IndexedDB**: Local data storage

### Backend (Django + DRF)
- **FieldSubmission Model**: Database model for field assessments
- **FieldSubmissionViewSet**: API endpoints for CRUD operations
- **Auto Lead Creation**: Automatically creates leads for qualifier review
- **Bulk Sync**: Endpoint for syncing multiple offline submissions

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. PWA Installation
1. Open the app in a mobile browser
2. Look for "Add to Home Screen" option
3. Install the app for native-like experience

## Usage

### For Field Agents

1. **Access the Form**: Navigate to `/field-agent` route
2. **Fill Customer Information**: Complete required fields (Name, Phone, Address)
3. **Property Assessment**: Fill in property details and energy information
4. **Take Photos**: Use camera to capture property photos (mandatory)
5. **Get Signature**: Have customer sign on the touchscreen (mandatory)
6. **Submit**: Form saves offline if no internet, syncs when online

### For Qualifiers

1. **Review Submissions**: Field submissions automatically create leads
2. **View Photos**: Access captured property photos
3. **Review Signature**: Verify customer signature
4. **Process Lead**: Qualify and assign to agents

## Data Flow

```
Field Agent → Offline Form → IndexedDB → Service Worker → API → Database → Lead Creation → Qualifier Review
```

## Offline Behavior

### When Offline:
- Form data is saved to IndexedDB
- Photos and signatures stored as base64
- User sees "Offline" indicator
- Pending submissions counter shows

### When Back Online:
- Service worker automatically syncs pending data
- Background sync processes all offline submissions
- Success notifications shown to user
- Pending counter resets

## API Endpoints

### Field Submissions
- `GET /api/field-submissions/` - List submissions
- `POST /api/field-submissions/` - Create new submission
- `GET /api/field-submissions/stats/` - Get submission statistics
- `POST /api/field-submissions/bulk-sync/` - Bulk sync offline data

### Auto Lead Creation
When a field submission is created, it automatically:
1. Creates a new Lead with status 'sent_to_kelly'
2. Formats assessment data into lead notes
3. Links the submission to the lead
4. Makes it available for qualifier review

## Required Fields

### Customer Information
- ✅ Full Name (required)
- ✅ Phone (required)
- ✅ Address (required)
- Email (optional)
- City (optional)
- Postal Code (optional)

### Property Assessment
- Property Type
- Roof Type & Condition
- Roof Age
- Energy Information
- Heating & Hot Water Types
- Insulation & Windows
- Property Age & Occupancy

### Media (Mandatory)
- ✅ At least one property photo
- ✅ Customer signature

## Security Features

- **Authentication Required**: All endpoints require valid user authentication
- **Role-Based Access**: Field agents see only their submissions
- **Data Validation**: Server-side validation for all inputs
- **Secure Storage**: Sensitive data encrypted in transit

## Browser Support

- **Chrome/Edge**: Full PWA support
- **Safari**: Basic PWA support
- **Firefox**: PWA support with limitations
- **Mobile Browsers**: Full camera and signature support

## Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Try refreshing the page

2. **Signature Not Capturing**
   - Ensure touchscreen device
   - Check browser compatibility
   - Clear browser cache

3. **Sync Issues**
   - Check internet connection
   - Verify API endpoints
   - Check browser console for errors

### Debug Mode
Enable debug logging by opening browser console and looking for:
- Service worker registration messages
- IndexedDB operations
- Sync status updates

## Future Enhancements

- **GPS Location**: Automatic property location capture
- **Voice Notes**: Audio recording for additional notes
- **Document Upload**: Additional document capture
- **Real-time Sync**: Live sync with other agents
- **Advanced Analytics**: Submission statistics and reporting

## Support

For technical support or feature requests, contact the development team or create an issue in the project repository.



