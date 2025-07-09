# Digital Twin Test Script
# This script tests the Digital Twin API endpoints

Write-Host "🧪 Testing Digital Twin System..." -ForegroundColor Cyan

# Base URL for the API
$baseUrl = "http://localhost:5000"

# Test 1: Check if the server is running
Write-Host "`n1. Testing server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running. Please start the backend server first." -ForegroundColor Red
    Write-Host "Run: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test Digital Twin endpoints (without authentication for now)
Write-Host "`n2. Testing Digital Twin endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "/api/digital-twin/me",
    "/api/digital-twin/professional-profile",
    "/api/digital-twin/skills", 
    "/api/digital-twin/availability",
    "/api/digital-twin/workload-capacity",
    "/api/digital-twin/performance-metrics",
    "/api/digital-twin/learning-path",
    "/api/digital-twin/analytics",
    "/api/digital-twin/team-capacity",
    "/api/digital-twin/capacity-alerts"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method GET -TimeoutSec 5
        Write-Host "✅ $endpoint - Working" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "⚠️  $endpoint - Requires authentication" -ForegroundColor Yellow
        } else {
            Write-Host "❌ $endpoint - Error: $statusCode" -ForegroundColor Red
        }
    }
}

# Test 3: Test frontend connectivity
Write-Host "`n3. Testing frontend connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "✅ Frontend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend is not running. Please start the frontend server." -ForegroundColor Red
    Write-Host "Run: cd frontend && npm run dev" -ForegroundColor Yellow
}

# Test 4: Check database connectivity
Write-Host "`n4. Testing database connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health/db" -Method GET -TimeoutSec 5
    Write-Host "✅ Database is connected" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database health endpoint not available or database not connected" -ForegroundColor Yellow
}

Write-Host "`n🎉 Digital Twin System Test Complete!" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor Yellow
Write-Host "2. Navigate to /digital-twin to see the dashboard" -ForegroundColor Yellow
Write-Host "3. If no Digital Twin exists, you'll be prompted to create one" -ForegroundColor Yellow
Write-Host "4. Use the setup wizard at /digital-twin-setup to create your profile" -ForegroundColor Yellow 