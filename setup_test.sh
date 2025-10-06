#!/bin/bash
# Setup script for testing the dialer integration

echo "🎭 Dialer Integration Test Setup"
echo "================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if Django server is running
echo "🔍 Checking if Django server is running..."
if curl -s http://localhost:8000/api/leads/ > /dev/null 2>&1; then
    echo "✅ Django server is running"
else
    echo "❌ Django server is not running"
    echo "   Please start it with: cd backend && python manage.py runserver"
    echo "   Then run this script again."
    exit 1
fi

# Check if we have the required agents
echo "🔍 Checking for test agents..."
echo "   Note: Make sure you have agents with usernames 'agent1' and 'agent2'"
echo "   You can create them in Django admin or via the API"

# Make the simulation script executable
chmod +x simulate_dialer_integration.py

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Open agent_dashboard_simulation.html in your browser"
echo "2. Run the simulation: python3 simulate_dialer_integration.py"
echo "3. Watch the dashboard for new leads appearing"
echo ""
echo "🎯 Test Scenarios:"
echo "• Full simulation: Creates leads over time"
echo "• Validation tests: Tests error handling"
echo "• Both: Complete test suite"
echo ""
echo "💡 Tips:"
echo "• Keep the HTML page open while running the simulation"
echo "• Switch between agents to see different lead sets"
echo "• Watch for toast notifications and auto-refresh"
echo "• Check the Django server logs for API calls"

