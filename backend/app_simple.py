from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO, emit
import os
from datetime import datetime, timedelta
import json
from enum import Enum

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///nitro_planner.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
socketio = SocketIO(app, cors_allowed_origins="*")

# CORS configuration
CORS(app, origins=[os.getenv('CORS_ORIGIN', 'http://localhost:3000')])

# Enums for Unit of Work
class WorkUnitType(Enum):
    DESIGN = "design"
    SIMULATION = "simulation"
    MANUFACTURING = "manufacturing"
    TESTING = "testing"
    DOCUMENTATION = "documentation"

class RoleType(Enum):
    DESIGNER = "designer"
    ENGINEER = "engineer"
    TECHNICIAN = "technician"
    MANAGER = "manager"

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    avatar = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='active')
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    budget = db.Column(db.Float)
    priority = db.Column(db.String(20), default='medium')
    progress = db.Column(db.Float, default=0.0)  # 0-100%
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')  # pending, in_progress, review, completed
    priority = db.Column(db.String(20), default='medium')
    assigned_to = db.Column(db.Integer, db.ForeignKey('user.id'))
    due_date = db.Column(db.DateTime)
    estimated_hours = db.Column(db.Float)
    actual_hours = db.Column(db.Float)
    progress = db.Column(db.Float, default=0.0)  # 0-100%
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Time tracking fields
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    time_spent = db.Column(db.Float)
    efficiency_score = db.Column(db.Float)
    
    # Kanban fields
    kanban_column = db.Column(db.String(50), default='backlog')  # backlog, todo, in_progress, review, done
    
    # Gantt fields
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    dependencies = db.Column(db.JSON)  # List of task IDs this task depends on

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'NitroPlanner API is running'})

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'department': user.department
    } for user in users])

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = User(
        username=data['username'],
        email=data['email'],
        role=data['role'],
        department=data['department']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'id': user.id, 'message': 'User created successfully'})

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = Project.query.all()
    return jsonify([{
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'status': project.status,
        'start_date': project.start_date.isoformat() if project.start_date else None,
        'end_date': project.end_date.isoformat() if project.end_date else None,
        'budget': project.budget,
        'priority': project.priority,
        'progress': project.progress
    } for project in projects])

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    project = Project(
        name=data['name'],
        description=data.get('description', ''),
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
        budget=data.get('budget'),
        priority=data.get('priority', 'medium')
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({'id': project.id, 'message': 'Project created successfully'})

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    project_id = request.args.get('project_id', type=int)
    if project_id:
        tasks = Task.query.filter_by(project_id=project_id).all()
    else:
        tasks = Task.query.all()
    
    return jsonify([{
        'id': task.id,
        'project_id': task.project_id,
        'name': task.name,
        'description': task.description,
        'status': task.status,
        'priority': task.priority,
        'assigned_to': task.assigned_to,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'estimated_hours': task.estimated_hours,
        'actual_hours': task.actual_hours,
        'progress': task.progress,
        'started_at': task.started_at.isoformat() if task.started_at else None,
        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
        'time_spent': task.time_spent,
        'efficiency_score': task.efficiency_score,
        'kanban_column': task.kanban_column,
        'start_date': task.start_date.isoformat() if task.start_date else None,
        'end_date': task.end_date.isoformat() if task.end_date else None,
        'dependencies': task.dependencies
    } for task in tasks])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    task = Task(
        project_id=data['project_id'],
        name=data['name'],
        description=data.get('description', ''),
        priority=data.get('priority', 'medium'),
        assigned_to=data.get('assigned_to'),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        estimated_hours=data.get('estimated_hours'),
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
        dependencies=data.get('dependencies', [])
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'id': task.id, 'message': 'Task created successfully'})

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'name' in data:
        task.name = data['name']
    if 'description' in data:
        task.description = data['description']
    if 'status' in data:
        task.status = data['status']
    if 'priority' in data:
        task.priority = data['priority']
    if 'assigned_to' in data:
        task.assigned_to = data['assigned_to']
    if 'progress' in data:
        task.progress = data['progress']
    if 'kanban_column' in data:
        task.kanban_column = data['kanban_column']
    if 'start_date' in data and data['start_date']:
        task.start_date = datetime.fromisoformat(data['start_date'])
    if 'end_date' in data and data['end_date']:
        task.end_date = datetime.fromisoformat(data['end_date'])
    
    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

@app.route('/api/kanban/<int:project_id>', methods=['GET'])
def get_kanban_board(project_id):
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    kanban_data = {
        'backlog': [],
        'todo': [],
        'in_progress': [],
        'review': [],
        'done': []
    }
    
    for task in tasks:
        task_data = {
            'id': task.id,
            'name': task.name,
            'description': task.description,
            'priority': task.priority,
            'assigned_to': task.assigned_to,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'progress': task.progress,
            'estimated_hours': task.estimated_hours,
            'actual_hours': task.actual_hours,
            'started_at': task.started_at.isoformat() if task.started_at else None,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'time_spent': task.time_spent,
            'efficiency_score': task.efficiency_score,
            'status': task.status
        }
        
        column = task.kanban_column if task.kanban_column in kanban_data else 'backlog'
        kanban_data[column].append(task_data)
    
    return jsonify(kanban_data)

@app.route('/api/kanban/task/<int:task_id>', methods=['PUT'])
def update_kanban_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'kanban_column' in data:
        task.kanban_column = data['kanban_column']
        # Update status based on column
        column_status_map = {
            'backlog': 'pending',
            'todo': 'pending',
            'in_progress': 'in_progress',
            'review': 'review',
            'done': 'completed'
        }
        task.status = column_status_map.get(data['kanban_column'], 'pending')
    
    if 'progress' in data:
        task.progress = data['progress']
    
    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

@app.route('/api/gantt/<int:project_id>', methods=['GET'])
def get_gantt_data(project_id):
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    gantt_tasks = []
    for task in tasks:
        gantt_task = {
            'id': task.id,
            'name': task.name,
            'start': task.start_date.isoformat() if task.start_date else None,
            'end': task.end_date.isoformat() if task.end_date else None,
            'progress': task.progress,
            'dependencies': task.dependencies or [],
            'assigned_to': task.assigned_to,
            'priority': task.priority,
            'status': task.status
        }
        gantt_tasks.append(gantt_task)
    
    return jsonify(gantt_tasks)

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_project')
def handle_join_project(data):
    print(f'Client joined project {data["project_id"]}')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000) 