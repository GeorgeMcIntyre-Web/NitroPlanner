# NitroPlanner

The world's first AI-powered automotive project management system for line builder companies.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- PostgreSQL (managed by Railway)

### Local Development
```bash
# Backend
cd backend
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
├── backend/          # Flask API
├── frontend/         # Next.js UI
├── docs/            # Documentation
└── README.md
```

## 🔧 Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `ABACUS_AI_API_KEY` - Abacus.ai API key
- `CORS_ORIGIN` - Frontend URL for CORS

### Frontend  
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🏗️ Architecture
- **Frontend**: Next.js with TypeScript
- **Backend**: Flask with SQLAlchemy
- **Database**: PostgreSQL
- **AI/ML**: Abacus.ai integration
- **Deployment**: Railway (dev) → AWS/Azure (prod)

## 📊 Features
- 41+ specialized role dashboards
- AI-powered delay prediction
- CAD file integration
- Real-time collaboration
- Resource optimization 