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
```

### Manual Setup
```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
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

## 📁 Project Structure
```
nitro-planner/
├── backend/          # Flask API with AI integration
│   ├── app.py        # Main Flask application
│   ├── app_simple.py # Simplified version for testing
│   ├── seed_data.py  # Database seeding
│   └── requirements.txt
├── frontend/         # Next.js UI
│   ├── pages/        # Next.js pages
│   ├── components/   # React components
│   └── package.json
├── scripts/          # Development scripts
├── docs/            # Documentation
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=sqlite:///nitro_planner.db  # or PostgreSQL URL
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
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
- **AI/ML**: Abacus.ai integration with custom algorithms
- **Real-time**: WebSocket support with Socket.IO
- **Deployment**: Railway (dev) → AWS/Azure (prod)

## 📊 Core Features

### 🎯 Role-Based Dashboards (41+ Specialized Roles)
- **Design Roles**: Mechanical, Electrical, Tooling, Layout Designers
- **Engineering Roles**: Simulation, Manufacturing, Quality, Robotics Engineers
- **Technical Roles**: CNC Programmers, Technicians, Operators
- **Management Roles**: Project, Engineering, Operations Managers
- **Support Roles**: Coordinators, Planners, Specialists

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
```

### Code Quality
```bash
# Backend linting
cd backend
black .
flake8 .

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
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Comprehensive data validation and sanitization
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **XSS Prevention**: React with built-in XSS protection
- **Environment Variable Management**: Secure configuration handling

## 📚 API Documentation

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