#!/bin/bash

echo "🚀 NitroPlanner Setup Script"
echo "=============================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Install backend dependencies
echo "🐍 Installing Python dependencies..."
cd backend
python3 -m pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Commit your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Initial NitroPlanner setup'"
echo "   git remote add origin <your-github-repo-url>"
echo "   git push -u origin main"
echo ""
echo "2. Follow the Railway deployment guide:"
echo "   cat RAILWAY_DEPLOYMENT.md"
echo ""
echo "3. Or visit: https://railway.app to start deploying!"
echo ""
echo "Happy coding! 🚀" 