import pytest
import json
from datetime import datetime, timedelta
from tests.conftest import ProjectFactory, TaskFactory, UserFactory, WorkUnitFactory

class TestHealthAPI:
    """Test health check endpoint."""
    
    def test_health_check(self, client):
        """Test that health check endpoint returns 200."""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data

class TestProjectsAPI:
    """Test projects endpoints."""
    
    def test_get_projects_empty(self, client):
        """Test getting projects when none exist."""
        response = client.get('/api/projects')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == []
    
    def test_get_projects_with_data(self, client, app_context):
        """Test getting projects with existing data."""
        # Create test projects
        project1 = ProjectFactory()
        project2 = ProjectFactory()
        
        response = client.get('/api/projects')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]['name'] == project1.name
        assert data[1]['name'] == project2.name
    
    def test_create_project(self, client):
        """Test creating a new project."""
        project_data = {
            'name': 'Test Project',
            'description': 'A test project',
            'status': 'active',
            'start_date': datetime.now().isoformat(),
            'end_date': (datetime.now() + timedelta(days=30)).isoformat(),
            'budget': 100000,
            'priority': 'medium'
        }
        
        response = client.post('/api/projects', 
                             data=json.dumps(project_data),
                             content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['name'] == 'Test Project'
        assert data['status'] == 'active'
    
    def test_get_project_by_id(self, client, app_context):
        """Test getting a specific project by ID."""
        project = ProjectFactory()
        
        response = client.get(f'/api/projects/{project.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['name'] == project.name
        assert data['id'] == project.id
    
    def test_update_project(self, client, app_context):
        """Test updating a project."""
        project = ProjectFactory()
        update_data = {
            'name': 'Updated Project Name',
            'status': 'completed'
        }
        
        response = client.put(f'/api/projects/{project.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['name'] == 'Updated Project Name'
        assert data['status'] == 'completed'
    
    def test_delete_project(self, client, app_context):
        """Test deleting a project."""
        project = ProjectFactory()
        
        response = client.delete(f'/api/projects/{project.id}')
        assert response.status_code == 200
        
        # Verify project is deleted
        response = client.get(f'/api/projects/{project.id}')
        assert response.status_code == 404

class TestTasksAPI:
    """Test tasks endpoints."""
    
    def test_get_tasks_empty(self, client):
        """Test getting tasks when none exist."""
        response = client.get('/api/tasks')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == []
    
    def test_get_tasks_with_data(self, client, app_context):
        """Test getting tasks with existing data."""
        task1 = TaskFactory()
        task2 = TaskFactory()
        
        response = client.get('/api/tasks')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
    
    def test_create_task(self, client, app_context):
        """Test creating a new task."""
        project = ProjectFactory()
        task_data = {
            'name': 'Test Task',
            'description': 'A test task',
            'project_id': project.id,
            'priority': 'high',
            'estimated_hours': 8,
            'due_date': (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        response = client.post('/api/tasks',
                             data=json.dumps(task_data),
                             content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['name'] == 'Test Task'
        assert data['priority'] == 'high'
    
    def test_start_task(self, client, app_context):
        """Test starting a task."""
        task = TaskFactory(status='pending')
        
        response = client.post(f'/api/tasks/{task.id}/start')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'in_progress'
    
    def test_complete_task(self, client, app_context):
        """Test completing a task."""
        task = TaskFactory(status='in_progress')
        
        response = client.post(f'/api/tasks/{task.id}/complete')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'completed'

class TestKanbanAPI:
    """Test Kanban board endpoints."""
    
    def test_get_kanban_board(self, client, app_context):
        """Test getting Kanban board data."""
        project = ProjectFactory()
        task1 = TaskFactory(project_id=project.id, kanban_column='todo')
        task2 = TaskFactory(project_id=project.id, kanban_column='in_progress')
        
        response = client.get(f'/api/kanban/{project.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'todo' in data
        assert 'in_progress' in data
        assert len(data['todo']) == 1
        assert len(data['in_progress']) == 1

class TestWorkUnitsAPI:
    """Test work units endpoints."""
    
    def test_get_work_units(self, client, app_context):
        """Test getting work units."""
        work_unit = WorkUnitFactory()
        
        response = client.get('/api/work-units')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['name'] == work_unit.name
    
    def test_create_work_unit(self, client):
        """Test creating a work unit."""
        work_unit_data = {
            'name': 'Test Work Unit',
            'description': 'A test work unit',
            'unit_type': 'design',
            'estimated_duration': 5,
            'checkpoints': [
                {
                    'name': 'Design Review',
                    'checkpoint_type': 'review',
                    'required_approval': True
                }
            ]
        }
        
        response = client.post('/api/work-units',
                             data=json.dumps(work_unit_data),
                             content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['name'] == 'Test Work Unit'
        assert data['unit_type'] == 'design'

class TestSimulationAPI:
    """Test Monte Carlo simulation endpoints."""
    
    def test_run_simulation(self, client, app_context):
        """Test running Monte Carlo simulation."""
        project = ProjectFactory()
        TaskFactory.create_batch(5, project_id=project.id)
        
        simulation_data = {
            'iterations': 1000,
            'confidence_level': 0.95
        }
        
        response = client.post(f'/api/simulation/{project.id}',
                             data=json.dumps(simulation_data),
                             content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'completion_probability' in data
        assert 'expected_completion_date' in data
        assert 'risk_analysis' in data

class TestAIPredictionAPI:
    """Test AI prediction endpoints."""
    
    def test_predict_delay(self, client, app_context):
        """Test AI delay prediction."""
        task = TaskFactory()
        
        prediction_data = {
            'task_id': task.id,
            'current_progress': 50,
            'team_experience': 'high',
            'complexity': 'medium'
        }
        
        response = client.post('/api/ai/predict',
                             data=json.dumps(prediction_data),
                             content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'predicted_delay' in data
        assert 'confidence_score' in data
        assert 'risk_factors' in data

class TestDashboardAPI:
    """Test dashboard endpoints."""
    
    def test_get_dashboard_data(self, client, app_context):
        """Test getting dashboard data."""
        # Create test data
        ProjectFactory.create_batch(3)
        TaskFactory.create_batch(10)
        
        response = client.get('/api/dashboard')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'projects_summary' in data
        assert 'tasks_summary' in data
        assert 'kanban_summary' in data
        assert 'recent_activities' in data

class TestErrorHandling:
    """Test error handling."""
    
    def test_404_error(self, client):
        """Test 404 error handling."""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
    
    def test_invalid_json(self, client):
        """Test invalid JSON handling."""
        response = client.post('/api/projects',
                             data='invalid json',
                             content_type='application/json')
        assert response.status_code == 400
    
    def test_missing_required_fields(self, client):
        """Test missing required fields."""
        response = client.post('/api/projects',
                             data=json.dumps({'name': 'Test'}),
                             content_type='application/json')
        assert response.status_code == 400 