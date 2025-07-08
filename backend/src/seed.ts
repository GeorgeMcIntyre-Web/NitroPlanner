import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.checkpoint.deleteMany();
  await prisma.workUnit.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@nitroplanner.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      }
    }),
    prisma.user.create({
      data: {
        username: 'pm1',
        email: 'pm1@nitroplanner.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Manager',
        role: 'PROJECT_MANAGER'
      }
    }),
    prisma.user.create({
      data: {
        username: 'designer1',
        email: 'designer1@nitroplanner.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Designer',
        role: 'MECHANICAL_DESIGNER'
      }
    }),
    prisma.user.create({
      data: {
        username: 'engineer1',
        email: 'engineer1@nitroplanner.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Engineer',
        role: 'MANUFACTURING_ENGINEER'
      }
    }),
    prisma.user.create({
      data: {
        username: 'tech1',
        email: 'tech1@nitroplanner.com',
        passwordHash,
        firstName: 'Alex',
        lastName: 'Technician',
        role: 'TECHNICIAN'
      }
    })
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create a project
  const project = await prisma.project.create({
    data: {
      name: 'Nitro Engine Development',
      description: 'Development of a high-performance nitro engine for racing applications',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 50000.00,
      priority: 'high',
      createdBy: users[1].id // Project Manager
    }
  });

  console.log('✅ Created project');

  // Create work units
  const workUnits = await Promise.all([
    prisma.workUnit.create({
      data: {
        name: 'Engine Design Phase',
        description: 'Initial design and CAD modeling of the engine components',
        projectId: project.id,
        unitType: 'DESIGN',
        estimatedDuration: 40.0,
        assignedTo: users[2].id, // Designer
        status: 'in_progress'
      }
    }),
    prisma.workUnit.create({
      data: {
        name: 'Simulation and Analysis',
        description: 'FEA and CFD analysis of engine components',
        projectId: project.id,
        unitType: 'SIMULATION',
        estimatedDuration: 30.0,
        assignedTo: users[2].id, // Designer
        status: 'pending'
      }
    }),
    prisma.workUnit.create({
      data: {
        name: 'Prototype Manufacturing',
        description: 'Manufacturing of prototype engine components',
        projectId: project.id,
        unitType: 'MANUFACTURING',
        estimatedDuration: 60.0,
        assignedTo: users[3].id, // Engineer
        status: 'pending'
      }
    })
  ]);

  console.log(`✅ Created ${workUnits.length} work units`);

  // Create checkpoints
  await Promise.all([
    prisma.checkpoint.create({
      data: {
        name: 'Design Review',
        description: 'Review of initial engine design',
        workUnitId: workUnits[0].id,
        checkpointType: 'REVIEW',
        requiredApproval: true,
        status: 'pending'
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Design Approval',
        description: 'Final approval of engine design',
        workUnitId: workUnits[0].id,
        checkpointType: 'APPROVAL',
        requiredApproval: true,
        status: 'pending'
      }
    })
  ]);

  console.log('✅ Created checkpoints');

  // Create tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        name: 'Create Engine Block Design',
        description: 'Design the main engine block with proper cooling channels',
        projectId: project.id,
        assignedTo: users[2].id,
        priority: 'high',
        status: 'in_progress',
        kanbanColumn: 'in_progress',
        estimatedHours: 16.0,
        progress: 75,
        dueDate: new Date('2024-02-15')
      }
    }),
    prisma.task.create({
      data: {
        name: 'Design Cylinder Head',
        description: 'Design cylinder head with optimal valve geometry',
        projectId: project.id,
        assignedTo: users[2].id,
        priority: 'high',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 12.0,
        progress: 0,
        dueDate: new Date('2024-02-20')
      }
    }),
    prisma.task.create({
      data: {
        name: 'Design Crankshaft',
        description: 'Design balanced crankshaft for high RPM operation',
        projectId: project.id,
        assignedTo: users[2].id,
        priority: 'medium',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 8.0,
        progress: 0,
        dueDate: new Date('2024-02-25')
      }
    }),
    prisma.task.create({
      data: {
        name: 'FEA Analysis - Engine Block',
        description: 'Perform finite element analysis on engine block design',
        projectId: project.id,
        assignedTo: users[2].id,
        priority: 'medium',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 6.0,
        progress: 0,
        dueDate: new Date('2024-03-01')
      }
    }),
    prisma.task.create({
      data: {
        name: 'CFD Analysis - Cooling System',
        description: 'Perform computational fluid dynamics analysis on cooling system',
        projectId: project.id,
        assignedTo: users[2].id,
        priority: 'medium',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 8.0,
        progress: 0,
        dueDate: new Date('2024-03-05')
      }
    }),
    prisma.task.create({
      data: {
        name: 'Manufacture Engine Block Prototype',
        description: 'Manufacture prototype engine block using CNC machining',
        projectId: project.id,
        assignedTo: users[3].id,
        priority: 'high',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 24.0,
        progress: 0,
        dueDate: new Date('2024-03-15')
      }
    }),
    prisma.task.create({
      data: {
        name: 'Quality Control - Engine Block',
        description: 'Perform quality control checks on manufactured engine block',
        projectId: project.id,
        assignedTo: users[4].id,
        priority: 'high',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 4.0,
        progress: 0,
        dueDate: new Date('2024-03-20')
      }
    }),
    prisma.task.create({
      data: {
        name: 'Assembly Testing',
        description: 'Test assembly of engine components',
        projectId: project.id,
        assignedTo: users[3].id,
        priority: 'medium',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 12.0,
        progress: 0,
        dueDate: new Date('2024-03-25')
      }
    }),
    prisma.task.create({
      data: {
        name: 'Documentation',
        description: 'Create technical documentation for the engine design',
        projectId: project.id,
        assignedTo: users[1].id,
        priority: 'low',
        status: 'pending',
        kanbanColumn: 'backlog',
        estimatedHours: 10.0,
        progress: 0,
        dueDate: new Date('2024-04-01')
      }
    })
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 