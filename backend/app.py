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
    # Generic Design Types
    DESIGN = "design"
    CAD_DESIGN = "cad_design"
    TOOLING_DESIGN = "tooling_design"
    LAYOUT_DESIGN = "layout_design"
    ELECTRICAL_DESIGN = "electrical_design"
    CONTROL_SYSTEM_DESIGN = "control_system_design"
    SAFETY_SYSTEM_DESIGN = "safety_system_design"
    ERGONOMIC_DESIGN = "ergonomic_design"
    PACKAGING_DESIGN = "packaging_design"
    PRODUCT_DESIGN = "product_design"
    SYSTEM_DESIGN = "system_design"
    INTERFACE_DESIGN = "interface_design"
    
    # Generic Simulation Types
    SIMULATION = "simulation"
    PROCESS_SIMULATION = "process_simulation"
    REACH_ACCESS_ANALYSIS = "reach_access_analysis"
    LAYOUT_OPTIMIZATION = "layout_optimization"
    FOUNDATION_PLANNING = "foundation_planning"
    ROBOTICS_OLP = "robotics_olp"
    CYCLE_TIME_ANALYSIS = "cycle_time_analysis"
    MATERIAL_FLOW_SIMULATION = "material_flow_simulation"
    FEA_ANALYSIS = "fea_analysis"
    CFD_ANALYSIS = "cfd_analysis"
    THERMAL_ANALYSIS = "thermal_analysis"
    STRESS_ANALYSIS = "stress_analysis"
    DYNAMIC_ANALYSIS = "dynamic_analysis"
    OPTIMIZATION_ANALYSIS = "optimization_analysis"
    
    # Generic Manufacturing Types
    MANUFACTURING = "manufacturing"
    CNC_PROGRAMMING = "cnc_programming"
    MANUAL_MACHINING = "manual_machining"
    WELDING = "welding"
    FABRICATION = "fabrication"
    ASSEMBLY = "assembly"
    INSPECTION = "inspection"
    QUALITY_CONTROL = "quality_control"
    TOOL_SETUP = "tool_setup"
    CNC_MACHINING = "cnc_machining"
    ADDITIVE_MANUFACTURING = "additive_manufacturing"
    LASER_CUTTING = "laser_cutting"
    WATER_JET_CUTTING = "water_jet_cutting"
    ROBOTIC_WELDING = "robotic_welding"
    AUTOMATED_ASSEMBLY = "automated_assembly"
    AUTOMATED_INSPECTION = "automated_inspection"
    AUTOMATED_TESTING = "automated_testing"
    
    # Generic Robotics & Automation Types
    ROBOTICS = "robotics"
    ROBOT_PROGRAMMING = "robot_programming"
    ROBOT_SIMULATION = "robot_simulation"
    ROBOT_INTEGRATION = "robot_integration"
    ROBOT_CALIBRATION = "robot_calibration"
    ROBOT_MAINTENANCE = "robot_maintenance"
    ROBOT_PATH_OPTIMIZATION = "robot_path_optimization"
    ROBOT_COLLISION_DETECTION = "robot_collision_detection"
    ROBOT_CYCLE_OPTIMIZATION = "robot_cycle_optimization"
    ROBOT_KINEMATICS_ANALYSIS = "robot_kinematics_analysis"
    ROBOT_DYNAMICS_ANALYSIS = "robot_dynamics_analysis"
    ROBOT_VISION_PROCESSING = "robot_vision_processing"
    ROBOT_LEARNING = "robot_learning"
    
    # Generic Electrical & Control Types
    ELECTRICAL = "electrical"
    ELECTRICAL_PANEL_DESIGN = "electrical_panel_design"
    PLC_PROGRAMMING = "plc_programming"
    HMI_DESIGN = "hmi_design"
    ELECTRICAL_INSTALLATION = "electrical_installation"
    ELECTRICAL_TESTING = "electrical_testing"
    ELECTRICAL_SIMULATION = "electrical_simulation"
    SIGNAL_INTEGRITY_ANALYSIS = "signal_integrity_analysis"
    POWER_ANALYSIS = "power_analysis"
    EMC_ANALYSIS = "emc_analysis"
    ELECTRICAL_THERMAL_ANALYSIS = "electrical_thermal_analysis"
    FAULT_TREE_ANALYSIS = "fault_tree_analysis"
    RELIABILITY_ANALYSIS = "reliability_analysis"
    AUTOMATED_ELECTRICAL_TESTING = "automated_electrical_testing"
    
    # Generic Testing & Validation Types
    TESTING = "testing"
    VALIDATION = "validation"
    FUNCTIONAL_TESTING = "functional_testing"
    PERFORMANCE_TESTING = "performance_testing"
    SAFETY_TESTING = "safety_testing"
    ERGONOMIC_TESTING = "ergonomic_testing"
    USABILITY_TESTING = "usability_testing"
    FIELD_TESTING = "field_testing"
    ACCEPTANCE_TESTING = "acceptance_testing"
    AUTOMATED_TESTING = "automated_testing"
    LOAD_TESTING = "load_testing"
    STRESS_TESTING = "stress_testing"
    REGRESSION_TESTING = "regression_testing"
    PERFORMANCE_MONITORING = "performance_monitoring"
    DATA_ANALYSIS = "data_analysis"
    TEST_REPORT_GENERATION = "test_report_generation"
    PREDICTIVE_TESTING = "predictive_testing"
    
    # Generic Validation & Verification Types
    VERIFICATION = "verification"
    DESIGN_REVIEW = "design_review"
    CODE_REVIEW = "code_review"
    PROCESS_VALIDATION = "process_validation"
    QUALITY_GATE_REVIEW = "quality_gate_review"
    COMPLIANCE_REVIEW = "compliance_review"
    RISK_ASSESSMENT = "risk_assessment"
    CHANGE_MANAGEMENT = "change_management"
    AUTOMATED_VALIDATION = "automated_validation"
    MODEL_VALIDATION = "model_validation"
    DATA_VALIDATION = "data_validation"
    ALGORITHM_VALIDATION = "algorithm_validation"
    SYSTEM_VALIDATION = "system_validation"
    COMPLIANCE_CHECKING = "compliance_checking"
    QUALITY_METRICS_ANALYSIS = "quality_metrics_analysis"
    VALIDATION_REPORT_GENERATION = "validation_report_generation"
    
    # Generic Documentation Types
    DOCUMENTATION = "documentation"
    TECHNICAL_WRITING = "technical_writing"
    PROCEDURE_WRITING = "procedure_writing"
    TRAINING_MATERIAL_CREATION = "training_material_creation"
    DRAWING_CREATION = "drawing_creation"
    SPECIFICATION_WRITING = "specification_writing"
    MANUAL_CREATION = "manual_creation"
    REPORT_WRITING = "report_writing"
    PRESENTATION_CREATION = "presentation_creation"
    AUTOMATED_REPORT_GENERATION = "automated_report_generation"
    DOCUMENT_VERSION_CONTROL = "document_version_control"
    DOCUMENT_INDEXING = "document_indexing"
    DOCUMENT_SEARCH = "document_search"
    DOCUMENT_TRANSLATION = "document_translation"
    DOCUMENT_FORMATTING = "document_formatting"
    DOCUMENT_ARCHIVING = "document_archiving"
    DOCUMENT_ANALYTICS = "document_analytics"
    
    # Generic Construction & Installation Types
    CONSTRUCTION = "construction"
    INSTALLATION = "installation"
    FOUNDATION_CONSTRUCTION = "foundation_construction"
    EQUIPMENT_INSTALLATION = "equipment_installation"
    PIPE_INSTALLATION = "pipe_installation"
    DUCT_INSTALLATION = "duct_installation"
    ELECTRICAL_INSTALLATION = "electrical_installation"
    SAFETY_SYSTEM_INSTALLATION = "safety_system_installation"
    EQUIPMENT_CALIBRATION = "equipment_calibration"
    SITE_PREPARATION = "site_preparation"
    CONSTRUCTION_PLANNING = "construction_planning"
    RESOURCE_OPTIMIZATION = "resource_optimization"
    SCHEDULE_OPTIMIZATION = "schedule_optimization"
    COST_ESTIMATION = "cost_estimation"
    CONSTRUCTION_MODELING = "construction_modeling"
    CONSTRUCTION_SIMULATION = "construction_simulation"
    PROGRESS_TRACKING = "progress_tracking"
    CONSTRUCTION_QUALITY_CONTROL = "construction_quality_control"
    
    # Generic Maintenance & Service Types
    MAINTENANCE = "maintenance"
    SERVICE = "service"
    PREVENTIVE_MAINTENANCE = "preventive_maintenance"
    CORRECTIVE_MAINTENANCE = "corrective_maintenance"
    EQUIPMENT_REPAIR = "equipment_repair"
    SPARE_PARTS_MANAGEMENT = "spare_parts_management"
    EQUIPMENT_CALIBRATION = "equipment_calibration"
    SAFETY_SYSTEM_MAINTENANCE = "safety_system_maintenance"
    TRAINING_DELIVERY = "training_delivery"
    TROUBLESHOOTING = "troubleshooting"
    PREDICTIVE_MAINTENANCE = "predictive_maintenance"
    MAINTENANCE_SCHEDULING = "maintenance_scheduling"
    ASSET_MANAGEMENT = "asset_management"
    PERFORMANCE_MONITORING = "performance_monitoring"
    FAULT_DETECTION = "fault_detection"
    MAINTENANCE_ANALYTICS = "maintenance_analytics"
    SPARE_PARTS_OPTIMIZATION = "spare_parts_optimization"
    MAINTENANCE_REPORTING = "maintenance_reporting"
    
    # Generic Software & IT Types
    SOFTWARE_DEVELOPMENT = "software_development"
    PROGRAMMING = "programming"
    CODING = "coding"
    DEBUGGING = "debugging"
    SOFTWARE_TESTING = "software_testing"
    DATABASE_DESIGN = "database_design"
    API_DEVELOPMENT = "api_development"
    WEB_DEVELOPMENT = "web_development"
    MOBILE_DEVELOPMENT = "mobile_development"
    CLOUD_INTEGRATION = "cloud_integration"
    SECURITY_AUDIT = "security_audit"
    PERFORMANCE_OPTIMIZATION = "performance_optimization"
    
    # Generic Research & Development Types
    RESEARCH = "research"
    DEVELOPMENT = "development"
    PROTOTYPING = "prototyping"
    EXPERIMENTATION = "experimentation"
    DATA_COLLECTION = "data_collection"
    ANALYSIS = "analysis"
    MODELING = "modeling"
    ALGORITHM_DEVELOPMENT = "algorithm_development"
    FEASIBILITY_STUDY = "feasibility_study"
    MARKET_RESEARCH = "market_research"
    COMPETITIVE_ANALYSIS = "competitive_analysis"
    
    # Generic Business & Management Types
    PLANNING = "planning"
    STRATEGY = "strategy"
    BUDGETING = "budgeting"
    COST_ANALYSIS = "cost_analysis"
    RISK_MANAGEMENT = "risk_management"
    STAKEHOLDER_MANAGEMENT = "stakeholder_management"
    COMMUNICATION = "communication"
    NEGOTIATION = "negotiation"
    CONTRACT_MANAGEMENT = "contract_management"
    PROCUREMENT = "procurement"
    SUPPLY_CHAIN_MANAGEMENT = "supply_chain_management"
    VENDOR_MANAGEMENT = "vendor_management"

class CheckpointType(Enum):
    QUALITY_GATE = "quality_gate"
    REVIEW = "review"
    APPROVAL = "approval"
    VERIFICATION = "verification"
    VALIDATION = "validation"
    TEST = "test"
    INSPECTION = "inspection"
    AUDIT = "audit"
    SIGN_OFF = "sign_off"
    MILESTONE = "milestone"
    DELIVERABLE = "deliverable"
    PHASE_COMPLETION = "phase_completion"

class RoleType(Enum):
    # Generic Design Roles
    DESIGNER = "designer"
    MECHANICAL_DESIGNER = "mechanical_designer"
    ELECTRICAL_DESIGNER = "electrical_designer"
    TOOLING_DESIGNER = "tooling_designer"
    LAYOUT_DESIGNER = "layout_designer"
    CONTROL_SYSTEM_DESIGNER = "control_system_designer"
    SAFETY_SYSTEM_DESIGNER = "safety_system_designer"
    ERGONOMIC_SPECIALIST = "ergonomic_specialist"
    PRODUCT_DESIGNER = "product_designer"
    SYSTEM_DESIGNER = "system_designer"
    INTERFACE_DESIGNER = "interface_designer"
    ARCHITECT = "architect"
    
    # Generic Engineering Roles
    ENGINEER = "engineer"
    SIMULATION_ENGINEER = "simulation_engineer"
    MANUFACTURING_ENGINEER = "manufacturing_engineer"
    QUALITY_ENGINEER = "quality_engineer"
    ROBOTICS_ENGINEER = "robotics_engineer"
    ELECTRICAL_ENGINEER = "electrical_engineer"
    CONTROL_ENGINEER = "control_engineer"
    THERMAL_ENGINEER = "thermal_engineer"
    STRUCTURAL_ENGINEER = "structural_engineer"
    CIVIL_ENGINEER = "civil_engineer"
    CHEMICAL_ENGINEER = "chemical_engineer"
    SOFTWARE_ENGINEER = "software_engineer"
    SYSTEMS_ENGINEER = "systems_engineer"
    PROCESS_ENGINEER = "process_engineer"
    INDUSTRIAL_ENGINEER = "industrial_engineer"
    
    # Generic Manufacturing Roles
    TECHNICIAN = "technician"
    CNC_PROGRAMMER = "cnc_programmer"
    MACHINIST = "machinist"
    WELDER = "welder"
    FABRICATOR = "fabricator"
    ASSEMBLER = "assembler"
    INSPECTOR = "inspector"
    QUALITY_TECHNICIAN = "quality_technician"
    OPERATOR = "operator"
    MAINTENANCE_TECHNICIAN = "maintenance_technician"
    CALIBRATION_TECHNICIAN = "calibration_technician"
    
    # Generic Robotics Roles
    ROBOTICS_SPECIALIST = "robotics_specialist"
    ROBOT_PROGRAMMER = "robot_programmer"
    ROBOTICS_TECHNICIAN = "robotics_technician"
    AUTOMATION_SPECIALIST = "automation_specialist"
    
    # Generic Electrical Roles
    ELECTRICAL_TECHNICIAN = "electrical_technician"
    PLC_PROGRAMMER = "plc_programmer"
    HMI_DESIGNER = "hmi_designer"
    ELECTRICAL_ENGINEER = "electrical_engineer"
    INSTRUMENTATION_TECHNICIAN = "instrumentation_technician"
    CONTROL_TECHNICIAN = "control_technician"
    
    # Generic Testing Roles
    TEST_ENGINEER = "test_engineer"
    VALIDATION_ENGINEER = "validation_engineer"
    QUALITY_ASSURANCE_SPECIALIST = "quality_assurance_specialist"
    TEST_TECHNICIAN = "test_technician"
    INSPECTION_SPECIALIST = "inspection_specialist"
    
    # Generic Documentation Roles
    TECHNICAL_WRITER = "technical_writer"
    DOCUMENTATION_SPECIALIST = "documentation_specialist"
    TRAINING_SPECIALIST = "training_specialist"
    CONTENT_CREATOR = "content_creator"
    EDITOR = "editor"
    
    # Generic Construction Roles
    CONSTRUCTION_MANAGER = "construction_manager"
    INSTALLATION_TECHNICIAN = "installation_technician"
    FIELD_ENGINEER = "field_engineer"
    CONSTRUCTION_WORKER = "construction_worker"
    INSTALLER = "installer"
    SITE_SUPERVISOR = "site_supervisor"
    
    # Generic Maintenance Roles
    MAINTENANCE_ENGINEER = "maintenance_engineer"
    RELIABILITY_ENGINEER = "reliability_engineer"
    MAINTENANCE_PLANNER = "maintenance_planner"
    ASSET_MANAGER = "asset_manager"
    
    # Generic Software & IT Roles
    SOFTWARE_DEVELOPER = "software_developer"
    PROGRAMMER = "programmer"
    DEVELOPER = "developer"
    SYSTEM_ADMINISTRATOR = "system_administrator"
    DATABASE_ADMINISTRATOR = "database_administrator"
    NETWORK_ENGINEER = "network_engineer"
    SECURITY_SPECIALIST = "security_specialist"
    DEVOPS_ENGINEER = "devops_engineer"
    
    # Generic Research Roles
    RESEARCHER = "researcher"
    SCIENTIST = "scientist"
    ANALYST = "analyst"
    DATA_SCIENTIST = "data_scientist"
    RESEARCH_ASSISTANT = "research_assistant"
    
    # Generic Management Roles
    PROJECT_MANAGER = "project_manager"
    ENGINEERING_MANAGER = "engineering_manager"
    MANUFACTURING_MANAGER = "manufacturing_manager"
    QUALITY_MANAGER = "quality_manager"
    OPERATIONS_MANAGER = "operations_manager"
    PRODUCTION_MANAGER = "production_manager"
    CONSTRUCTION_MANAGER = "construction_manager"
    MAINTENANCE_MANAGER = "maintenance_manager"
    IT_MANAGER = "it_manager"
    RESEARCH_MANAGER = "research_manager"
    BUSINESS_MANAGER = "business_manager"
    
    # Generic Business Roles
    BUSINESS_ANALYST = "business_analyst"
    FINANCIAL_ANALYST = "financial_analyst"
    PROCUREMENT_SPECIALIST = "procurement_specialist"
    SUPPLY_CHAIN_SPECIALIST = "supply_chain_specialist"
    VENDOR_MANAGER = "vendor_manager"
    CONTRACT_MANAGER = "contract_manager"
    STAKEHOLDER_MANAGER = "stakeholder_manager"
    
    # Generic Support Roles
    COORDINATOR = "coordinator"
    PLANNER = "planner"
    SCHEDULER = "scheduler"
    COORDINATOR = "coordinator"
    ASSISTANT = "assistant"
    SPECIALIST = "specialist"
    CONSULTANT = "consultant"
    ADVISOR = "advisor"

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
    
    # Time tracking fields
    started_at = db.Column(db.DateTime)  # When work actually started
    completed_at = db.Column(db.DateTime)  # When task was actually completed
    time_spent = db.Column(db.Float)  # Actual time spent in hours
    efficiency_score = db.Column(db.Float)  # Calculated efficiency (estimated/actual)
    
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

class TaskCompletionHistory(db.Model):
    """Track historical task completion data for improving estimates"""
    id = db.Column(db.Integer, primary_key=True)
    task_name = db.Column(db.String(200), nullable=False)
    task_type = db.Column(db.String(50))  # design, simulation, validation, etc.
    role_type = db.Column(db.String(50))  # mechanical_designer, electrical_designer, etc.
    estimated_hours = db.Column(db.Float, nullable=False)
    actual_hours = db.Column(db.Float, nullable=False)
    efficiency_score = db.Column(db.Float)  # estimated/actual
    complexity_factors = db.Column(db.JSON)  # Factors that affected completion time
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    
    # Additional context for learning
    priority = db.Column(db.String(20))
    dependencies_count = db.Column(db.Integer, default=0)
    team_size = db.Column(db.Integer, default=1)
    experience_level = db.Column(db.String(20))  # junior, mid, senior
    tools_used = db.Column(db.JSON)  # List of tools/software used
    challenges_encountered = db.Column(db.JSON)  # List of challenges faced

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
        self.base_url = "https://api.abacus.ai"
    
    def predict_task_delay(self, task_data):
        """Enhanced prediction using historical data"""
        # First, get historical data for similar tasks
        historical_data = self._get_historical_data(task_data)
        
        if historical_data:
            # Use historical data for prediction
            return self._predict_from_history(task_data, historical_data)
        else:
            # Fall back to simulation-based prediction
            return self._simulate_prediction(task_data)
    
    def _get_historical_data(self, task_data):
        """Get historical completion data for similar tasks"""
        try:
            # Query for similar tasks based on type and role
            similar_tasks = TaskCompletionHistory.query.filter_by(
                task_type=task_data.get('task_type', 'general'),
                role_type=task_data.get('role_type', 'general')
            ).order_by(TaskCompletionHistory.completed_at.desc()).limit(50).all()
            
            if similar_tasks:
                return [{
                    'estimated_hours': task.estimated_hours,
                    'actual_hours': task.actual_hours,
                    'efficiency_score': task.efficiency_score,
                    'complexity_factors': task.complexity_factors,
                    'priority': task.priority,
                    'experience_level': task.experience_level
                } for task in similar_tasks]
            
            return None
        except Exception as e:
            print(f"Error getting historical data: {e}")
            return None
    
    def _predict_from_history(self, task_data, historical_data):
        """Predict based on historical completion data"""
        try:
            # Calculate average efficiency for similar tasks
            efficiency_scores = [h['efficiency_score'] for h in historical_data if h['efficiency_score']]
            avg_efficiency = sum(efficiency_scores) / len(efficiency_scores) if efficiency_scores else 1.0
            
            # Adjust for complexity factors
            complexity_multiplier = self._calculate_complexity_multiplier(task_data, historical_data)
            
            # Calculate predicted actual hours
            estimated_hours = task_data.get('complexity', 8)
            predicted_actual_hours = estimated_hours * avg_efficiency * complexity_multiplier
            
            # Calculate delay (difference between estimated and predicted actual)
            predicted_delay = max(0, predicted_actual_hours - estimated_hours)
            
            # Calculate confidence based on data quality
            confidence = min(0.95, len(historical_data) / 100)  # More data = higher confidence
            
            # Calculate risk score based on variance in historical data
            risk_score = self._calculate_risk_score(historical_data)
            
            return {
                'predicted_delay': predicted_delay,
                'predicted_actual_hours': predicted_actual_hours,
                'efficiency_score': avg_efficiency,
                'confidence': confidence,
                'risk_score': risk_score,
                'historical_data_points': len(historical_data),
                'method': 'historical_analysis'
            }
        except Exception as e:
            print(f"Error in historical prediction: {e}")
            return self._simulate_prediction(task_data)
    
    def _calculate_complexity_multiplier(self, task_data, historical_data):
        """Calculate complexity multiplier based on task factors"""
        multiplier = 1.0
        
        # Priority impact
        priority_multipliers = {
            'high': 0.9,  # High priority tasks often get done faster
            'medium': 1.0,
            'low': 1.1   # Low priority tasks might take longer
        }
        multiplier *= priority_multipliers.get(task_data.get('priority', 'medium'), 1.0)
        
        # Experience level impact
        experience_multipliers = {
            'senior': 0.8,  # Senior developers are faster
            'mid': 1.0,
            'junior': 1.3   # Junior developers take longer
        }
        multiplier *= experience_multipliers.get(task_data.get('experience_level', 'mid'), 1.0)
        
        # Dependencies impact
        dependencies_count = len(task_data.get('dependencies', []))
        multiplier *= (1 + dependencies_count * 0.1)  # Each dependency adds 10% time
        
        return multiplier
    
    def _calculate_risk_score(self, historical_data):
        """Calculate risk score based on variance in historical data"""
        if not historical_data:
            return 0.5
        
        efficiency_scores = [h['efficiency_score'] for h in historical_data if h['efficiency_score']]
        if not efficiency_scores:
            return 0.5
        
        # Calculate coefficient of variation (standard deviation / mean)
        mean_efficiency = sum(efficiency_scores) / len(efficiency_scores)
        variance = sum((score - mean_efficiency) ** 2 for score in efficiency_scores) / len(efficiency_scores)
        std_dev = variance ** 0.5
        coefficient_of_variation = std_dev / mean_efficiency if mean_efficiency > 0 else 0
        
        # Convert to risk score (0-1)
        risk_score = min(1.0, coefficient_of_variation)
        return risk_score
    
    def learn_from_completion(self, task_id):
        """Learn from a completed task to improve future predictions"""
        try:
            task = Task.query.get(task_id)
            if not task or task.status != 'completed':
                return False
            
            # Calculate efficiency score
            if task.estimated_hours and task.actual_hours:
                efficiency_score = task.estimated_hours / task.actual_hours
            else:
                efficiency_score = 1.0
            
            # Create historical record
            history = TaskCompletionHistory(
                task_name=task.name,
                task_type=task.work_unit.work_unit_type if task.work_unit_id else 'general',
                role_type=task.work_unit.role_type if task.work_unit_id else 'general',
                estimated_hours=task.estimated_hours or 0,
                actual_hours=task.actual_hours or 0,
                efficiency_score=efficiency_score,
                complexity_factors={
                    'priority': task.priority,
                    'dependencies_count': len(task.dependencies or []),
                    'team_size': 1,  # Could be enhanced to track actual team size
                    'experience_level': 'mid',  # Could be enhanced to track user experience
                    'tools_used': [],  # Could be enhanced to track tools
                    'challenges_encountered': []  # Could be enhanced to track challenges
                },
                completed_at=task.completed_at or datetime.utcnow(),
                user_id=task.assigned_to,
                project_id=task.project_id,
                priority=task.priority,
                dependencies_count=len(task.dependencies or [])
            )
            
            db.session.add(history)
            db.session.commit()
            
            # Update task with efficiency score
            task.efficiency_score = efficiency_score
            db.session.commit()
            
            return True
        except Exception as e:
            print(f"Error learning from completion: {e}")
            return False
    
    def get_improvement_suggestions(self, task_data):
        """Get suggestions for improving task estimates based on historical data"""
        historical_data = self._get_historical_data(task_data)
        if not historical_data:
            return []
        
        suggestions = []
        
        # Analyze efficiency patterns
        efficiency_scores = [h['efficiency_score'] for h in historical_data if h['efficiency_score']]
        avg_efficiency = sum(efficiency_scores) / len(efficiency_scores) if efficiency_scores else 1.0
        
        if avg_efficiency < 0.8:
            suggestions.append({
                'type': 'estimate_adjustment',
                'message': f'Historical data shows tasks typically take {1/avg_efficiency:.1f}x longer than estimated. Consider increasing estimates by {(1/avg_efficiency-1)*100:.0f}%.',
                'severity': 'high'
            })
        elif avg_efficiency > 1.2:
            suggestions.append({
                'type': 'estimate_adjustment',
                'message': f'Historical data shows tasks typically take {avg_efficiency:.1f}x less time than estimated. Consider reducing estimates by {(avg_efficiency-1)*100:.0f}%.',
                'severity': 'medium'
            })
        
        # Analyze complexity factors
        complexity_factors = [h['complexity_factors'] for h in historical_data if h['complexity_factors']]
        if complexity_factors:
            # Find common challenges
            all_challenges = []
            for cf in complexity_factors:
                if 'challenges_encountered' in cf:
                    all_challenges.extend(cf['challenges_encountered'])
            
            if all_challenges:
                challenge_counts = {}
                for challenge in all_challenges:
                    challenge_counts[challenge] = challenge_counts.get(challenge, 0) + 1
                
                most_common_challenge = max(challenge_counts.items(), key=lambda x: x[1])
                if most_common_challenge[1] > len(historical_data) * 0.3:  # If 30%+ tasks had this challenge
                    suggestions.append({
                        'type': 'risk_mitigation',
                        'message': f'Common challenge: {most_common_challenge[0]}. Consider adding buffer time or additional resources.',
                        'severity': 'medium'
                    })
        
        return suggestions
    
    def _simulate_prediction(self, task_data):
        """Fallback simulation-based prediction when no historical data is available"""
        try:
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
                'confidence': round(0.85, 2),  # Lower confidence for simulation-based predictions
                'risk_score': round(std_delay / mean_delay if mean_delay > 0 else 0.5, 2),
                'confidence_interval': [round(ci, 2) for ci in confidence_interval],
                'method': 'simulation'
            }
        except Exception as e:
            print(f"Error in simulation prediction: {e}")
            # Fallback to simple prediction
            return {
                'predicted_delay': task_data.get('complexity', 8) * 0.2,
                'confidence': 0.6,
                'risk_score': 0.5,
                'method': 'fallback'
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

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """Update project details"""
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    
    # Update project fields
    if 'name' in data:
        project.name = data['name']
    if 'description' in data:
        project.description = data['description']
    if 'status' in data:
        project.status = data['status']
    if 'priority' in data:
        project.priority = data['priority']
    if 'budget' in data:
        project.budget = data['budget']
    if 'progress' in data:
        project.progress = data['progress']
    if 'start_date' in data and data['start_date']:
        project.start_date = datetime.fromisoformat(data['start_date'])
    if 'end_date' in data and data['end_date']:
        project.end_date = datetime.fromisoformat(data['end_date'])
    
    db.session.commit()
    
    return jsonify({'message': 'Project updated successfully'})

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Delete a project"""
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    # Delete related tasks and work units
    Task.query.filter_by(project_id=project_id).delete()
    WorkUnit.query.filter_by(project_id=project_id).delete()
    
    # Delete the project
    db.session.delete(project)
    db.session.commit()
    
    return jsonify({'message': 'Project deleted successfully'})

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

@app.route('/api/kanban/task/<int:task_id>', methods=['PUT'])
def update_kanban_task(task_id):
    """Update task column and status for Kanban board"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    if 'column' in data:
        task.kanban_column = data['column']
    
    if 'status' in data:
        task.status = data['status']
    
    if 'progress' in data:
        task.progress = data['progress']
    
    if 'assigned_to' in data:
        task.assigned_to = data['assigned_to']
    
    if 'due_date' in data and data['due_date']:
        task.due_date = datetime.fromisoformat(data['due_date'])
    
    db.session.commit()
    
    # Emit WebSocket update
    socketio.emit('kanban_update', {'project_id': task.project_id})
    
    return jsonify({'message': 'Task updated successfully'})

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update task details"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    # Update task fields
    if 'name' in data:
        task.name = data['name']
    if 'description' in data:
        task.description = data['description']
    if 'priority' in data:
        task.priority = data['priority']
    if 'status' in data:
        old_status = task.status
        task.status = data['status']
        
        # Track time when status changes
        if data['status'] == 'in_progress' and not task.started_at:
            task.started_at = datetime.utcnow()
        elif data['status'] == 'completed' and not task.completed_at:
            task.completed_at = datetime.utcnow()
            # Calculate time spent if we have start time
            if task.started_at:
                time_diff = task.completed_at - task.started_at
                task.time_spent = time_diff.total_seconds() / 3600  # Convert to hours
            
            # Learn from completion
            ai_client.learn_from_completion(task_id)
    
    if 'assigned_to' in data:
        task.assigned_to = data['assigned_to']
    if 'progress' in data:
        task.progress = data['progress']
    if 'estimated_hours' in data:
        task.estimated_hours = data['estimated_hours']
    if 'actual_hours' in data:
        task.actual_hours = data['actual_hours']
    if 'due_date' in data and data['due_date']:
        task.due_date = datetime.fromisoformat(data['due_date'])
    if 'start_date' in data and data['start_date']:
        task.start_date = datetime.fromisoformat(data['start_date'])
    if 'end_date' in data and data['end_date']:
        task.end_date = datetime.fromisoformat(data['end_date'])
    if 'dependencies' in data:
        task.dependencies = data['dependencies']
    if 'kanban_column' in data:
        task.kanban_column = data['kanban_column']
    
    db.session.commit()
    
    return jsonify({'message': 'Task updated successfully'})

@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Mark task as completed and track completion data"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json() or {}
    
    # Update task status
    task.status = 'completed'
    task.progress = 100
    
    # Set completion time
    if not task.completed_at:
        task.completed_at = datetime.utcnow()
    
    # Calculate time spent
    if task.started_at and task.completed_at:
        time_diff = task.completed_at - task.started_at
        task.time_spent = time_diff.total_seconds() / 3600  # Convert to hours
    
    # Update actual hours if provided
    if 'actual_hours' in data:
        task.actual_hours = data['actual_hours']
    
    # Calculate efficiency score
    if task.estimated_hours and task.actual_hours:
        task.efficiency_score = task.estimated_hours / task.actual_hours
    
    # Learn from completion
    learning_success = ai_client.learn_from_completion(task_id)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Task completed successfully',
        'time_spent': task.time_spent,
        'efficiency_score': task.efficiency_score,
        'learning_success': learning_success
    })

@app.route('/api/tasks/<int:task_id>/start', methods=['POST'])
def start_task(task_id):
    """Mark task as started and track start time"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    task.status = 'in_progress'
    if not task.started_at:
        task.started_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Task started successfully'})

@app.route('/api/tasks/<int:task_id>/time-tracking', methods=['POST'])
def update_time_tracking(task_id):
    """Update time tracking for a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    if 'actual_hours' in data:
        task.actual_hours = data['actual_hours']
    
    if 'time_spent' in data:
        task.time_spent = data['time_spent']
    
    # Recalculate efficiency score
    if task.estimated_hours and task.actual_hours:
        task.efficiency_score = task.estimated_hours / task.actual_hours
    
    db.session.commit()
    
    return jsonify({'message': 'Time tracking updated successfully'})

@app.route('/api/ai/improvement-suggestions', methods=['POST'])
def get_improvement_suggestions():
    """Get AI suggestions for improving task estimates"""
    data = request.get_json()
    suggestions = ai_client.get_improvement_suggestions(data)
    return jsonify({'suggestions': suggestions})

@app.route('/api/analytics/efficiency', methods=['GET'])
def get_efficiency_analytics():
    """Get efficiency analytics based on historical data"""
    try:
        # Get recent completion history
        recent_history = TaskCompletionHistory.query.order_by(
            TaskCompletionHistory.completed_at.desc()
        ).limit(100).all()
        
        if not recent_history:
            return jsonify({'message': 'No historical data available'})
        
        # Calculate overall efficiency
        efficiency_scores = [h.efficiency_score for h in recent_history if h.efficiency_score]
        avg_efficiency = sum(efficiency_scores) / len(efficiency_scores) if efficiency_scores else 1.0
        
        # Efficiency by role type
        role_efficiency = {}
        for history in recent_history:
            if history.role_type not in role_efficiency:
                role_efficiency[history.role_type] = []
            if history.efficiency_score:
                role_efficiency[history.role_type].append(history.efficiency_score)
        
        role_avg_efficiency = {}
        for role, scores in role_efficiency.items():
            role_avg_efficiency[role] = sum(scores) / len(scores)
        
        # Efficiency by task type
        task_type_efficiency = {}
        for history in recent_history:
            if history.task_type not in task_type_efficiency:
                task_type_efficiency[history.task_type] = []
            if history.efficiency_score:
                task_type_efficiency[history.task_type].append(history.efficiency_score)
        
        task_type_avg_efficiency = {}
        for task_type, scores in task_type_efficiency.items():
            task_type_avg_efficiency[task_type] = sum(scores) / len(scores)
        
        # Recent trends (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_history_30d = TaskCompletionHistory.query.filter(
            TaskCompletionHistory.completed_at >= thirty_days_ago
        ).all()
        
        recent_efficiency_scores = [h.efficiency_score for h in recent_history_30d if h.efficiency_score]
        recent_avg_efficiency = sum(recent_efficiency_scores) / len(recent_efficiency_scores) if recent_efficiency_scores else 1.0
        
        return jsonify({
            'overall_efficiency': avg_efficiency,
            'recent_efficiency': recent_avg_efficiency,
            'role_efficiency': role_avg_efficiency,
            'task_type_efficiency': task_type_avg_efficiency,
            'total_completed_tasks': len(recent_history),
            'recent_completed_tasks': len(recent_history_30d),
            'improvement_trend': 'improving' if recent_avg_efficiency > avg_efficiency else 'declining' if recent_avg_efficiency < avg_efficiency else 'stable'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
    
    # Save simulation results
    simulation = MonteCarloSimulation(
        project_id=project_id,
        iterations=iterations,
        results=results
    )
    db.session.add(simulation)
    db.session.commit()
    
    return jsonify(results)

@app.route('/api/simulation/<int:project_id>/history', methods=['GET'])
def get_simulation_history(project_id):
    """Get simulation history for a project"""
    simulations = MonteCarloSimulation.query.filter_by(project_id=project_id).order_by(MonteCarloSimulation.simulation_date.desc()).limit(10).all()
    
    history = []
    for sim in simulations:
        history.append({
            'id': sim.id,
            'simulation_date': sim.simulation_date.isoformat(),
            'iterations': sim.iterations,
            'results': sim.results
        })
    
    return jsonify(history)

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
        
        # Initialize sample data if database is empty
        if Project.query.count() == 0:
            print("Initializing sample data...")
            
            # Create sample users
            sample_users = [
                User(username='john_doe', email='john@example.com', role='project_manager', department='Engineering'),
                User(username='jane_smith', email='jane@example.com', role='mechanical_designer', department='Design'),
                User(username='bob_wilson', email='bob@example.com', role='electrical_designer', department='Electrical'),
                User(username='alice_brown', email='alice@example.com', role='simulation_engineer', department='Simulation'),
            ]
            
            for user in sample_users:
                db.session.add(user)
            
            # Create sample project
            sample_project = Project(
                name='Automotive Assembly Line Design',
                description='Design and implementation of a new automotive assembly line with AI-powered optimization',
                status='active',
                start_date=datetime.now(),
                end_date=datetime.now() + timedelta(days=90),
                budget=500000,
                priority='high',
                progress=25.0
            )
            db.session.add(sample_project)
            db.session.commit()
            
            # Create sample tasks
            sample_tasks = [
                Task(
                    project_id=sample_project.id,
                    name='Initial Design Review',
                    description='Review initial design concepts and requirements',
                    status='completed',
                    priority='high',
                    assigned_to=1,
                    progress=100,
                    kanban_column='done',
                    estimated_hours=8,
                    actual_hours=8
                ),
                Task(
                    project_id=sample_project.id,
                    name='CAD Modeling',
                    description='Create detailed CAD models for assembly components',
                    status='in_progress',
                    priority='high',
                    assigned_to=2,
                    progress=60,
                    kanban_column='in_progress',
                    estimated_hours=40,
                    actual_hours=24
                ),
                Task(
                    project_id=sample_project.id,
                    name='Electrical System Design',
                    description='Design electrical control systems and wiring',
                    status='pending',
                    priority='medium',
                    assigned_to=3,
                    progress=0,
                    kanban_column='todo',
                    estimated_hours=32
                ),
                Task(
                    project_id=sample_project.id,
                    name='Simulation Analysis',
                    description='Run performance simulations and optimization',
                    status='pending',
                    priority='medium',
                    assigned_to=4,
                    progress=0,
                    kanban_column='backlog',
                    estimated_hours=24
                )
            ]
            
            for task in sample_tasks:
                db.session.add(task)
            
            # Create sample work units
            sample_work_units = [
                WorkUnit(
                    project_id=sample_project.id,
                    name='Mechanical Design Phase',
                    description='Complete mechanical design of assembly line components',
                    work_unit_type='design',
                    role_type='mechanical_designer',
                    assigned_to=2,
                    status='in_progress',
                    priority='high',
                    estimated_hours=80,
                    actual_hours=48,
                    progress=60
                ),
                WorkUnit(
                    project_id=sample_project.id,
                    name='Electrical System Integration',
                    description='Design and integrate electrical control systems',
                    work_unit_type='design',
                    role_type='electrical_designer',
                    assigned_to=3,
                    status='pending',
                    priority='medium',
                    estimated_hours=64,
                    progress=0
                ),
                WorkUnit(
                    project_id=sample_project.id,
                    name='Performance Simulation',
                    description='Run comprehensive performance simulations',
                    work_unit_type='simulation',
                    role_type='simulation_engineer',
                    assigned_to=4,
                    status='pending',
                    priority='medium',
                    estimated_hours=48,
                    progress=0
                )
            ]
            
            for work_unit in sample_work_units:
                db.session.add(work_unit)
            
            db.session.commit()
            print("Sample data initialized successfully!")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000))) 