# 🧪 Browser Testing Guide - Dialer Integration

## ✅ **Prerequisites**

- Django server running on `http://localhost:8000` (development) or `https://crm.margav.energy` (production)
- React server running on `http://localhost:3000` (development) or `https://crm.margav.energy` (production)
- User logged in as an agent (e.g., `agent1`)

## 🔄 **Testing Steps**

### **Step 1: Access Cold Call Dashboard**

1. Open browser and go to `http://localhost:3000` (development) or `https://crm.margav.energy` (production)
2. Login as an agent (e.g., `agent1` / `password123`)
3. Navigate to **Cold Call Dashboard**

### **Step 2: Test the "Interested" Button**

1. You should see cold call leads in the dashboard
2. Click the **"Interested"** button on any lead
3. **Expected Result**: Browser should redirect to Agent Dashboard with URL parameters

### **Step 3: Verify Auto-Population**

1. After redirect, you should see the Agent Dashboard
2. **Expected Result**:
   - Lead form should open automatically
   - Form should be prepopulated with:
     - Full Name
     - Phone
     - Email
     - Notes
   - Success notification should appear
   - URL should be cleaned (no parameters visible)

### **Step 4: Complete the Lead Form**

1. Fill in additional details:
   - Address
   - Postcode
   - Property information
   - Energy usage
   - Timeframe details
2. Click **"Complete Lead Sheet & Send to Kelly"**

### **Step 5: Verify Submission**

1. **Expected Result**:
   - Success message: "Lead updated successfully and sent to qualifier!"
   - Form should close
   - Lead should appear in the leads list with status "sent_to_kelly"

## 🐛 **Troubleshooting**

### **If redirect doesn't work:**

- Check browser console for errors
- Verify ColdCallDashboard has the redirect logic
- Check if URL parameters are being generated

### **If form doesn't auto-open:**

- Check browser console for errors
- Verify URL parameters are present
- Check AgentDashboard's `checkForDialerLead` function

### **If prepopulation doesn't work:**

- Check if URL parameters are being parsed correctly
- Verify LeadForm receives prepopulatedData
- Check browser console for errors

### **If submission fails:**

- Check browser console for errors
- Verify API endpoints are working
- Check Django server logs

## 🎯 **Success Criteria**

✅ **Cold Call Dashboard**: "Interested" button redirects instead of opening modal
✅ **Agent Dashboard**: Automatically opens with prepopulated form
✅ **Lead Form**: All dialer data is prepopulated
✅ **Submission**: Lead is updated and sent to qualifier
✅ **User Experience**: Smooth, seamless workflow

## 📝 **Test Data**

Use this test data for manual testing:

**Lead Information:**

- Full Name: "John Smith"
- Phone: "+44123456789"
- Email: "john.smith@example.com"
- Notes: "Interested in solar panels, owns detached house"

**Additional Form Data:**

- Address: "123 Main Street, London"
- Postcode: "SW1A 1AA"
- Property Type: "Detached"
- Bedrooms: "4"
- Timeframe: "3-6 months"

## 🚀 **Ready to Test!**

The integration is now ready for browser testing. Follow the steps above to verify the complete dialer-to-agent-dashboard workflow.
