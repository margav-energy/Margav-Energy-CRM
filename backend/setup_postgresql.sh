#!/bin/bash

# PostgreSQL Setup Script for macOS
# This script installs PostgreSQL and sets up the database for Margav CRM

echo "=== PostgreSQL Setup for Margav CRM ==="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew is not installed. Installing Homebrew..."
    echo "Please run this command manually in your terminal:"
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "After Homebrew is installed, run this script again."
    exit 1
fi

echo "Installing PostgreSQL..."
brew install postgresql@16

echo "Starting PostgreSQL service..."
brew services start postgresql@16

# Wait a moment for PostgreSQL to start
sleep 3

echo "Creating database user 'margav_user'..."
createuser -s margav_user 2>/dev/null || echo "User might already exist or need manual creation"

echo "Setting password for user 'margav_user'..."
psql -U margav_user -d postgres -c "ALTER USER margav_user WITH PASSWORD 'margav-energy';" 2>/dev/null || echo "Password might need to be set manually"

echo "Creating database 'margav_crm'..."
createdb -U margav_user margav_crm 2>/dev/null || echo "Database might already exist"

echo ""
echo "=== Setup Complete ==="
echo "PostgreSQL should now be running."
echo "Database: margav_crm"
echo "User: margav_user"
echo "Password: margav-energy"
echo ""
echo "You can now run: python3 manage.py migrate"

