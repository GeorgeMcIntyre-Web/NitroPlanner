import pytest
import tempfile
import os
from app import app, db
from datetime import datetime, timedelta
import factory
from factory.fuzzy import FuzzyText, FuzzyInteger, FuzzyChoice
from models import Project, Task, WorkUnit, Checkpoint, User, Role

class Config:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'test-secret-key'
    WTF_CSRF_ENABLED = False

@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.config.from_object(Config)
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def app_context():
    """Create an application context."""
    app.config.from_object(Config)
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

# Factory classes for test data
class ProjectFactory(factory.SQLAlchemyModelFactory):
    class Meta:
        model = Project
    
    name = FuzzyText(length=20)
    description = FuzzyText(length=100)
    status = FuzzyChoice(['active', 'completed', 'on_hold'])
    start_date = factory.LazyFunction(datetime.now)
    end_date = factory.LazyFunction(lambda: datetime.now() + timedelta(days=30))
    budget = FuzzyInteger(10000, 1000000)
    priority = FuzzyChoice(['low', 'medium', 'high'])

class TaskFactory(factory.SQLAlchemyModelFactory):
    class Meta:
        model = Task
    
    name = FuzzyText(length=20)
    description = FuzzyText(length=100)
    priority = FuzzyChoice(['low', 'medium', 'high'])
    status = FuzzyChoice(['pending', 'in_progress', 'completed'])
    kanban_column = FuzzyChoice(['backlog', 'todo', 'in_progress', 'review', 'done'])
    estimated_hours = FuzzyInteger(1, 40)
    actual_hours = FuzzyInteger(0, 50)
    progress = FuzzyInteger(0, 100)
    due_date = factory.LazyFunction(lambda: datetime.now() + timedelta(days=7))

class UserFactory(factory.SQLAlchemyModelFactory):
    class Meta:
        model = User
    
    username = FuzzyText(length=10)
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    role = FuzzyChoice(['mechanical_designer', 'electrical_designer', 'project_manager'])

class WorkUnitFactory(factory.SQLAlchemyModelFactory):
    class Meta:
        model = WorkUnit
    
    name = FuzzyText(length=20)
    description = FuzzyText(length=100)
    unit_type = FuzzyChoice(['design', 'simulation', 'manufacturing', 'testing', 'documentation'])
    estimated_duration = FuzzyInteger(1, 20)
    actual_duration = FuzzyInteger(0, 25)
    status = FuzzyChoice(['pending', 'in_progress', 'completed', 'blocked']) 