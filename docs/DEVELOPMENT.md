# NitroPlanner Development Guide

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 18+**: [Download Node.js](https://nodejs.org/)
- **Git**: [Download Git](https://git-scm.com/)
- **Docker** (optional): [Download Docker](https://www.docker.com/products/docker-desktop/)

### Windows Setup
1. **Clone the repository:**
   ```powershell
   git clone <your-repo-url>
   cd NitroPlanner
   ```

2. **Run the development script:**
   ```powershell
   .\scripts\dev.ps1
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

### Manual Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Project Architecture

### Backend (Flask)
```
backend/
├── app.py              # Main Flask application
├── app_simple.py       # Simplified version for testing
├── seed_data.py        # Database seeding script
├── requirements.txt    # Python dependencies
├── Dockerfile         # Docker configuration
└── venv/              # Virtual environment (created)
```

### Frontend (Next.js)
```
frontend/
├── pages/             # Next.js pages
│   ├── index.tsx      # Dashboard
│   ├── kanban.tsx     # Kanban board
│   ├── gantt.tsx      # Gantt chart
│   ├── work-units.tsx # Work units
│   └── simulation.tsx # Monte Carlo simulation
├── components/        # React components
├── styles/           # CSS styles
├── package.json      # Node.js dependencies
└── next.config.js    # Next.js configuration
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
Create a `.env` file in the `backend/` directory:
```bash
# Database Configuration
DATABASE_URL=sqlite:///nitro_planner.db
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
PORT=5000

# Logging
LOG_LEVEL=INFO
```

#### Frontend (.env.local)
Create a `.env.local` file in the `frontend/` directory:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Environment
NODE_ENV=development

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id-here
```

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Install test dependencies
pip install pytest pytest-cov pytest-mock

# Run tests
python -m pytest

# Run tests with coverage
python -m pytest --cov=. --cov-report=html

# Run specific test file
python -m pytest tests/test_app.py
```

### Frontend Testing
```bash
cd frontend

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 🔍 Code Quality

### Backend Code Quality
```bash
cd backend

# Install linting tools
pip install black flake8 bandit

# Format code
black .

# Lint code
flake8 .

# Security check
bandit -r .
```

### Frontend Code Quality
```bash
cd frontend

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix

# Type checking
npx tsc --noEmit
```

## 🐳 Docker Development

### Using Docker Compose
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Start specific service
docker-compose up backend

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

### Using Docker Profiles
```bash
# Start with monitoring
docker-compose --profile monitoring up

# Start production-like setup
docker-compose --profile production up

# Start all profiles
docker-compose --profile monitoring --profile production up
```

## 📊 Database Management

### SQLite (Development)
The application uses SQLite by default for development:
```bash
# Database file location
backend/nitro_planner.db

# Reset database
rm backend/nitro_planner.db
python backend/seed_data.py
```

### PostgreSQL (Production)
For production, use PostgreSQL:
```bash
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/nitro_planner

# Run migrations
cd backend
flask db upgrade
```

## 🔄 API Development

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/kanban/{project_id}` - Kanban board data
- `GET /api/gantt/{project_id}` - Gantt chart data
- `POST /api/ai/predict` - AI delay prediction
- `POST /api/simulation/{project_id}` - Monte Carlo simulation

### Testing API Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Get projects
curl http://localhost:5000/api/projects

# Create project
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "description": "Test Description"}'
```

## 🚀 Deployment

### Railway Deployment
1. Follow the [Railway Deployment Guide](../RAILWAY_DEPLOYMENT.md)
2. Set up PostgreSQL database
3. Configure environment variables
4. Deploy backend and frontend services

### Local Production Testing
```bash
# Backend
cd backend
gunicorn --bind 0.0.0.0:5000 app:app

# Frontend
cd frontend
npm run build
npm start
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version

# Check virtual environment
which python  # Should point to venv

# Check dependencies
pip list

# Check logs
python app.py
```

#### Frontend Won't Start
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Issues
```bash
# Check database file
ls -la backend/nitro_planner.db

# Reset database
rm backend/nitro_planner.db
python backend/seed_data.py
```

#### CORS Issues
```bash
# Check CORS configuration in backend/app.py
# Ensure CORS_ORIGIN matches frontend URL

# Test CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:5000/api/health
```

#### WebSocket Issues
```bash
# Check WebSocket connection in browser console
# Ensure CORS settings include WebSocket support

# Test WebSocket
# Use browser developer tools to check WebSocket connection
```

### Performance Optimization

#### Backend Optimization
```bash
# Use production server
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app

# Enable caching
# Add Redis configuration

# Database optimization
# Add database indexes
# Use connection pooling
```

#### Frontend Optimization
```bash
# Build optimization
npm run build

# Bundle analysis
npm install --save-dev @next/bundle-analyzer
ANALYZE=true npm run build

# Image optimization
# Use Next.js Image component
# Optimize images with WebP format
```

## 📚 Resources

### Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [Insomnia](https://insomnia.rest/) - API testing
- [DBeaver](https://dbeaver.io/) - Database management
- [VS Code](https://code.visualstudio.com/) - Code editor

### Extensions
- Python (Microsoft)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Docker
- GitLens

## 🤝 Contributing

### Development Workflow
1. Create a feature branch
2. Make your changes
3. Add tests
4. Run linting and tests
5. Submit a pull request

### Code Standards
- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Write meaningful commit messages
- Add documentation for new features
- Include tests for new functionality

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# Merge after review
```

## 🎯 Next Steps

### Immediate Improvements
- [ ] Add comprehensive test coverage
- [ ] Implement user authentication
- [ ] Add file upload functionality
- [ ] Enhance AI predictions
- [ ] Add real-time notifications

### Long-term Goals
- [ ] Mobile app development
- [ ] Advanced AI model training
- [ ] Multi-language support
- [ ] Integration with ERP systems
- [ ] Advanced workflow automation

---

**Happy coding! 🚀** 