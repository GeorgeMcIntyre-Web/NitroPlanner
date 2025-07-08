# NitroPlanner

The world's first AI-powered automotive project management system for line builder companies.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- PostgreSQL (managed by Railway) or SQLite (local development)

### Windows Development Setup
```powershell
# Run the development script
.\scripts\dev.ps1

# Run tests
.\scripts\test.ps1
```

### Manual Setup
```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
python seed_auth_data.py     # Create demo users
python app.py

# Frontend  
cd frontend
npm install
npm run dev
```

### Railway Deployment
1. Connect GitHub repo to Railway
2. Add PostgreSQL service
3. Deploy backend service (points to `/backend`)
4. Deploy frontend service (points to `/frontend`)
5. Configure environment variables

## 🔐 Authentication System

NitroPlanner now includes a comprehensive authentication system with role-based access control.

### Demo Users
After running `python seed_auth_data.py`, you can use these demo accounts:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| demo | demo123 | Project Manager | demo@nitroplanner.com |
| admin | admin123 | Admin | admin@nitroplanner.com |
| mechanical | mechanical123 | Mechanical Designer | mechanical@nitroplanner.com |
| electrical | electrical123 | Electrical Designer | electrical@nitroplanner.com |
| simulation | simulation123 | Simulation Engineer | simulation@nitroplanner.com |
| manufacturing | manufacturing123 | Manufacturing Engineer | manufacturing@nitroplanner.com |
| quality | quality123 | Quality Engineer | quality@nitroplanner.com |
| technician | technician123 | Technician | technician@nitroplanner.com |

### Features
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** with 9 different user roles
- **Password strength validation** with security requirements
- **Email format validation** and duplicate prevention
- **Profile management** with update capabilities
- **Password change functionality** with current password verification
- **Admin user management** for user administration
- **Automatic token refresh** for seamless user experience

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/users` - Get all users (admin only)
- `PUT /api/auth/users/:id` - Update user (admin only)

## 🧪 Testing Framework

NitroPlanner includes comprehensive testing for both backend and frontend.

### Backend Testing
```bash
cd backend
python -m pytest tests/ -v --cov=. --cov-report=html
```

**Test Coverage:**
- ✅ API endpoint testing
- ✅ Authentication system testing
- ✅ Database model testing
- ✅ Error handling testing
- ✅ Integration testing

### Frontend Testing
```bash
cd frontend
npm test -- --coverage
```

**Test Coverage:**
- ✅ Component testing with React Testing Library
- ✅ Authentication context testing
- ✅ API integration testing
- ✅ User interaction testing
- ✅ Error handling testing

### Running All Tests
```powershell
# Windows
.\scripts\test.ps1

# Linux/Mac
./scripts/test.sh
```

## 📁 Project Structure
```
nitro-planner/
├── backend/          # Flask API with AI integration
│   ├── app.py        # Main Flask application
│   ├── auth.py       # Authentication routes
│   ├── models.py     # Database models
│   ├── seed_auth_data.py # Demo user creation
│   ├── tests/        # Backend tests
│   │   ├── conftest.py
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/         # Next.js UI
│   ├── pages/        # Next.js pages
│   │   ├── login.tsx # Login page
│   │   ├── register.tsx # Registration page
│   │   └── index.tsx # Dashboard (protected)
│   ├── components/   # React components
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── contexts/     # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── utils/        # Utility functions
│   │   └── api.ts    # API client
│   ├── __tests__/    # Frontend tests
│   └── package.json
├── scripts/          # Development scripts
│   ├── dev.ps1       # Development setup
│   └── test.ps1      # Test runner
├── docs/            # Documentation
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=sqlite:///nitro_planner.db  # or PostgreSQL URL
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
CORS_ORIGIN=http://localhost:3000
ABACUS_AI_API_KEY=your-abacus-ai-key
FLASK_ENV=development
PORT=5000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
```

## 🏗️ Architecture
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Flask with SQLAlchemy and AI integration
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT with Flask-JWT-Extended
- **AI/ML**: Abacus.ai integration with custom algorithms
- **Real-time**: WebSocket support with Socket.IO
- **Testing**: Pytest (backend) + Jest + React Testing Library (frontend)
- **Deployment**: Railway (dev) → AWS/Azure (prod)

## 📊 Core Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based access control** with 9 specialized roles
- **Password security** with strength validation
- **Profile management** with user preferences
- **Admin panel** for user administration

### 🎯 Role-Based Dashboards (9 Specialized Roles)
- **Admin**: System administration and user management
- **Project Manager**: Project oversight and team coordination
- **Mechanical Designer**: CAD design and mechanical engineering
- **Electrical Designer**: Electrical systems and controls
- **Simulation Engineer**: Analysis and simulation work
- **Manufacturing Engineer**: Production and manufacturing
- **Quality Engineer**: Quality assurance and testing
- **Technician**: Technical support and maintenance
- **Operator**: Equipment operation and monitoring

### 🤖 AI-Powered Features
- **Delay Prediction**: Machine learning algorithms for task completion time
- **Risk Assessment**: AI-driven risk scoring and mitigation suggestions
- **Resource Optimization**: Intelligent resource allocation recommendations
- **Process Simulation**: Monte Carlo simulations with 10,000+ iterations
- **Historical Learning**: Continuous improvement from completion data

### 📋 Advanced Project Management
- **Kanban Board**: Drag-and-drop task management with real-time updates
- **Gantt Charts**: Interactive timeline visualization with dependencies
- **Work Units**: Process simulation with checkpoints and quality gates
- **Monte Carlo Simulation**: Project completion prediction with confidence intervals
- **Time Tracking**: Detailed time analysis and efficiency scoring

### 🔄 Real-Time Collaboration
- **WebSocket Integration**: Live updates across all users
- **Multi-user Support**: Concurrent editing and collaboration
- **Activity Tracking**: Real-time progress monitoring
- **Notifications**: Instant updates on task changes

### 📈 Analytics & Reporting
- **Efficiency Analytics**: Performance metrics and optimization insights
- **Progress Tracking**: Visual progress indicators and milestone tracking
- **Resource Utilization**: Team and equipment usage analytics
- **Predictive Analytics**: AI-powered forecasting and planning

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test

# All tests
.\scripts\test.ps1
```

### Code Quality
```bash
# Backend linting
cd backend
black .
flake8 .
bandit -r .

# Frontend linting
cd frontend
npm run lint
```

### Docker Development
```bash
# Start all services
docker-compose up

# Start with monitoring
docker-compose --profile monitoring up

# Production setup
docker-compose --profile production up
```

## 🚀 Deployment

### Railway (Recommended for Development)
1. Follow the [Railway Deployment Guide](RAILWAY_DEPLOYMENT.md)
2. Set up PostgreSQL database
3. Configure environment variables
4. Deploy backend and frontend services

### Production Deployment
- **Backend**: AWS ECS, Azure Container Instances, or Kubernetes
- **Frontend**: Vercel, Netlify, or CDN
- **Database**: AWS RDS, Azure Database, or managed PostgreSQL
- **Monitoring**: Prometheus + Grafana (included in Docker setup)

## 🔐 Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Comprehensive data validation and sanitization
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **XSS Prevention**: React with built-in XSS protection
- **Environment Variable Management**: Secure configuration handling
- **Role-based Access Control**: Granular permissions system

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/projects` - List projects
- `GET /api/tasks` - List tasks
- `GET /api/kanban/{project_id}` - Kanban board data
- `GET /api/gantt/{project_id}` - Gantt chart data
- `POST /api/ai/predict` - AI delay prediction
- `POST /api/simulation/{project_id}` - Monte Carlo simulation

### WebSocket Events
- `connect` - Client connection
- `join_project` - Join project room
- `kanban_update` - Real-time kanban updates
- `task_update` - Real-time task updates

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support
- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🎯 Roadmap
- [x] **User Authentication System** - JWT-based auth with role-based access
- [x] **Comprehensive Testing** - Backend and frontend test coverage
- [ ] Advanced CAD file integration
- [ ] Mobile app development
- [ ] Advanced AI model training
- [ ] Multi-language support
- [ ] Advanced reporting dashboard
- [ ] Integration with ERP systems
- [ ] Advanced workflow automation
- [ ] Machine learning model deployment

---

**Built with ❤️ for the automotive industry** 
