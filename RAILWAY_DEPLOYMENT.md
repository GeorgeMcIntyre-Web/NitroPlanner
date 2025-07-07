# NitroPlanner Railway Deployment Guide

This guide will walk you through deploying NitroPlanner on Railway for fast, cost-effective hosting with advanced project management features.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository
- Ensure all code is committed to a GitHub repository
- Verify the project structure:
  ```
  nitro-planner/
  ├── backend/
  │   ├── app.py
  │   ├── requirements.txt
  │   └── Procfile
  ├── frontend/
  │   ├── pages/
  │   │   ├── index.tsx
  │   │   ├── kanban.tsx
  │   │   ├── gantt.tsx
  │   │   ├── work-units.tsx
  │   │   └── simulation.tsx
  │   ├── components/
  │   │   └── Navigation.tsx
  │   ├── package.json
  │   ├── next.config.js
  │   └── Procfile
  └── README.md
  ```

### 2. Set Up Railway Project

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Create a new project

#### Step 2: Add PostgreSQL Database
1. In your Railway project dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway will provision a database and provide a `DATABASE_URL`
4. Copy this URL for the next step

#### Step 3: Deploy Backend (Flask)
1. Click "Add Service" → "Deploy from GitHub repo"
2. Select your NitroPlanner repository
3. Set the **Root Directory** to `backend`
4. Railway will auto-detect Python and install dependencies
5. Add environment variables:
   - `DATABASE_URL`: Paste the PostgreSQL URL from step 2
   - `ABACUS_AI_API_KEY`: Your Abacus.ai API key (optional for testing)
   - `CORS_ORIGIN`: Will be set to frontend URL after deployment
   - `SECRET_KEY`: Generate a random secret key

#### Step 4: Deploy Frontend (Next.js)
1. Click "Add Service" → "Deploy from GitHub repo"
2. Select the same NitroPlanner repository
3. Set the **Root Directory** to `frontend`
4. Railway will auto-detect Node.js and install dependencies
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Set to your backend service URL (e.g., `https://your-backend-service.railway.app`)

### 3. Configure CORS
1. Go back to your backend service
2. Update the `CORS_ORIGIN` environment variable with your frontend URL
3. Redeploy the backend service

### 4. Test Your Deployment
1. Visit your frontend URL
2. Test all features:
   - Dashboard with role-based views
   - Kanban board with drag-and-drop
   - Gantt chart with timeline visualization
   - **Work Units with process simulation and checkpoints**
   - Monte Carlo simulation with AI predictions
3. Verify API calls are working
4. Check database connectivity

## 🔧 Environment Variables

### Backend Variables
```bash
DATABASE_URL=postgresql://username:password@host:port/database
ABACUS_AI_API_KEY=your_abacus_ai_key
CORS_ORIGIN=https://your-frontend-url.railway.app
SECRET_KEY=your_secret_key_here
PORT=5000
```

### Frontend Variables
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

## 🎯 Advanced Features

### Unit of Work System
- **Process simulation** for different roles (mechanical, electrical designers)
- **Universal checkpoints** with quality gates, reviews, and approvals
- **Role-based workflow templates** for easy setup
- **Checkpoint management** with status tracking
- **AI-powered duration estimation** for work units
- **Real-time progress monitoring** through checkpoints

### Kanban Board
- **Drag-and-drop** task management
- **Real-time updates** via WebSocket
- **Task progress tracking**
- **Priority and risk indicators**
- **Column-based workflow**

### Gantt Chart
- **Interactive timeline** visualization
- **Task dependencies** management
- **Progress tracking** with visual indicators
- **Resource allocation** overview
- **Project scheduling** tools

### Monte Carlo Simulation
- **AI-powered** project completion prediction
- **Risk analysis** with confidence intervals
- **10,000+ iterations** for accuracy
- **Visual charts** and statistics
- **Historical simulation** tracking

### AI Integration
- **Abacus.ai** platform integration
- **Delay prediction** algorithms
- **Resource optimization** suggestions
- **Risk assessment** scoring
- **Project planning** recommendations

## 📊 Monitoring & Scaling

### Railway Dashboard Features
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: Track deployment history and rollback if needed
- **Environment Variables**: Manage all configuration securely

### Scaling Options
- **Automatic**: Railway can auto-scale based on traffic
- **Manual**: Adjust resources in the dashboard
- **Custom Domains**: Add your own domain name

## 🛠️ Troubleshooting

### Common Issues

#### Backend Won't Start
- Check logs in Railway dashboard
- Verify `requirements.txt` is in the backend directory
- Ensure `Procfile` is correctly formatted
- Check for missing dependencies (numpy, scipy, etc.)

#### Frontend Build Fails
- Check Node.js version compatibility
- Verify all dependencies in `package.json`
- Check for TypeScript compilation errors
- Ensure all required packages are installed

#### Database Connection Issues
- Verify `DATABASE_URL` format
- Check if PostgreSQL service is running
- Ensure database migrations are applied
- Check for connection pool limits

#### CORS Errors
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check browser console for specific error messages
- Redeploy backend after updating CORS settings

#### WebSocket Issues
- Ensure Flask-SocketIO is properly configured
- Check for WebSocket connection errors in browser console
- Verify CORS settings include WebSocket support

### Getting Help
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Check application logs in Railway dashboard

## 💰 Cost Optimization

### Railway Pricing
- **Free Tier**: $5 credit monthly
- **Pay-as-you-go**: Only pay for what you use
- **Team Plans**: Available for larger deployments

### Cost-Saving Tips
- Use free tier for development and testing
- Monitor resource usage in dashboard
- Scale down during low-traffic periods
- Use Railway's sleep feature for dev environments
- Optimize Python dependencies to reduce build time

## 🔄 Next Steps

### Production Migration
When ready for production:
1. Consider migrating to AWS/Azure for enterprise features
2. Set up custom domain names
3. Implement SSL certificates
4. Configure backup strategies
5. Set up monitoring and alerting
6. Implement user authentication
7. Add advanced security features

### Feature Enhancements
- Add authentication system with role-based access
- Implement real-time notifications
- Integrate with Abacus.ai for advanced AI predictions
- Add CAD file upload and processing
- Implement advanced reporting and analytics
- Add team collaboration features
- Create mobile-responsive design
- Implement advanced search and filtering

## 📞 Support

For deployment issues:
1. Check Railway logs first
2. Review this deployment guide
3. Consult Railway documentation
4. Reach out to Railway support if needed

## 🎉 What You Get

After deployment, you'll have a fully functional NitroPlanner with:

✅ **Modern Dashboard** with role-based views  
✅ **Interactive Kanban Board** with drag-and-drop  
✅ **Gantt Chart** with timeline visualization  
✅ **Monte Carlo Simulation** with AI predictions  
✅ **Real-time Updates** via WebSocket  
✅ **AI-powered** project planning  
✅ **Risk Analysis** and predictions  
✅ **Responsive Design** for all devices  
✅ **PostgreSQL Database** with automatic backups  
✅ **Scalable Infrastructure** on Railway  

---

**Your advanced NitroPlanner application is now ready for deployment on Railway!** 🚀 