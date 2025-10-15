# PowerShell script to run Django SQLite to PostgreSQL migration
# Run this script as Administrator

Write-Host "Django SQLite to PostgreSQL Migration" -ForegroundColor Green
Write-Host "Margav Energy CRM - Migration Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found. Please install Python first." -ForegroundColor Red
    pause
    exit 1
}

# Check if PostgreSQL is installed
$postgresPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (Test-Path $postgresPath) {
    Write-Host "PostgreSQL found at: $postgresPath" -ForegroundColor Green
} else {
    Write-Host "ERROR: PostgreSQL not found at $postgresPath" -ForegroundColor Red
    Write-Host "Please install PostgreSQL 17.6 first" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "backend\manage.py")) {
    Write-Host "ERROR: manage.py not found. Please run this script from the project root directory." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Starting migration..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

# Run the migration script
try {
    python migrate_to_postgresql.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "MIGRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "Your Django CRM has been migrated to PostgreSQL." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Start backend: cd backend && python manage.py runserver" -ForegroundColor White
        Write-Host "2. Start frontend: cd frontend && npm start" -ForegroundColor White
        Write-Host "3. Access admin: http://localhost:8000/admin/" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "MIGRATION FAILED!" -ForegroundColor Red
        Write-Host "Check the error messages above for details." -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Failed to run migration script: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
