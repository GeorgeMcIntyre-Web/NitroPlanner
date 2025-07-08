#!/bin/bash

echo "🚀 NitroPlanner AI-Accelerated Setup Script"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Docker is recommended for development."
    DOCKER_AVAILABLE=false
else
    print_success "Docker is available"
    DOCKER_AVAILABLE=true
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed. Docker Compose is recommended for development."
    DOCKER_COMPOSE_AVAILABLE=false
else
    print_success "Docker Compose is available"
    DOCKER_COMPOSE_AVAILABLE=true
fi

print_success "Prerequisites check passed!"

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
else
    print_success "Git repository already exists"
fi

# Create environment files
print_status "Creating environment configuration files..."

# Backend environment file
cat > backend/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://nitro_user:nitro_password@localhost:5432/nitro_planner
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000

# AI Integration
ABACUS_AI_API_KEY=your-abacus-ai-api-key-here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# Logging
LOG_LEVEL=INFO
EOF

# Frontend environment file
cat > frontend/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Environment
NODE_ENV=development

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id-here
EOF

print_success "Environment files created"

# Install backend dependencies
print_status "Installing Python dependencies..."
cd backend
python3 -m pip install -r requirements.txt

# Install additional development dependencies
python3 -m pip install pytest pytest-cov pytest-mock black flake8 bandit
cd ..

# Install frontend dependencies
print_status "Installing Node.js dependencies..."
cd frontend
npm install

# Install additional development dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
cd ..

# Create test configuration
print_status "Setting up test configuration..."

# Backend test configuration
cat > backend/pytest.ini << EOF
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --verbose
    --cov=.
    --cov-report=html
    --cov-report=xml
    --cov-report=term-missing
    --cov-fail-under=80
EOF

# Frontend test configuration
cat > frontend/jest.config.js << EOF
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
EOF

# Create basic test files
mkdir -p backend/tests
cat > backend/tests/test_app.py << EOF
import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'
EOF

mkdir -p frontend/__tests__
cat > frontend/__tests__/index.test.tsx << EOF
import { render, screen } from '@testing-library/react'
import Home from '../pages/index'

describe('Home', () => {
  it('renders without crashing', () => {
    render(<Home />)
    expect(screen.getByText(/NitroPlanner/i)).toBeInTheDocument()
  })
})
EOF

print_success "Test configuration created"

# Create development scripts
print_status "Creating development scripts..."

cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting NitroPlanner Development Environment"

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Using Docker for development..."
    docker-compose up --build
else
    echo "🔧 Using local development environment..."
    
    # Start PostgreSQL (if available)
    if command -v pg_ctl &> /dev/null; then
        echo "Starting PostgreSQL..."
        pg_ctl start -D /usr/local/var/postgres
    fi
    
    # Start Redis (if available)
    if command -v redis-server &> /dev/null; then
        echo "Starting Redis..."
        redis-server --daemonize yes
    fi
    
    # Start backend
    echo "Starting backend..."
    cd backend
    python3 app.py &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    echo "Starting frontend..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo "Development servers started!"
    echo "Backend: http://localhost:5000"
    echo "Frontend: http://localhost:3000"
    echo "Press Ctrl+C to stop all servers"
    
    # Wait for interrupt
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
fi
EOF

chmod +x scripts/dev.sh

cat > scripts/test.sh << 'EOF'
#!/bin/bash
echo "🧪 Running NitroPlanner Tests"

# Run backend tests
echo "Testing backend..."
cd backend
python3 -m pytest
cd ..

# Run frontend tests
echo "Testing frontend..."
cd frontend
npm test
cd ..

echo "✅ All tests completed!"
EOF

chmod +x scripts/test.sh

cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying NitroPlanner"

# Check if we're on main branch
if [ "$(git branch --show-current)" != "main" ]; then
    echo "❌ Please switch to main branch before deploying"
    exit 1
fi

# Push to GitHub to trigger CI/CD
echo "Pushing to GitHub..."
git push origin main

echo "✅ Deployment triggered via CI/CD pipeline"
echo "Check GitHub Actions for deployment status"
EOF

chmod +x scripts/deploy.sh

print_success "Development scripts created"

# Create documentation
print_status "Creating documentation..."

cat > docs/DEVELOPMENT.md << 'EOF'
# NitroPlanner Development Guide

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd NitroPlanner
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Start development:**
   ```bash
   ./scripts/dev.sh
   ```

## Development Commands

- `./scripts/dev.sh` - Start development environment
- `./scripts/test.sh` - Run all tests
- `./scripts/deploy.sh` - Deploy to production

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - Flask secret key
- `ABACUS_AI_API_KEY` - Abacus.ai API key

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Testing

- Backend tests: `cd backend && python3 -m pytest`
- Frontend tests: `cd frontend && npm test`

## Docker Development

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend

# Rebuild and start
docker-compose up --build
```

## CI/CD Pipeline

The project uses GitHub Actions for:
- Automated testing
- Security scanning
- Docker image building
- Deployment to Railway

## AI Development Tools

This project leverages AI tools for accelerated development:
- Claude 4 Sonnet - Architecture and business logic
- Gemini 2.5 Pro - Code generation
- Cursor IDE - Real-time assistance
- ChatGPT - Quick queries
EOF

print_success "Documentation created"

echo ""
print_success "🎉 NitroPlanner setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your environment variables:"
echo "   - Edit backend/.env"
echo "   - Edit frontend/.env.local"
echo ""
echo "2. Start development:"
echo "   ./scripts/dev.sh"
echo ""
echo "3. Run tests:"
echo "   ./scripts/test.sh"
echo ""
echo "4. Commit your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Initial NitroPlanner setup with CI/CD'"
echo "   git remote add origin <your-github-repo-url>"
echo "   git push -u origin main"
echo ""
echo "5. Set up GitHub Secrets for CI/CD:"
echo "   - DOCKER_USERNAME"
echo "   - DOCKER_PASSWORD"
echo "   - RAILWAY_TOKEN"
echo ""
echo "6. Follow the Railway deployment guide:"
echo "   cat RAILWAY_DEPLOYMENT.md"
echo ""
echo "🚀 Happy coding with AI acceleration!" 