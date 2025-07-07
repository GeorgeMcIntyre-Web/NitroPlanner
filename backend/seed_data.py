from app_simple import app, db, User, Project, Task
from datetime import datetime, timedelta
import random

def seed_database():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        # Create sample users
        users = [
            User(username='john_doe', email='john@example.com', role='designer', department='Engineering'),
            User(username='jane_smith', email='jane@example.com', role='engineer', department='Engineering'),
            User(username='mike_wilson', email='mike@example.com', role='technician', department='Manufacturing'),
            User(username='sarah_jones', email='sarah@example.com', role='manager', department='Management'),
            User(username='alex_brown', email='alex@example.com', role='engineer', department='Engineering'),
        ]
        
        for user in users:
            db.session.add(user)
        db.session.commit()
        
        # Create sample project
        project = Project(
            name='Automated Assembly Line Design',
            description='Design and implement an automated assembly line for automotive components',
            start_date=datetime.now() - timedelta(days=30),
            end_date=datetime.now() + timedelta(days=60),
            budget=500000,
            priority='high',
            progress=35.0
        )
        db.session.add(project)
        db.session.commit()
        
        # Create sample tasks for Kanban board
        tasks = [
            # Backlog tasks
            Task(
                project_id=project.id,
                name='Requirements Analysis',
                description='Analyze customer requirements and technical specifications',
                priority='high',
                assigned_to=1,
                due_date=datetime.now() + timedelta(days=5),
                estimated_hours=16.0,
                kanban_column='backlog',
                start_date=datetime.now() + timedelta(days=1),
                end_date=datetime.now() + timedelta(days=5)
            ),
            Task(
                project_id=project.id,
                name='Market Research',
                description='Research existing solutions and market trends',
                priority='medium',
                assigned_to=4,
                due_date=datetime.now() + timedelta(days=7),
                estimated_hours=12.0,
                kanban_column='backlog',
                start_date=datetime.now() + timedelta(days=2),
                end_date=datetime.now() + timedelta(days=7)
            ),
            
            # Todo tasks
            Task(
                project_id=project.id,
                name='System Architecture Design',
                description='Design the overall system architecture and component layout',
                priority='high',
                assigned_to=2,
                due_date=datetime.now() + timedelta(days=10),
                estimated_hours=24.0,
                kanban_column='todo',
                start_date=datetime.now() + timedelta(days=6),
                end_date=datetime.now() + timedelta(days=10)
            ),
            Task(
                project_id=project.id,
                name='Safety System Design',
                description='Design safety systems and emergency protocols',
                priority='high',
                assigned_to=2,
                due_date=datetime.now() + timedelta(days=12),
                estimated_hours=20.0,
                kanban_column='todo',
                start_date=datetime.now() + timedelta(days=8),
                end_date=datetime.now() + timedelta(days=12)
            ),
            
            # In Progress tasks
            Task(
                project_id=project.id,
                name='Mechanical Design',
                description='Design mechanical components and assemblies',
                priority='high',
                assigned_to=1,
                due_date=datetime.now() + timedelta(days=15),
                estimated_hours=40.0,
                actual_hours=25.0,
                progress=62.5,
                started_at=datetime.now() - timedelta(days=5),
                time_spent=25.0,
                efficiency_score=1.6,
                kanban_column='in_progress',
                start_date=datetime.now() - timedelta(days=5),
                end_date=datetime.now() + timedelta(days=15)
            ),
            Task(
                project_id=project.id,
                name='Electrical System Design',
                description='Design electrical control systems and wiring',
                priority='medium',
                assigned_to=5,
                due_date=datetime.now() + timedelta(days=18),
                estimated_hours=32.0,
                actual_hours=18.0,
                progress=56.25,
                started_at=datetime.now() - timedelta(days=3),
                time_spent=18.0,
                efficiency_score=1.78,
                kanban_column='in_progress',
                start_date=datetime.now() - timedelta(days=3),
                end_date=datetime.now() + timedelta(days=18)
            ),
            
            # Review tasks
            Task(
                project_id=project.id,
                name='CAD Modeling',
                description='Create detailed 3D CAD models of all components',
                priority='medium',
                assigned_to=1,
                due_date=datetime.now() + timedelta(days=8),
                estimated_hours=28.0,
                actual_hours=28.0,
                progress=100.0,
                started_at=datetime.now() - timedelta(days=10),
                completed_at=datetime.now() - timedelta(days=2),
                time_spent=28.0,
                efficiency_score=1.0,
                kanban_column='review',
                start_date=datetime.now() - timedelta(days=10),
                end_date=datetime.now() - timedelta(days=2)
            ),
            
            # Done tasks
            Task(
                project_id=project.id,
                name='Project Planning',
                description='Create project plan, timeline, and resource allocation',
                priority='high',
                assigned_to=4,
                due_date=datetime.now() - timedelta(days=5),
                estimated_hours=16.0,
                actual_hours=14.0,
                progress=100.0,
                started_at=datetime.now() - timedelta(days=20),
                completed_at=datetime.now() - timedelta(days=5),
                time_spent=14.0,
                efficiency_score=1.14,
                kanban_column='done',
                start_date=datetime.now() - timedelta(days=20),
                end_date=datetime.now() - timedelta(days=5)
            ),
            Task(
                project_id=project.id,
                name='Team Setup',
                description='Assemble project team and assign roles',
                priority='medium',
                assigned_to=4,
                due_date=datetime.now() - timedelta(days=15),
                estimated_hours=8.0,
                actual_hours=8.0,
                progress=100.0,
                started_at=datetime.now() - timedelta(days=25),
                completed_at=datetime.now() - timedelta(days=15),
                time_spent=8.0,
                efficiency_score=1.0,
                kanban_column='done',
                start_date=datetime.now() - timedelta(days=25),
                end_date=datetime.now() - timedelta(days=15)
            ),
        ]
        
        for task in tasks:
            db.session.add(task)
        db.session.commit()
        
        print("Database seeded successfully!")
        print(f"Created {len(users)} users")
        print(f"Created 1 project")
        print(f"Created {len(tasks)} tasks")

if __name__ == '__main__':
    seed_database() 