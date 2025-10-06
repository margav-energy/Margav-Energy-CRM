# 🧪 Postman API Testing Guide - Margav Energy CRM

## 📋 **Prerequisites**

- Django server running on `http://localhost:8000`
- Postman installed and ready to use

## 🔐 **Authentication Methods**

The API supports two authentication methods:

### **1. Token Authentication (Recommended)**

- Get a token by logging in via `/api/auth/login/`
- Use the token in the `Authorization` header

### **2. Session Authentication**

- Login via Django admin or API
- Use session cookies for authentication

## 🚀 **API Endpoints Overview**

### **Base URL**: `http://localhost:8000/api/`

## 📝 **Step-by-Step Testing Guide**

### **Step 1: Authentication**

#### **1.1 Login to Get Token**

```
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
    "username": "admin",
    "password": "123"
}
```

**Expected Response:**

```json
{
  "token": "your-auth-token-here",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }
}
```

#### **1.2 Set Authorization Header**

In Postman, go to the **Authorization** tab and select **Bearer Token**, then paste your token.

### **Step 2: User Management**

#### **2.1 Get Current User**

```
GET http://localhost:8000/api/auth/me/
Authorization: Bearer {your-token}
```

#### **2.2 Get All Users (Admin Only)**

```
GET http://localhost:8000/api/users/
Authorization: Bearer {your-token}
```

#### **2.3 Create New User**

```
POST http://localhost:8000/api/users/
Authorization: Bearer {your-token}
Content-Type: application/json

{
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "password123",
    "role": "agent",
    "phone": "+1234567890"
}
```

### **Step 3: Lead Management**

#### **3.1 Get All Leads**

```
GET http://localhost:8000/api/leads/
Authorization: Bearer {your-token}
```

#### **3.2 Get My Leads (Agent's leads)**

```
GET http://localhost:8000/api/leads/my/
Authorization: Bearer {your-token}
```

#### **3.3 Create New Lead**

```
POST http://localhost:8000/api/leads/
Authorization: Bearer {your-token}
Content-Type: application/json

{
    "full_name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "notes": "Interested in solar panels",
    "status": "new"
}
```

#### **3.4 Update Lead**

```
PUT http://localhost:8000/api/leads/{lead-id}/
Authorization: Bearer {your-token}
Content-Type: application/json

{
    "full_name": "John Doe Updated",
    "phone": "+1234567890",
    "email": "john.updated@example.com",
    "notes": "Very interested in solar panels",
    "status": "qualified"
}
```

#### **3.5 Delete Lead**

```
DELETE http://localhost:8000/api/leads/{lead-id}/
Authorization: Bearer {your-token}
```

### **Step 4: Dialer Integration Testing**

#### **4.1 Create Lead from Dialer (with API Key)**

```
POST http://localhost:8000/api/leads/from-dialer/
Content-Type: application/json
X-Dialer-Api-Key: your-dialer-api-key

{
    "dialer_user_id": "CalebG",
    "full_name": "Jane Smith",
    "phone": "+1987654321",
    "email": "jane@example.com",
    "notes": "Called from dialer system",
    "dialer_lead_id": "DL123456",
    "vendor_id": "V001",
    "list_id": "L001"
}
```

#### **4.2 Create Lead from Dialer (with Username)**

```
POST http://localhost:8000/api/leads/from-dialer/
Content-Type: application/json

{
    "user": "CalebG",
    "full_name": "Bob Johnson",
    "phone": "+1555123456",
    "email": "bob@example.com",
    "notes": "Interested in renewable energy"
}
```

### **Step 5: Advanced Lead Operations**

#### **5.1 Update Lead Status**

```
PATCH http://localhost:8000/api/leads/{lead-id}/status/
Authorization: Bearer {your-token}
Content-Type: application/json

{
    "status": "qualified"
}
```

#### **5.2 Add Lead Notes**

```
PATCH http://localhost:8000/api/leads/{lead-id}/notes/
Authorization: Bearer {your-token}
Content-Type: application/json

{
    "notes": "Customer called back, very interested"
}
```

#### **5.3 Get Leads by Status**

```
GET http://localhost:8000/api/leads/?status=new
Authorization: Bearer {your-token}
```

#### **5.4 Search Leads**

```
GET http://localhost:8000/api/leads/?search=John
Authorization: Bearer {your-token}
```

### **Step 6: Dialer User Links**

#### **6.1 Get All Dialer User Links**

```
GET http://localhost:8000/api/dialer-links/
Authorization: Bearer {your-token}
```

#### **6.2 Create Dialer User Link**

```
POST http://localhost:8000/api/dialer-links/
Authorization: Bearer {your-token}
Content-Type: application/json

{
    "dialer_user_id": "test_dialer_user",
    "crm_user": 1
}
```

## 🔧 **Postman Collection Setup**

### **Environment Variables**

Create a Postman environment with these variables:

```json
{
  "base_url": "http://localhost:8000/api",
  "admin_token": "your-admin-token-here",
  "agent_token": "your-agent-token-here",
  "dialer_api_key": "your-dialer-api-key-here"
}
```

### **Pre-request Scripts**

Add this to your collection's pre-request script to automatically set tokens:

```javascript
// Auto-set authorization header if token exists
if (pm.environment.get("admin_token")) {
  pm.request.headers.add({
    key: "Authorization",
    value: "Bearer " + pm.environment.get("admin_token"),
  });
}
```

## 🧪 **Test Scenarios**

### **Scenario 1: Complete User Workflow**

1. Login as admin
2. Create a new agent user
3. Login as the new agent
4. Create a lead
5. Update lead status
6. Delete the lead

### **Scenario 2: Dialer Integration**

1. Create a lead from dialer system
2. Verify lead appears in agent dashboard
3. Update lead from CRM
4. Test lead status changes

### **Scenario 3: Role-Based Access**

1. Test admin access to all endpoints
2. Test agent access to limited endpoints
3. Test unauthorized access attempts

## 📊 **Expected Response Formats**

### **Success Response**

```json
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}
```

### **Error Response**

```json
{
    "success": false,
    "error": "Error message",
    "details": { ... }
}
```

### **Lead Response**

```json
{
  "id": 1,
  "full_name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "notes": "Interested in solar panels",
  "status": "new",
  "created_at": "2025-01-06T10:00:00Z",
  "updated_at": "2025-01-06T10:00:00Z",
  "assigned_to": {
    "id": 1,
    "username": "agent1",
    "first_name": "Agent",
    "last_name": "One"
  }
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: 401 Unauthorized**

- **Cause**: Missing or invalid token
- **Solution**: Re-login and get a fresh token

### **Issue 2: 403 Forbidden**

- **Cause**: Insufficient permissions
- **Solution**: Use admin account or check user role

### **Issue 3: 404 Not Found**

- **Cause**: Wrong endpoint URL
- **Solution**: Check the endpoint URL and ensure server is running

### **Issue 4: 500 Internal Server Error**

- **Cause**: Server-side error
- **Solution**: Check Django server logs for detailed error information

## 📈 **Performance Testing**

### **Load Testing with Postman**

1. Create a collection with multiple requests
2. Use Postman's Collection Runner
3. Set iterations to 10-50
4. Monitor response times and success rates

### **Concurrent User Testing**

1. Create multiple environment variables for different users
2. Run requests simultaneously
3. Test database consistency

## 🔍 **Debugging Tips**

### **Enable Request/Response Logging**

1. Go to Postman Settings
2. Enable "Request/Response Logging"
3. Check Console for detailed logs

### **Use Postman Console**

- Press `Ctrl+Alt+C` (Windows) or `Cmd+Option+C` (Mac)
- View detailed request/response information

### **Test with Different Data**

- Test with valid data
- Test with invalid data
- Test with missing required fields
- Test with edge cases (very long strings, special characters)

## 📚 **Additional Resources**

- **Django REST Framework**: https://www.django-rest-framework.org/
- **Postman Documentation**: https://learning.postman.com/
- **API Testing Best Practices**: https://blog.postman.com/api-testing-best-practices/

## 🎯 **Quick Test Checklist**

- [ ] Server is running on `http://localhost:8000`
- [ ] Can login and get token
- [ ] Can create users
- [ ] Can create leads
- [ ] Can update leads
- [ ] Can delete leads
- [ ] Dialer integration works
- [ ] Role-based access works
- [ ] Error handling works
- [ ] All CRUD operations work

---

**Happy Testing! 🚀**
