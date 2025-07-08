from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class UserRole(Enum):
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    MECHANICAL_DESIGNER = "mechanical_designer"
    ELECTRICAL_DESIGNER = "electrical_designer"
    SIMULATION_ENGINEER = "simulation_engineer"
    MANUFACTURING_ENGINEER = "manufacturing_engineer"
    QUALITY_ENGINEER = "quality_engineer"
    TECHNICIAN = "technician"
    OPERATOR = "operator"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.TECHNICIAN)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assigned_tasks = db.relationship('Task', backref='assignee', lazy=True)
    created_projects = db.relationship('Project', backref='creator', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role.value,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='active')
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    budget = db.Column(db.Float, nullable=True)
    priority = db.Column(db.String(20), default='medium')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    work_units = db.relationship('WorkUnit', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'budget': self.budget,
            'priority': self.priority,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'task_count': len(self.tasks),
            'completed_tasks': len([t for t in self.tasks if t.status == 'completed'])
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    priority = db.Column(db.String(20), default='medium')
    status = db.Column(db.String(50), default='pending')
    kanban_column = db.Column(db.String(50), default='backlog')
    estimated_hours = db.Column(db.Float, nullable=True)
    actual_hours = db.Column(db.Float, nullable=True)
    progress = db.Column(db.Integer, default=0)
    due_date = db.Column(db.DateTime, nullable=True)
    start_date = db.Column(db.DateTime, nullable=True)
    completed_date = db.Column(db.DateTime, nullable=True)
    predicted_delay = db.Column(db.Float, nullable=True)
    risk_score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'project_id': self.project_id,
            'assigned_to': self.assigned_to,
            'priority': self.priority,
            'status': self.status,
            'kanban_column': self.kanban_column,
            'estimated_hours': self.estimated_hours,
            'actual_hours': self.actual_hours,
            'progress': self.progress,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'predicted_delay': self.predicted_delay,
            'risk_score': self.risk_score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class WorkUnitType(Enum):
    DESIGN = "design"
    SIMULATION = "simulation"
    MANUFACTURING = "manufacturing"
    TESTING = "testing"
    DOCUMENTATION = "documentation"

class WorkUnit(db.Model):
    __tablename__ = 'work_units'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    unit_type = db.Column(db.Enum(WorkUnitType), nullable=False)
    estimated_duration = db.Column(db.Float, nullable=True)
    actual_duration = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), default='pending')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    start_date = db.Column(db.DateTime, nullable=True)
    completed_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    checkpoints = db.relationship('Checkpoint', backref='work_unit', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'project_id': self.project_id,
            'unit_type': self.unit_type.value,
            'estimated_duration': self.estimated_duration,
            'actual_duration': self.actual_duration,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'checkpoints': [cp.to_dict() for cp in self.checkpoints]
        }

class CheckpointType(Enum):
    REVIEW = "review"
    APPROVAL = "approval"
    QUALITY_GATE = "quality_gate"
    TESTING = "testing"
    DOCUMENTATION = "documentation"

class Checkpoint(db.Model):
    __tablename__ = 'checkpoints'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    work_unit_id = db.Column(db.Integer, db.ForeignKey('work_units.id'), nullable=False)
    checkpoint_type = db.Column(db.Enum(CheckpointType), nullable=False)
    required_approval = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(50), default='pending')
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'work_unit_id': self.work_unit_id,
            'checkpoint_type': self.checkpoint_type.value,
            'required_approval': self.required_approval,
            'approved_by': self.approved_by,
            'status': self.status,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 