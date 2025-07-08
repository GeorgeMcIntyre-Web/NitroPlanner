# NitroPlanner Test Runner Script
# This script runs comprehensive tests for both backend and frontend

Write-Host "🧪 Starting NitroPlanner Test Suite..." -ForegroundColor Cyan
Write-Host ""

# Function to run backend tests
function Run-BackendTests {
    Write-Host "🔧 Running Backend Tests..." -ForegroundColor Yellow
    
    # Change to backend directory
    Set-Location backend
    
    # Check if virtual environment exists
    if (-not (Test-Path "venv")) {
        Write-Host "❌ Virtual environment not found. Please run setup first." -ForegroundColor Red
        return $false
    }
    
    # Activate virtual environment
    & "venv\Scripts\Activate.ps1"
    
    # Install test dependencies if not already installed
    Write-Host "📦 Installing test dependencies..." -ForegroundColor Blue
    pip install pytest pytest-cov pytest-mock pytest-flask factory-boy coverage
    
    # Run tests with coverage
    Write-Host "🚀 Running backend tests with coverage..." -ForegroundColor Green
    python -m pytest tests/ -v --cov=. --cov-report=html --cov-report=term-missing
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend tests passed!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Backend tests failed!" -ForegroundColor Red
        return $false
    }
}

# Function to run frontend tests
function Run-FrontendTests {
    Write-Host "🎨 Running Frontend Tests..." -ForegroundColor Yellow
    
    # Change to frontend directory
    Set-Location frontend
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "❌ Node modules not found. Please run 'npm install' first." -ForegroundColor Red
        return $false
    }
    
    # Install test dependencies if not already installed
    Write-Host "📦 Installing test dependencies..." -ForegroundColor Blue
    npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest msw
    
    # Run tests
    Write-Host "🚀 Running frontend tests..." -ForegroundColor Green
    npm test -- --coverage --watchAll=false
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend tests passed!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Frontend tests failed!" -ForegroundColor Red
        return $false
    }
}

# Function to run integration tests
function Run-IntegrationTests {
    Write-Host "🔗 Running Integration Tests..." -ForegroundColor Yellow
    
    # Start backend server in background
    Write-Host "🚀 Starting backend server..." -ForegroundColor Blue
    Set-Location backend
    & "venv\Scripts\Activate.ps1"
    Start-Process python -ArgumentList "app.py" -WindowStyle Hidden
    
    # Wait for server to start
    Start-Sleep -Seconds 5
    
    # Test API endpoints
    Write-Host "🌐 Testing API endpoints..." -ForegroundColor Blue
    
    $apiUrl = "http://localhost:5000"
    
    # Test health endpoint
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method Get
        if ($response.status -eq "healthy") {
            Write-Host "✅ Health check passed" -ForegroundColor Green
        } else {
            Write-Host "❌ Health check failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    }
    
    # Test authentication endpoints
    try {
        $registerData = @{
            username = "testuser"
            email = "test@example.com"
            password = "TestPass123"
            first_name = "Test"
            last_name = "User"
            role = "technician"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$apiUrl/api/auth/register" -Method Post -Body $registerData -ContentType "application/json"
        Write-Host "✅ Registration test passed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Registration test failed: $_" -ForegroundColor Red
    }
    
    # Stop backend server
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    
    return $true
}

# Main execution
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath

# Change to root directory
Set-Location $rootPath

Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Run backend tests
$backendSuccess = Run-BackendTests

# Return to root directory
Set-Location $rootPath

# Run frontend tests
$frontendSuccess = Run-FrontendTests

# Return to root directory
Set-Location $rootPath

# Run integration tests
$integrationSuccess = Run-IntegrationTests

# Summary
Write-Host ""
Write-Host "📊 Test Results Summary:" -ForegroundColor Cyan
Write-Host "┌─────────────┬─────────┐" -ForegroundColor Gray
Write-Host "│ Component   │ Status  │" -ForegroundColor Gray
Write-Host "├─────────────┼─────────┤" -ForegroundColor Gray

if ($backendSuccess) {
    Write-Host "│ Backend     │   ✅   │" -ForegroundColor Gray
} else {
    Write-Host "│ Backend     │   ❌   │" -ForegroundColor Gray
}

if ($frontendSuccess) {
    Write-Host "│ Frontend    │   ✅   │" -ForegroundColor Gray
} else {
    Write-Host "│ Frontend    │   ❌   │" -ForegroundColor Gray
}

if ($integrationSuccess) {
    Write-Host "│ Integration │   ✅   │" -ForegroundColor Gray
} else {
    Write-Host "│ Integration │   ❌   │" -ForegroundColor Gray
}

Write-Host "└─────────────┴─────────┘" -ForegroundColor Gray

# Overall result
if ($backendSuccess -and $frontendSuccess -and $integrationSuccess) {
    Write-Host ""
    Write-Host "🎉 All tests passed! NitroPlanner is ready for deployment." -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Please review the output above." -ForegroundColor Yellow
    exit 1
} 