#!/usr/bin/env python3
"""
Seed script to create demo users for NitroPlanner authentication system.
"""

import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole

def create_demo_users():
    """Create demo users for testing."""
    
    with app.app_context():
        # Create database tables
        db.create_all()
        
        # Check if demo user already exists
        demo_user = User.query.filter_by(username='demo').first()
        if demo_user:
            print("Demo user already exists. Skipping creation.")
            return
        
        # Create demo user
        demo_user = User(
            username='demo',
            email='demo@nitroplanner.com',
            first_name='Demo',
            last_name='User',
            role=UserRole.PROJECT_MANAGER,
            is_active=True
        )
        demo_user.set_password('demo123')
        
        # Create admin user
        admin_user = User(
            username='admin',
            email='admin@nitroplanner.com',
            first_name='Admin',
            last_name='User',
            role=UserRole.ADMIN,
            is_active=True
        )
        admin_user.set_password('admin123')
        
        # Create various role users
        users_data = [
            {
                'username': 'mechanical',
                'email': 'mechanical@nitroplanner.com',
                'first_name': 'John',
                'last_name': 'Mechanical',
                'role': UserRole.MECHANICAL_DESIGNER,
                'password': 'mechanical123'
            },
            {
                'username': 'electrical',
                'email': 'electrical@nitroplanner.com',
                'first_name': 'Jane',
                'last_name': 'Electrical',
                'role': UserRole.ELECTRICAL_DESIGNER,
                'password': 'electrical123'
            },
            {
                'username': 'simulation',
                'email': 'simulation@nitroplanner.com',
                'first_name': 'Bob',
                'last_name': 'Simulation',
                'role': UserRole.SIMULATION_ENGINEER,
                'password': 'simulation123'
            },
            {
                'username': 'manufacturing',
                'email': 'manufacturing@nitroplanner.com',
                'first_name': 'Alice',
                'last_name': 'Manufacturing',
                'role': UserRole.MANUFACTURING_ENGINEER,
                'password': 'manufacturing123'
            },
            {
                'username': 'quality',
                'email': 'quality@nitroplanner.com',
                'first_name': 'Charlie',
                'last_name': 'Quality',
                'role': UserRole.QUALITY_ENGINEER,
                'password': 'quality123'
            },
            {
                'username': 'technician',
                'email': 'technician@nitroplanner.com',
                'first_name': 'David',
                'last_name': 'Technician',
                'role': UserRole.TECHNICIAN,
                'password': 'technician123'
            }
        ]
        
        # Add all users to database
        db.session.add(demo_user)
        db.session.add(admin_user)
        
        for user_data in users_data:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                is_active=True
            )
            user.set_password(user_data['password'])
            db.session.add(user)
        
        # Commit all changes
        db.session.commit()
        
        print("✅ Demo users created successfully!")
        print("\n📋 Available demo accounts:")
        print("┌─────────────┬─────────────┬─────────────┬─────────────────────┐")
        print("│ Username    │ Password    │ Role        │ Email               │")
        print("├─────────────┼─────────────┼─────────────┼─────────────────────┤")
        print("│ demo        │ demo123     │ Project Mgr │ demo@nitroplanner.com│")
        print("│ admin       │ admin123    │ Admin       │ admin@nitroplanner.com│")
        print("│ mechanical  │ mechanical123│ Mech Design │ mechanical@nitroplanner.com│")
        print("│ electrical  │ electrical123│ Elec Design │ electrical@nitroplanner.com│")
        print("│ simulation  │ simulation123│ Simulation  │ simulation@nitroplanner.com│")
        print("│ manufacturing│ manufacturing123│ Manufacturing│ manufacturing@nitroplanner.com│")
        print("│ quality     │ quality123  │ Quality     │ quality@nitroplanner.com│")
        print("│ technician  │ technician123│ Technician  │ technician@nitroplanner.com│")
        print("└─────────────┴─────────────┴─────────────┴─────────────────────┘")
        print("\n🚀 You can now test the authentication system!")

if __name__ == '__main__':
    create_demo_users() 