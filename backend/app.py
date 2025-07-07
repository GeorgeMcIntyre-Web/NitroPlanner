from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO, emit
import os
from datetime import datetime, timedelta
import requests
import json
import numpy as np
import pandas as pd
from scipy import stats
import plotly.graph_objects as go
import plotly.express as px
from dateutil.relativedelta import relativedelta
import random
from enum import Enum
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from jose import JWTError, jwt

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///nitro_planner.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ALGORITHM'] = 'HS256'
app.config['JWT_ACCESS_TOKEN_EXPIRE_MINUTES'] = 30

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
    VALIDATION = "validation"
    MANUFACTURING = "manufacturing"
    ASSEMBLY = "assembly"
    TESTING = "testing"
    DOCUMENTATION = "documentation"

class CheckpointType(Enum):
    QUALITY_GATE = "quality_gate"
    REVIEW = "review"
    APPROVAL = "approval"
    VERIFICATION = "verification"
    VALIDATION = "validation"
    TEST = "test"

class RoleType(Enum):
    MECHANICAL_DESIGNER = "mechanical_designer"
    ELECTRICAL_DESIGNER = "electrical_designer"
    SIMULATION_ENGINEER = "simulation_engineer"
    MANUFACTURING_ENGINEER = "manufacturing_engineer"
    QUALITY_ENGINEER = "quality_engineer"
    PROJECT_MANAGER = "project_manager"

# Enhanced Database Models
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
    
    # AI prediction fields
    predicted_completion = db.Column(db.DateTime)
    confidence_score = db.Column(db.Float)
    risk_level = db.Column(db.String(20))  # low, medium, high

# Unit of Work Models
class WorkUnit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    work_unit_type = db.Column(db.String(50), nullable=False)  # design, simulation, etc.
    role_type = db.Column(db.String(50), nullable=False)  # mechanical_designer, electrical_designer, etc.
    assigned_to = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(50), default='pending')
    priority = db.Column(db.String(20), default='medium')
    estimated_hours = db.Column(db.Float)
    actual_hours = db.Column(db.Float)
    progress = db.Column(db.Float, default=0.0)  # 0-100%
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    dependencies = db.Column(db.JSON)  # List of work unit IDs this depends on
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Process simulation fields
    simulation_data = db.Column(db.JSON)  # Simulation parameters and results
    checkpoints = db.relationship('Checkpoint', backref='work_unit', lazy=True)
    
    # AI prediction fields
    predicted_delay = db.Column(db.Float)
    risk_score = db.Column(db.Float)
    confidence = db.Column(db.Float)

class Checkpoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    work_unit_id = db.Column(db.Integer, db.ForeignKey('work_unit.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    checkpoint_type = db.Column(db.String(50), nullable=False)  # quality_gate, review, etc.
    status = db.Column(db.String(50), default='pending')  # pending, in_progress, passed, failed
    required_role = db.Column(db.String(50))  # Who needs to approve this checkpoint
    assigned_to = db.Column(db.Integer, db.ForeignKey('user.id'))
    due_date = db.Column(db.DateTime)
    completed_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    attachments = db.Column(db.JSON)  # Files, links, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProcessTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    role_type = db.Column(db.String(50), nullable=False)
    work_unit_type = db.Column(db.String(50), nullable=False)
    template_data = db.Column(db.JSON)  # Work unit and checkpoint templates
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    work_unit_id = db.Column(db.Integer, db.ForeignKey('work_unit.id'))
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
    
    # Kanban fields
    kanban_column = db.Column(db.String(50), default='backlog')  # backlog, todo, in_progress, review, done
    
    # Gantt fields
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    dependencies = db.Column(db.JSON)  # List of task IDs this task depends on
    
    # AI prediction fields
    predicted_delay = db.Column(db.Float)
    risk_score = db.Column(db.Float)
    confidence = db.Column(db.Float)

class TaskDependency(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    depends_on_task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    dependency_type = db.Column(db.String(20), default='finish_to_start')  # finish_to_start, start_to_start, etc.

class MonteCarloSimulation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    simulation_date = db.Column(db.DateTime, default=datetime.utcnow)
    iterations = db.Column(db.Integer, default=10000)
    results = db.Column(db.JSON)  # Simulation results
    confidence_intervals = db.Column(db.JSON)

class CADFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(10))
    file_size = db.Column(db.Integer)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    metadata = db.Column(db.JSON)

# Unit of Work Process Simulator
class UnitOfWorkSimulator:
    def __init__(self):
        self.process_templates = self._load_process_templates()
    
    def _load_process_templates(self):
        """Load predefined process templates for different roles"""
        return {
            'mechanical_designer': {
                'design': {
                    'name': 'Mechanical Design Process',
                    'checkpoints': [
                        {'name': 'Concept Review', 'type': 'quality_gate', 'required_role': 'project_manager'},
                        {'name': 'CAD Modeling', 'type': 'review', 'required_role': 'senior_designer'},
                        {'name': 'Design Validation', 'type': 'validation', 'required_role': 'simulation_engineer'},
                        {'name': 'Manufacturing Review', 'type': 'review', 'required_role': 'manufacturing_engineer'},
                        {'name': 'Final Approval', 'type': 'approval', 'required_role': 'project_manager'}
                    ]
                },
                'simulation': {
                    'name': 'Mechanical Simulation Process',
                    'checkpoints': [
                        {'name': 'Model Preparation', 'type': 'quality_gate', 'required_role': 'simulation_engineer'},
                        {'name': 'Mesh Generation', 'type': 'review', 'required_role': 'simulation_engineer'},
                        {'name': 'Boundary Conditions', 'type': 'validation', 'required_role': 'senior_engineer'},
                        {'name': 'Analysis Run', 'type': 'test', 'required_role': 'simulation_engineer'},
                        {'name': 'Results Validation', 'type': 'validation', 'required_role': 'senior_engineer'},
                        {'name': 'Report Generation', 'type': 'documentation', 'required_role': 'project_manager'}
                    ]
                }
            },
            'electrical_designer': {
                'design': {
                    'name': 'Electrical Design Process',
                    'checkpoints': [
                        {'name': 'Requirements Review', 'type': 'quality_gate', 'required_role': 'project_manager'},
                        {'name': 'Schematic Design', 'type': 'review', 'required_role': 'senior_designer'},
                        {'name': 'PCB Layout', 'type': 'review', 'required_role': 'senior_designer'},
                        {'name': 'Electrical Validation', 'type': 'validation', 'required_role': 'electrical_engineer'},
                        {'name': 'Safety Review', 'type': 'review', 'required_role': 'safety_engineer'},
                        {'name': 'Final Approval', 'type': 'approval', 'required_role': 'project_manager'}
                    ]
                },
                'simulation': {
                    'name': 'Electrical Simulation Process',
                    'checkpoints': [
                        {'name': 'Circuit Analysis', 'type': 'quality_gate', 'required_role': 'electrical_engineer'},
                        {'name': 'Signal Integrity', 'type': 'validation', 'required_role': 'senior_engineer'},
                        {'name': 'Power Analysis', 'type': 'validation', 'required_role': 'senior_engineer'},
                        {'name': 'Thermal Analysis', 'type': 'validation', 'required_role': 'thermal_engineer'},
                        {'name': 'EMC Analysis', 'type': 'validation', 'required_role': 'emc_engineer'},
                        {'name': 'Results Review', 'type': 'review', 'required_role': 'project_manager'}
                    ]
                }
            }
        }
    
    def create_work_unit_from_template(self, project_id, role_type, work_unit_type, name, description):
        """Create a work unit with predefined checkpoints based on template"""
        template = self.process_templates.get(role_type, {}).get(work_unit_type)
        if not template:
            return None
        
        # Create work unit
        work_unit = WorkUnit(
            project_id=project_id,
            name=name,
            description=description,
            work_unit_type=work_unit_type,
            role_type=role_type,
            status='pending'
        )
        db.session.add(work_unit)
        db.session.flush()  # Get the ID
        
        # Create checkpoints from template
        for cp_data in template['checkpoints']:
            checkpoint = Checkpoint(
                work_unit_id=work_unit.id,
                name=cp_data['name'],
                description=f"Checkpoint for {cp_data['name']}",
                checkpoint_type=cp_data['type'],
                required_role=cp_data['required_role'],
                status='pending'
            )
            db.session.add(checkpoint)
        
        db.session.commit()
        return work_unit
    
    def simulate_work_unit_progress(self, work_unit_id, simulation_params=None):
        """Simulate the progress of a work unit through its checkpoints"""
        work_unit = WorkUnit.query.get(work_unit_id)
        if not work_unit:
            return None
        
        checkpoints = Checkpoint.query.filter_by(work_unit_id=work_unit_id).all()
        
        # Default simulation parameters
        if not simulation_params:
            simulation_params = {
                'base_duration': 40,  # hours
                'complexity_factor': 1.0,
                'resource_availability': 0.8,
                'experience_level': 5,  # 1-10
                'risk_factor': 0.2
            }
        
        # Calculate checkpoint durations
        total_duration = 0
        checkpoint_results = []
        
        for i, checkpoint in enumerate(checkpoints):
            # Base duration per checkpoint type
            base_duration = {
                'quality_gate': 4,
                'review': 8,
                'validation': 12,
                'test': 16,
                'approval': 2,
                'documentation': 6
            }.get(checkpoint.checkpoint_type, 8)
            
            # Apply factors
            duration = base_duration * simulation_params['complexity_factor']
            duration *= (1 / simulation_params['resource_availability'])
            duration *= (1.5 - simulation_params['experience_level'] * 0.1)
            duration *= (1 + random.uniform(-simulation_params['risk_factor'], simulation_params['risk_factor']))
            
            checkpoint_results.append({
                'checkpoint_id': checkpoint.id,
                'name': checkpoint.name,
                'type': checkpoint.checkpoint_type,
                'estimated_duration': round(duration, 1),
                'status': 'pending'
            })
            
            total_duration += duration
        
        # Update work unit
        work_unit.estimated_hours = round(total_duration, 1)
        work_unit.simulation_data = {
            'simulation_params': simulation_params,
            'checkpoint_results': checkpoint_results,
            'total_duration': round(total_duration, 1),
            'simulation_date': datetime.utcnow().isoformat()
        }
        
        db.session.commit()
        
        return {
            'work_unit_id': work_unit_id,
            'total_duration': round(total_duration, 1),
            'checkpoints': checkpoint_results
        }

# Enhanced AI Integration
class AdvancedAIClient:
    def __init__(self):
        self.api_key = os.getenv('ABACUS_AI_API_KEY')
        self.base_url = 'https://api.abacus.ai'
        self.unit_simulator = UnitOfWorkSimulator()
    
    def predict_task_delay(self, task_data):
        """Enhanced task delay prediction with Monte Carlo simulation"""
        if not self.api_key:
            return self._mock_prediction(task_data)
        
        try:
            # Real AI prediction would go here
            return self._simulate_prediction(task_data)
        except Exception as e:
            print(f"AI prediction error: {e}")
            return self._mock_prediction(task_data)
    
    def _mock_prediction(self, task_data):
        """Mock prediction for development"""
        complexity = task_data.get('complexity', 1)
        experience = task_data.get('user_experience', 5)
        resources = task_data.get('resources', 0.8)
        
        # Simulate realistic predictions
        base_delay = complexity * (10 - experience) / 10
        resource_factor = 1 / resources if resources > 0 else 2
        predicted_delay = max(0, base_delay * resource_factor + random.uniform(-1, 1))
        
        return {
            'predicted_delay': round(predicted_delay, 2),
            'confidence': round(random.uniform(0.6, 0.95), 2),
            'risk_score': round(random.uniform(0.1, 0.8), 2)
        }
    
    def _simulate_prediction(self, task_data):
        """Monte Carlo simulation for task prediction"""
        # Run Monte Carlo simulation
        iterations = 1000
        delays = []
        
        for _ in range(iterations):
            # Simulate various scenarios
            complexity = task_data.get('complexity', 1)
            experience = task_data.get('user_experience', 5)
            resources = task_data.get('resources', 0.8)
            
            # Add random variations
            complexity_var = complexity + random.normalvariate(0, 0.2)
            experience_var = experience + random.normalvariate(0, 0.5)
            resources_var = resources + random.normalvariate(0, 0.1)
            
            # Calculate delay
            base_delay = complexity_var * (10 - experience_var) / 10
            resource_factor = 1 / max(0.1, resources_var)
            delay = max(0, base_delay * resource_factor)
            
            delays.append(delay)
        
        # Calculate statistics
        mean_delay = np.mean(delays)
        std_delay = np.std(delays)
        confidence_interval = stats.norm.interval(0.95, mean_delay, std_delay)
        
        return {
            'predicted_delay': round(mean_delay, 2),
            'confidence': round(0.95, 2),
            'risk_score': round(std_delay / mean_delay if mean_delay > 0 else 0.5, 2),
            'confidence_interval': [round(ci, 2) for ci in confidence_interval]
        }

# Monte Carlo Project Simulation
class MonteCarloProjectSimulator:
    def __init__(self):
        self.ai_client = AdvancedAIClient()
    
    def simulate_project_completion(self, project_id, iterations=10000):
        """Run Monte Carlo simulation for project completion"""
        project = Project.query.get(project_id)
        if not project:
            return None
        
        work_units = WorkUnit.query.filter_by(project_id=project_id).all()
        if not work_units:
            return None
        
        completion_dates = []
        
        for _ in range(iterations):
            # Simulate each work unit
            work_unit_durations = {}
            for work_unit in work_units:
                # Get work unit prediction
                work_unit_data = {
                    'complexity': work_unit.estimated_hours or 8,
                    'user_experience': 5,  # Default
                    'resources': 0.8,  # Default
                    'priority': work_unit.priority
                }
                
                prediction = self.ai_client.predict_task_delay(work_unit_data)
                duration = prediction['predicted_delay']
                
                # Add dependencies
                if work_unit.dependencies:
                    max_dependency_end = 0
                    for dep_id in work_unit.dependencies:
                        if dep_id in work_unit_durations:
                            max_dependency_end = max(max_dependency_end, work_unit_durations[dep_id])
                    duration += max_dependency_end
                
                work_unit_durations[work_unit.id] = duration
            
            # Project completion is max of all work unit completions
            project_duration = max(work_unit_durations.values()) if work_unit_durations else 0
            completion_date = project.start_date + timedelta(days=project_duration)
            completion_dates.append(completion_date)
        
        # Calculate statistics
        completion_dates = sorted(completion_dates)
        mean_completion = np.mean(completion_dates)
        std_completion = np.std(completion_dates)
        
        # Percentiles
        p50 = np.percentile(completion_dates, 50)
        p90 = np.percentile(completion_dates, 90)
        p95 = np.percentile(completion_dates, 95)
        
        results = {
            'mean_completion': mean_completion.isoformat(),
            'std_completion': std_completion.days,
            'p50_completion': p50.isoformat(),
            'p90_completion': p90.isoformat(),
            'p95_completion': p95.isoformat(),
            'iterations': iterations,
            'completion_dates': [d.isoformat() for d in completion_dates[:100]]  # First 100 for plotting
        }
        
        # Save simulation results
        simulation = MonteCarloSimulation(
            project_id=project_id,
            iterations=iterations,
            results=results
        )
        db.session.add(simulation)
        db.session.commit()
        
        return results

# Initialize AI client and simulator
ai_client = AdvancedAIClient()
mc_simulator = MonteCarloProjectSimulator()

# Enhanced API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

# Unit of Work API
@app.route('/api/work-units', methods=['GET'])
def get_work_units():
    """Get all work units for a project"""
    project_id = request.args.get('project_id')
    if project_id:
        work_units = WorkUnit.query.filter_by(project_id=project_id).all()
    else:
        work_units = WorkUnit.query.all()
    
    return jsonify([{
        'id': wu.id,
        'project_id': wu.project_id,
        'name': wu.name,
        'description': wu.description,
        'work_unit_type': wu.work_unit_type,
        'role_type': wu.role_type,
        'assigned_to': wu.assigned_to,
        'status': wu.status,
        'priority': wu.priority,
        'estimated_hours': wu.estimated_hours,
        'actual_hours': wu.actual_hours,
        'progress': wu.progress,
        'start_date': wu.start_date.isoformat() if wu.start_date else None,
        'end_date': wu.end_date.isoformat() if wu.end_date else None,
        'dependencies': wu.dependencies,
        'simulation_data': wu.simulation_data,
        'predicted_delay': wu.predicted_delay,
        'risk_score': wu.risk_score,
        'confidence': wu.confidence
    } for wu in work_units])

@app.route('/api/work-units', methods=['POST'])
def create_work_unit():
    """Create a new work unit with optional template"""
    data = request.get_json()
    
    # Check if using template
    if data.get('use_template'):
        work_unit = ai_client.unit_simulator.create_work_unit_from_template(
            project_id=data['project_id'],
            role_type=data['role_type'],
            work_unit_type=data['work_unit_type'],
            name=data['name'],
            description=data.get('description', '')
        )
    else:
        # Create basic work unit
        work_unit = WorkUnit(
            project_id=data['project_id'],
            name=data['name'],
            description=data.get('description', ''),
            work_unit_type=data['work_unit_type'],
            role_type=data['role_type'],
            assigned_to=data.get('assigned_to'),
            priority=data.get('priority', 'medium'),
            estimated_hours=data.get('estimated_hours'),
            start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
            end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
            dependencies=data.get('dependencies', [])
        )
        db.session.add(work_unit)
        db.session.commit()
    
    return jsonify({'id': work_unit.id, 'message': 'Work unit created successfully'}), 201

@app.route('/api/work-units/<int:work_unit_id>/simulate', methods=['POST'])
def simulate_work_unit(work_unit_id):
    """Simulate work unit progress"""
    data = request.get_json()
    simulation_params = data.get('simulation_params')
    
    result = ai_client.unit_simulator.simulate_work_unit_progress(work_unit_id, simulation_params)
    
    if not result:
        return jsonify({'error': 'Work unit not found'}), 404
    
    return jsonify(result)

@app.route('/api/work-units/<int:work_unit_id>/checkpoints', methods=['GET'])
def get_work_unit_checkpoints(work_unit_id):
    """Get checkpoints for a work unit"""
    checkpoints = Checkpoint.query.filter_by(work_unit_id=work_unit_id).all()
    
    return jsonify([{
        'id': cp.id,
        'work_unit_id': cp.work_unit_id,
        'name': cp.name,
        'description': cp.description,
        'checkpoint_type': cp.checkpoint_type,
        'status': cp.status,
        'required_role': cp.required_role,
        'assigned_to': cp.assigned_to,
        'due_date': cp.due_date.isoformat() if cp.due_date else None,
        'completed_date': cp.completed_date.isoformat() if cp.completed_date else None,
        'notes': cp.notes,
        'attachments': cp.attachments
    } for cp in checkpoints])

@app.route('/api/checkpoints/<int:checkpoint_id>', methods=['PUT'])
def update_checkpoint(checkpoint_id):
    """Update checkpoint status"""
    data = request.get_json()
    checkpoint = Checkpoint.query.get(checkpoint_id)
    
    if not checkpoint:
        return jsonify({'error': 'Checkpoint not found'}), 404
    
    checkpoint.status = data.get('status', checkpoint.status)
    checkpoint.assigned_to = data.get('assigned_to', checkpoint.assigned_to)
    checkpoint.notes = data.get('notes', checkpoint.notes)
    
    if data.get('status') == 'passed':
        checkpoint.completed_date = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Checkpoint updated successfully'})

@app.route('/api/process-templates', methods=['GET'])
def get_process_templates():
    """Get available process templates"""
    templates = ProcessTemplate.query.filter_by(is_active=True).all()
    
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'description': t.description,
        'role_type': t.role_type,
        'work_unit_type': t.work_unit_type,
        'template_data': t.template_data
    } for t in templates])

# Keep existing routes for backward compatibility
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
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        role=data['role'],
        department=data['department']
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'id': new_user.id, 'message': 'User created successfully'}), 201

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
        'progress': project.progress,
        'predicted_completion': project.predicted_completion.isoformat() if project.predicted_completion else None,
        'risk_level': project.risk_level
    } for project in projects])

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    
    new_project = Project(
        name=data['name'],
        description=data.get('description', ''),
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
        budget=data.get('budget', 0),
        priority=data.get('priority', 'medium')
    )
    
    db.session.add(new_project)
    db.session.commit()
    
    return jsonify({'id': new_project.id, 'message': 'Project created successfully'}), 201

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    project_id = request.args.get('project_id')
    if project_id:
        tasks = Task.query.filter_by(project_id=project_id).all()
    else:
        tasks = Task.query.all()
    
    return jsonify([{
        'id': task.id,
        'project_id': task.project_id,
        'work_unit_id': task.work_unit_id,
        'name': task.name,
        'description': task.description,
        'status': task.status,
        'priority': task.priority,
        'assigned_to': task.assigned_to,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'estimated_hours': task.estimated_hours,
        'actual_hours': task.actual_hours,
        'progress': task.progress,
        'kanban_column': task.kanban_column,
        'start_date': task.start_date.isoformat() if task.start_date else None,
        'end_date': task.end_date.isoformat() if task.end_date else None,
        'dependencies': task.dependencies,
        'predicted_delay': task.predicted_delay,
        'risk_score': task.risk_score,
        'confidence': task.confidence
    } for task in tasks])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    
    # Get AI prediction
    prediction = ai_client.predict_task_delay(data)
    
    new_task = Task(
        project_id=data['project_id'],
        work_unit_id=data.get('work_unit_id'),
        name=data['name'],
        description=data.get('description', ''),
        priority=data.get('priority', 'medium'),
        assigned_to=data.get('assigned_to'),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        estimated_hours=data.get('estimated_hours'),
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
        dependencies=data.get('dependencies', []),
        predicted_delay=prediction['predicted_delay'],
        risk_score=prediction['risk_score'],
        confidence=prediction['confidence']
    )
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({
        'id': new_task.id, 
        'message': 'Task created successfully',
        'ai_prediction': prediction
    }), 201

@app.route('/api/ai/predict', methods=['POST'])
def predict_task_delay():
    """AI endpoint for task delay prediction"""
    data = request.get_json()
    prediction = ai_client.predict_task_delay(data)
    return jsonify(prediction)

# Keep existing Kanban, Gantt, and Simulation routes
@app.route('/api/kanban/<int:project_id>', methods=['GET'])
def get_kanban_board(project_id):
    """Get Kanban board data for a project"""
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
            'predicted_delay': task.predicted_delay,
            'risk_score': task.risk_score
        }
        
        column = task.kanban_column or 'backlog'
        if column in kanban_data:
            kanban_data[column].append(task_data)
    
    return jsonify(kanban_data)

@app.route('/api/gantt/<int:project_id>', methods=['GET'])
def get_gantt_data(project_id):
    """Get Gantt chart data for a project"""
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    gantt_data = []
    for task in tasks:
        task_data = {
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
        gantt_data.append(task_data)
    
    return jsonify(gantt_data)

@app.route('/api/simulation/<int:project_id>', methods=['POST'])
def run_monte_carlo_simulation(project_id):
    """Run Monte Carlo simulation for project completion"""
    data = request.get_json()
    iterations = data.get('iterations', 10000)
    
    results = mc_simulator.simulate_project_completion(project_id, iterations)
    
    if not results:
        return jsonify({'error': 'Project not found or no tasks'}), 404
    
    return jsonify(results)

@app.route('/api/dashboard/<role>', methods=['GET'])
def get_role_dashboard(role):
    """Get enhanced dashboard data for specific role"""
    dashboard_data = {
        'role': role,
        'total_projects': Project.query.count(),
        'active_projects': Project.query.filter_by(status='active').count(),
        'active_tasks': Task.query.filter_by(status='in_progress').count(),
        'high_priority_tasks': Task.query.filter_by(priority='high').count(),
        'predicted_delays': Task.query.filter(Task.predicted_delay > 0).count(),
        'overdue_tasks': Task.query.filter(Task.due_date < datetime.utcnow()).count(),
        'recent_activities': [],
        'kanban_summary': {
            'backlog': Task.query.filter_by(kanban_column='backlog').count(),
            'todo': Task.query.filter_by(kanban_column='todo').count(),
            'in_progress': Task.query.filter_by(kanban_column='in_progress').count(),
            'review': Task.query.filter_by(kanban_column='review').count(),
            'done': Task.query.filter_by(kanban_column='done').count(),
        },
        'work_units_summary': {
            'total': WorkUnit.query.count(),
            'mechanical_designer': WorkUnit.query.filter_by(role_type='mechanical_designer').count(),
            'electrical_designer': WorkUnit.query.filter_by(role_type='electrical_designer').count(),
            'simulation_engineer': WorkUnit.query.filter_by(role_type='simulation_engineer').count(),
        }
    }
    
    return jsonify(dashboard_data)

# WebSocket events for real-time updates
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_project')
def handle_join_project(data):
    project_id = data.get('project_id')
    # Join room for project updates
    socketio.emit('user_joined', {'project_id': project_id})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000))) 