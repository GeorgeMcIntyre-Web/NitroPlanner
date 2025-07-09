# Development Guide

This guide covers the professional development setup for NitroPlanner, including best practices, workflows, and troubleshooting.

## 🏗️ Architecture Overview

NitroPlanner follows a modern, scalable architecture:

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and React Query
- **Backend**: Node.js with Express, TypeScript, and Prisma ORM
- **Database**: PostgreSQL with Redis for caching
- **Containerization**: Docker with multi-stage builds
- **Testing**: Jest for both frontend and backend
- **Linting**: ESLint with TypeScript support
- **CI/CD**: Ready for GitHub Actions or similar

## 🚀 Development Workflows

### 1. Local Development (Recommended)

This is the fastest way to develop and debug:

```bash
# Initial setup (one-time)
npm run setup

# Start development
npm run dev
```

**Benefits:**
- Fast hot reloading
- Direct access to logs
- Easy debugging with VS Code
- No Docker overhead

### 2. Docker Development

For consistent environments across team members:

```bash
# Start with Docker
npm run docker:up

# View logs
npm run docker:logs
```

**Benefits:**
- Consistent environment
- Includes all services (DB, Redis)
- Production-like setup
- Easy to share configurations

### 3. Hybrid Approach

Run services individually based on needs:

```bash
# Start only database and Redis
docker-compose up -d postgres redis

# Start backend locally
npm run dev:backend

# Start frontend locally
npm run dev:frontend
```

## 📁 Project Structure

```
NitroPlanner/
├── backend/                    # Node.js/TypeScript API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── types/            # TypeScript type definitions
│   │   └── index.ts          # Main application entry
│   ├── prisma/               # Database schema and migrations
│   ├── tests/                # Backend tests
│   ├── Dockerfile            # Backend container
│   └── package.json
├── frontend/                  # Next.js React application
│   ├── components/           # Reusable React components
│   ├── pages/               # Next.js pages
│   ├── contexts/            # React contexts
│   ├── utils/               # Utility functions
│   ├── __tests__/           # Frontend tests
│   ├── Dockerfile           # Frontend container
│   └── package.json
├── scripts/                  # Development scripts
│   └── dev.ps1              # Windows PowerShell script
├── docs/                    # Documentation
├── docker-compose.yml       # Docker orchestration
├── env.example              # Environment variables template
└── package.json            # Root workspace configuration
```

## 🔧 Development Tools

### Code Quality

#### Backend (TypeScript/Node.js)

```bash
cd backend

# Linting
npm run lint                 # Check for issues
npm run lint:fix            # Auto-fix issues

# Type checking
npm run type-check          # TypeScript compilation check

# Testing
npm run test                # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

#### Frontend (Next.js/React)

```bash
cd frontend

# Linting
npm run lint                # ESLint check

# Testing
npm run test                # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Database Management

```bash
# Backend directory
cd backend

# Migrations
npm run db:migrate          # Create and apply migrations
npm run db:deploy           # Deploy migrations to production
npm run db:reset            # Reset database (development only)

# Database tools
npm run db:studio           # Open Prisma Studio (GUI)
npm run db:seed             # Seed with sample data
```

### Building for Production

```bash
# Build both applications
npm run build

# Build individually
npm run build:backend
npm run build:frontend
```

## 🌐 Environment Configuration

### Environment Variables

Copy the example file and configure:

```bash
cp env.example .env
```

#### Key Variables

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `CORS_ORIGIN`: Allowed frontend origins
- `PORT`: Server port (default: 5000)

**Frontend:**
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_APP_URL`: Frontend URL

**Development:**
- `NODE_ENV`: Set to "development"
- `REDIS_URL`: Redis connection (optional for caching)

### Database Setup

The application uses PostgreSQL with Prisma ORM:

1. **Local PostgreSQL**: Install and configure
2. **Docker PostgreSQL**: Use `docker-compose up postgres`
3. **Cloud PostgreSQL**: Update `DATABASE_URL`

```bash
# Setup database (creates tables and seeds data)
npm run db:setup
```

## 🧪 Testing Strategy

### Backend Testing

**Test Structure:**
```
backend/tests/
├── unit/                   # Unit tests
├── integration/           # Integration tests
├── e2e/                  # End-to-end tests
└── fixtures/             # Test data
```

**Running Tests:**
```bash
cd backend

# All tests
npm run test

# Specific test file
npm test -- tests/auth.test.ts

# With coverage
npm run test:coverage
```

### Frontend Testing

**Test Structure:**
```
frontend/__tests__/
├── components/            # Component tests
├── pages/                # Page tests
└── utils/                # Utility tests
```

**Running Tests:**
```bash
cd frontend

# All tests
npm run test

# Specific test
npm test -- components/Button.test.tsx

# With coverage
npm run test:coverage
```

### Testing Best Practices

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test API endpoints and database operations
3. **E2E Tests**: Test complete user workflows
4. **Mock External Services**: Use MSW for API mocking
5. **Test Data**: Use factories and fixtures for consistent data

## 🐳 Docker Development

### Container Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Database)    │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Cache)       │
                       │   Port: 6379    │
                       └─────────────────┘
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild images
docker-compose build --no-cache

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Development with Docker

**Option 1: Full Containerized**
```bash
# All services in containers
docker-compose up -d
```

**Option 2: Hybrid**
```bash
# Database in container, apps locally
docker-compose up -d postgres redis
npm run dev:backend
npm run dev:frontend
```

## 🔍 Debugging

### Backend Debugging

**VS Code Configuration:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

**Logging:**
```typescript
// Use structured logging
console.log('User created:', { userId, email, role });
console.error('Database error:', { error: err.message, query });
```

### Frontend Debugging

**React Developer Tools**: Install browser extension
**Next.js Debug**: Use `NODE_OPTIONS='--inspect' npm run dev`

### Database Debugging

**Prisma Studio:**
```bash
cd backend
npm run db:studio
```

**Direct Database Access:**
```bash
# Connect to PostgreSQL
psql postgresql://nitro_user:nitro_password@localhost:5432/nitro_planner
```

## 📊 Performance Optimization

### Backend Optimization

1. **Database Queries**: Use Prisma query optimization
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Compression**: Enable gzip compression
4. **Rate Limiting**: Implement API rate limiting

### Frontend Optimization

1. **Code Splitting**: Use Next.js dynamic imports
2. **Image Optimization**: Use Next.js Image component
3. **Bundle Analysis**: Use `@next/bundle-analyzer`
4. **Caching**: Implement service workers

## 🔒 Security Best Practices

### Backend Security

1. **Input Validation**: Use Joi or express-validator
2. **Authentication**: JWT with proper expiration
3. **Authorization**: Role-based access control
4. **CORS**: Configure allowed origins
5. **Helmet**: Security headers middleware

### Frontend Security

1. **XSS Prevention**: Use React's built-in protection
2. **CSRF Protection**: Implement CSRF tokens
3. **Environment Variables**: Only expose public variables
4. **Content Security Policy**: Configure CSP headers

## 🚀 Deployment Preparation

### Production Build

```bash
# Build both applications
npm run build

# Test production builds
npm run start:backend
npm run start:frontend
```

### Environment Variables

Create production-specific environment files:
- `.env.production`
- `.env.staging`

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run production stack
docker-compose -f docker-compose.prod.yml up -d
```

## 🆘 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find process using port
netstat -ano | findstr :5000
# Kill process
taskkill /PID <process_id> /F
```

**Database Connection Issues:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
# Check logs
docker-compose logs postgres
```

**Node Modules Issues:**
```bash
# Clean and reinstall
npm run clean
npm run install:all
```

**Docker Issues:**
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

### Getting Help

1. Check the logs: `npm run docker:logs`
2. Verify environment variables
3. Check database connectivity
4. Review the [README.md](../README.md)
5. Open an issue on GitHub

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started) 