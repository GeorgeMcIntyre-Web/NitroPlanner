# NitroPlanner Development Script for Windows
Write-Host "Starting NitroPlanner Development Environment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Python is installed
try {
    python --version | Out-Null
    Write-Host "Python is installed" -ForegroundColor Green
} catch {
    Write-Host "Python is not installed. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
    Write-Host "Node.js is installed" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    npm --version | Out-Null
    Write-Host "npm is installed" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "`nSetting up backend..." -ForegroundColor Yellow

# Navigate to backend directory
Set-Location backend

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python app.py"

# Navigate back to root
Set-Location ..

Write-Host "`nSetting up frontend..." -ForegroundColor Yellow

# Navigate to frontend directory
Set-Location frontend

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# Navigate back to root
Set-Location ..

Write-Host "`nDevelopment servers started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nPress any key to stop all servers..." -ForegroundColor Yellow

# Wait for user input to stop
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nStopping development servers..." -ForegroundColor Yellow

# Stop all Python and Node processes
Get-Process | Where-Object {$_.ProcessName -eq "python" -or $_.ProcessName -eq "node"} | Stop-Process -Force

Write-Host "Development servers stopped" -ForegroundColor Green 