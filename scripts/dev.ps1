# NitroPlanner Professional Development Script for Windows
param(
    [switch]$Docker,
    [switch]$Local,
    [switch]$Setup
)

Write-Host "NitroPlanner Development Environment" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to check Node.js version
function Test-NodeVersion {
    try {
        $nodeVersion = node --version
        $majorVersion = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
        if ($majorVersion -lt 18) {
            Write-Host "Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
            return $false
        }
        Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
        return $false
    }
}

# Function to check Docker
function Test-Docker {
    if (Test-Command "docker") {
        Write-Host "Docker is available" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Docker is not available" -ForegroundColor Yellow
        return $false
    }
}

# Function to setup project
function Setup-Project {
    Write-Host "`nSetting up NitroPlanner project..." -ForegroundColor Yellow
    
    # Install root dependencies
    Write-Host "Installing root dependencies..." -ForegroundColor Yellow
    npm install
    
    # Install backend dependencies
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    
    # Install frontend dependencies
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    
    # Setup database
    Write-Host "Setting up database..." -ForegroundColor Yellow
    npm run db:setup
    
    Write-Host "`nProject setup complete!" -ForegroundColor Green
}

# Function to start Docker environment
function Start-DockerEnvironment {
    Write-Host "`nStarting Docker environment..." -ForegroundColor Yellow
    
    if (-not (Test-Docker)) {
        Write-Host "Docker is required for this option. Please install Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    # Build and start containers
    Write-Host "Building and starting containers..." -ForegroundColor Yellow
    docker-compose up -d --build
    
    Write-Host "`nDocker environment started!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Database: localhost:5432" -ForegroundColor Cyan
    Write-Host "Redis: localhost:6379" -ForegroundColor Cyan
    
    Write-Host "`nTo view logs: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
}

# Function to start local environment
function Start-LocalEnvironment {
    Write-Host "`nStarting local development environment..." -ForegroundColor Yellow
    
    if (-not (Test-NodeVersion)) {
        exit 1
    }
    
    # Check if dependencies are installed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Dependencies not found. Running setup..." -ForegroundColor Yellow
        Setup-Project
    }
    
    # Start both backend and frontend concurrently
    Write-Host "Starting backend and frontend..." -ForegroundColor Yellow
    npm run dev
    
    Write-Host "`nLocal development environment started!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
}

# Main execution
if ($Setup) {
    Setup-Project
    exit 0
}

if ($Docker) {
    Start-DockerEnvironment
    exit 0
}

if ($Local) {
    Start-LocalEnvironment
    exit 0
}

# Default behavior - show options
Write-Host "`nAvailable options:" -ForegroundColor Yellow
Write-Host "  -Setup    : Install dependencies and setup database" -ForegroundColor White
Write-Host "  -Local    : Start local development environment" -ForegroundColor White
Write-Host "  -Docker   : Start Docker environment" -ForegroundColor White
Write-Host "`nExamples:" -ForegroundColor Yellow
Write-Host "  .\scripts\dev.ps1 -Setup" -ForegroundColor White
Write-Host "  .\scripts\dev.ps1 -Local" -ForegroundColor White
Write-Host "  .\scripts\dev.ps1 -Docker" -ForegroundColor White 