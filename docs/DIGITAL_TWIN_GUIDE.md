# Digital Twin System Guide

## 🎯 Overview

The Digital Twin system in NitroPlanner creates comprehensive digital representations of users, including their professional profiles, skills, availability, workload capacity, and performance metrics. This system enables smart work assignments, capacity management, and performance insights.

## 🚀 Features

### Core Features
- **Professional Profile Management**: Complete professional background and expertise tracking
- **Skills & Expertise**: Technical and soft skills with proficiency levels
- **Availability Tracking**: Real-time status and working hours
- **Workload Capacity**: Personal capacity limits and preferences
- **Performance Metrics**: Task completion rates, quality scores, and efficiency tracking
- **Smart Work Assignment**: AI-powered recommendations based on skills and capacity
- **Team Capacity Dashboard**: Project manager view of team utilization
- **Real-time Alerts**: Capacity overload notifications

### Advanced Features
- **Learning Path Recommendations**: Personalized skill development suggestions
- **Performance Analytics**: Historical trends and improvement opportunities
- **Collaboration Insights**: Team interaction and communication patterns
- **Capacity Forecasting**: Predictive workload planning

## 🛠️ Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Database Setup
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Test the System
```bash
# Run the test script
./scripts/test-digital-twin.ps1
```

## 📱 User Journey

### For New Users
1. **Access Digital Twin**: Navigate to `/digital-twin`
2. **Setup Wizard**: Complete the guided setup at `/digital-twin-setup`
3. **Profile Creation**: Add professional information, skills, and preferences
4. **Start Using**: Begin receiving smart work assignments and insights

### For Existing Users
1. **Dashboard Access**: View comprehensive profile at `/digital-twin`
2. **Edit Profile**: Update information as needed
3. **Monitor Performance**: Track metrics and improvements
4. **Team View**: Access team capacity at `/team-capacity`

## 🎨 UI Components

### Dashboard Layout
- **Header**: User info and quick actions
- **Metrics Cards**: Key performance indicators
- **Profile Section**: Professional information and skills
- **Current Work**: Active assignments and tasks
- **Sidebar**: Availability, capacity, and quick actions

### Setup Wizard
- **Welcome Step**: Introduction and benefits
- **Professional Profile**: Background and experience
- **Skills & Expertise**: Technical and soft skills
- **Availability**: Working hours and preferences
- **Capacity**: Workload limits and preferences
- **Review**: Final confirmation and completion

## 🔧 API Endpoints

### Core Endpoints
```
GET    /api/digital-twin/me                    # Get complete profile
POST   /api/digital-twin/professional-profile  # Create/update profile
POST   /api/digital-twin/skills                # Add/update skills
POST   /api/digital-twin/availability          # Set availability
POST   /api/digital-twin/workload-capacity     # Set capacity
POST   /api/digital-twin/performance-metrics   # Update metrics
```

### Analytics Endpoints
```
GET    /api/digital-twin/analytics             # Performance analytics
GET    /api/digital-twin/team-capacity         # Team capacity view
GET    /api/digital-twin/capacity-alerts       # Overload alerts
```

### Smart Assignment Endpoints
```
GET    /api/work-units/recommendations         # AI recommendations
POST   /api/work-units/assign                  # Smart assignment
```

## 📊 Data Models

### Professional Profile
```typescript
{
  title: string;
  yearsOfExperience: number;
  specialization: string;
  bio: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}
```

### Skills
```typescript
{
  name: string;
  level: number; // 1-10
  category: 'technical' | 'soft' | 'tools' | 'languages';
}
```

### Availability
```typescript
{
  currentStatus: 'available' | 'busy' | 'away' | 'offline';
  workingHours: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  timezone: string;
  preferredContactMethod: string;
}
```

### Workload Capacity
```typescript
{
  maxConcurrentTasks: number;
  preferredTaskTypes: string[];
  stressLevel: 'low' | 'medium' | 'high';
  energyLevel: 'low' | 'medium' | 'high';
  focusLevel: 'low' | 'medium' | 'high';
}
```

## 🎯 Use Cases

### For Individual Users
- **Skill Development**: Track progress and identify learning opportunities
- **Work-Life Balance**: Monitor capacity and avoid overload
- **Career Growth**: Showcase expertise and achievements
- **Performance Tracking**: Measure productivity and quality

### For Project Managers
- **Team Optimization**: Balance workload across team members
- **Resource Planning**: Identify capacity gaps and surpluses
- **Skill Matching**: Assign work to best-suited team members
- **Performance Management**: Track team productivity and quality

### For Organizations
- **Talent Management**: Identify skill gaps and training needs
- **Capacity Planning**: Optimize resource allocation
- **Performance Analytics**: Measure organizational productivity
- **Strategic Planning**: Align skills with business objectives

## 🔍 Monitoring & Analytics

### Key Metrics
- **Capacity Utilization**: Current workload vs. maximum capacity
- **Skill Match**: Alignment between skills and assigned work
- **Performance Trend**: Historical performance patterns
- **Availability Score**: Real-time availability status
- **Overall Capacity**: Remaining capacity for new work

### Alerts & Notifications
- **Overload Alerts**: When users exceed 90% capacity
- **High Utilization Warnings**: When approaching capacity limits
- **Performance Drops**: When metrics decline significantly
- **Availability Changes**: When status changes

## 🚀 Future Enhancements

### Planned Features
- **AI-Powered Insights**: Machine learning recommendations
- **Integration APIs**: Connect with external tools
- **Mobile App**: Native mobile experience
- **Advanced Analytics**: Predictive modeling and forecasting
- **Gamification**: Skill badges and achievements
- **Social Features**: Team collaboration and knowledge sharing

### Technical Improvements
- **Real-time Updates**: WebSocket connections for live data
- **Offline Support**: Work without internet connection
- **Advanced Security**: Enhanced authentication and authorization
- **Performance Optimization**: Faster loading and response times
- **Scalability**: Support for large organizations

## 🐛 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check if port 3001 is available
netstat -an | findstr :3001

# Kill process if needed
taskkill /F /PID <process_id>
```

#### Database Connection Issues
```bash
# Reset database
cd backend
npx prisma migrate reset
npx prisma generate
```

#### Frontend Build Errors
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
```bash
# Backend with debug logging
cd backend
DEBUG=* npm run dev

# Frontend with debug logging
cd frontend
NODE_ENV=development npm run dev
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check the console logs for error messages
4. Contact the development team

## 📝 Contributing

To contribute to the Digital Twin system:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 