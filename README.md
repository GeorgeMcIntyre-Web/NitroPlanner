# NitroPlanner

AI-powered project management system with digital twin capabilities.

## 📚 **Documentation**

- **[Terminology Guide](./docs/TERMINOLOGY_GUIDE.md)** - Complete guide to all terms and concepts
- **[Development Guide](./docs/DEVELOPMENT.md)** - Development setup and best practices
- **[Digital Twin Guide](./docs/DIGITAL_TWIN_GUIDE.md)** - Digital twin system documentation
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Feature implementation overview

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Docker** (optional, for containerized development)
- **PostgreSQL** (if running locally without Docker)

### Development Setup

#### Option 1: Local Development (Recommended for development)

```bash
# Clone the repository
git clone https://github.com/yourusername/NitroPlanner.git
cd NitroPlanner

# Install all dependencies and setup database
npm run setup

# Start development servers
npm run dev
```

#### Option 2: Docker Development (Recommended for consistency)

```bash
# Clone the repository
git clone https://github.com/yourusername/NitroPlanner.git
cd NitroPlanner

# Start with Docker
npm run docker:up
```

#### Option 3: Windows PowerShell Script

```powershell
# Setup project
.\scripts\dev.ps1 -Setup

# Start local development
.\scripts\dev.ps1 -Local

# Start Docker environment
.\scripts\dev.ps1 -Docker
```

## 📁 Project Structure

```
NitroPlanner/
├── backend/                 # Node.js/TypeScript API
│   ├── src/
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── frontend/               # Next.js React application
│   ├── components/
│   ├── pages/
│   └── package.json
├── scripts/                # Development scripts
├── docker-compose.yml      # Docker orchestration
└── package.json           # Root workspace configuration
```

## 🛠️ Available Scripts

### Root Level Commands

```bash
# Development
npm run dev                 # Start both backend and frontend
npm run dev:backend         # Start only backend
npm run dev:frontend        # Start only frontend

# Building
npm run build              # Build both applications
npm run build:backend      # Build backend only
npm run build:frontend     # Build frontend only

# Database
npm run db:setup           # Run migrations and seed data
npm run db:reset           # Reset database and seed

# Testing
npm run test               # Run all tests
npm run test:backend       # Run backend tests
npm run test:frontend      # Run frontend tests

# Linting
npm run lint               # Lint all code
npm run lint:backend       # Lint backend code
npm run lint:frontend      # Lint frontend code

# Docker
npm run docker:up          # Start Docker environment
npm run docker:down        # Stop Docker environment
npm run docker:build       # Build Docker images
npm run docker:logs        # View Docker logs
```

### Backend Commands

```bash
cd backend

# Development
npm run dev                # Start with nodemon
npm run build              # Build TypeScript
npm run start              # Start production server

# Database
npm run db:migrate         # Run migrations
npm run db:deploy          # Deploy migrations
npm run db:studio          # Open Prisma Studio
npm run db:seed            # Seed database

# Testing
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage

# Code Quality
npm run lint               # Lint code
npm run lint:fix           # Fix linting issues
npm run type-check         # TypeScript type checking
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev                # Start Next.js development server
npm run build              # Build for production
npm run start              # Start production server

# Testing
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage

# Linting
npm run lint               # Lint code
```

## 🌐 Access Points

After starting the development environment:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio` in backend)

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure your environment:

```bash
cp env.example .env
```