const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Simple hashPassword function for seeding
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

async function main() {
  console.log('🌱 Starting 6-Robot Cell Project seeding...');

  // Delete all data from relevant tables (order matters for foreign keys)
  await prisma.manufacturingStep.deleteMany();
  await prisma.manufacturingInstruction.deleteMany();
  await prisma.bOMComponent.deleteMany();
  await prisma.billOfMaterials.deleteMany();
  await prisma.cADExtractionTemplate.deleteMany();
  await prisma.cADSoftware.deleteMany();
  await prisma.processTemplate.deleteMany();
  await prisma.designTemplate.deleteMany();
  await prisma.designReview.deleteMany();
  await prisma.designVersion.deleteMany();
  await prisma.designFile.deleteMany();
  await prisma.monteCarloSimulation.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.checkpoint.deleteMany();
  await prisma.workUnit.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Create sample company
  const company = await prisma.company.create({
    data: {
      name: 'Automotive Manufacturing Solutions',
      industry: 'automotive',
      companySize: 'large',
      subscriptionTier: 'enterprise',
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        theme: 'dark'
      }
    }
  });

  console.log('✅ Created company:', company.name);

  // Create users for the 6-robot cell project team
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'sarah.chen@automotive.com' },
      update: {},
      create: {
        email: 'sarah.chen@automotive.com',
        username: 'sarah_chen',
        passwordHash: await hashPassword('password123'),
        firstName: 'Sarah',
        lastName: 'Chen',
        role: 'mechanical_designer',
        department: 'Engineering',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'michael.rodriguez@automotive.com' },
      update: {},
      create: {
        email: 'michael.rodriguez@automotive.com',
        username: 'michael_rodriguez',
        passwordHash: await hashPassword('password123'),
        firstName: 'Michael',
        lastName: 'Rodriguez',
        role: 'simulation_engineer',
        department: 'Engineering',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'david.kim@automotive.com' },
      update: {},
      create: {
        email: 'david.kim@automotive.com',
        username: 'david_kim',
        passwordHash: await hashPassword('password123'),
        firstName: 'David',
        lastName: 'Kim',
        role: 'manufacturing_engineer',
        department: 'Manufacturing',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'lisa.thompson@automotive.com' },
      update: {},
      create: {
        email: 'lisa.thompson@automotive.com',
        username: 'lisa_thompson',
        passwordHash: await hashPassword('password123'),
        firstName: 'Lisa',
        lastName: 'Thompson',
        role: 'procurement_specialist',
        department: 'Procurement',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'james.wilson@automotive.com' },
      update: {},
      create: {
        email: 'james.wilson@automotive.com',
        username: 'james_wilson',
        passwordHash: await hashPassword('password123'),
        firstName: 'James',
        lastName: 'Wilson',
        role: 'logistics_coordinator',
        department: 'Logistics',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'robert.johnson@automotive.com' },
      update: {},
      create: {
        email: 'robert.johnson@automotive.com',
        username: 'robert_johnson',
        passwordHash: await hashPassword('password123'),
        firstName: 'Robert',
        lastName: 'Johnson',
        role: 'site_engineer',
        department: 'Installation',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'alex.thompson@automotive.com' },
      update: {},
      create: {
        email: 'alex.thompson@automotive.com',
        username: 'alex_thompson',
        passwordHash: await hashPassword('password123'),
        firstName: 'Alex',
        lastName: 'Thompson',
        role: 'plc_engineer',
        department: 'Controls',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'robert.martinez@automotive.com' },
      update: {},
      create: {
        email: 'robert.martinez@automotive.com',
        username: 'robert_martinez',
        passwordHash: await hashPassword('password123'),
        firstName: 'Robert',
        lastName: 'Martinez',
        role: 'robot_engineer',
        department: 'Robotics',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'emily.davis@automotive.com' },
      update: {},
      create: {
        email: 'emily.davis@automotive.com',
        username: 'emily_davis',
        passwordHash: await hashPassword('password123'),
        firstName: 'Emily',
        lastName: 'Davis',
        role: 'quality_engineer',
        department: 'Quality',
        companyId: company.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'project.manager@automotive.com' },
      update: {},
      create: {
        email: 'project.manager@automotive.com',
        username: 'project_manager',
        passwordHash: await hashPassword('password123'),
        firstName: 'Project',
        lastName: 'Manager',
        role: 'project_manager',
        department: 'Management',
        companyId: company.id
      }
    })
  ]);

  console.log('✅ Created users:', users.length);

  // Create the 6-Robot Cell Project
  const project = await prisma.project.create({
    data: {
      name: '6-Robot Cell for Automotive Spot Welding',
      description: 'Complete design, manufacturing, shipping, installation, and commissioning of a 6-robot cell for automotive spot welding with 47-second cycle time target. The project includes comprehensive shipping and logistics coordination, site installation with parallel tasks, PLC commissioning, and robot commissioning.',
      status: 'active',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-27'),
      budget: 2500000,
      priority: 'high',
      progress: 0,
      companyId: company.id,
      createdById: users[9].id // Project Manager
    }
  });

  console.log('✅ Created project:', project.name);

  // Create work units for the 6-robot cell project
  const workUnits = await Promise.all([
    // 1. Joint Data Import & Validation
    prisma.workUnit.create({
      data: {
        name: 'Joint Data Import & Validation',
        description: 'Import and validate joint data from CAD system. Ensure all weld/sealer points are correctly identified and positioned for the 6-robot cell configuration.',
        workUnitType: 'design',
        roleType: 'mechanical_designer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 16,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-03'),
        projectId: project.id,
        assignedToId: users[0].id, // Sarah Chen
        createdById: users[9].id
      }
    }),
    // 2. Sequence Chart Development
    prisma.workUnit.create({
      data: {
        name: 'Sequence Chart Development',
        description: 'Develop comprehensive sequence chart for 6-robot cell operation. Define robot coordination, cycle timing, and safety interlocks to achieve 47-second cycle time.',
        workUnitType: 'design',
        roleType: 'simulation_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 32,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-10'),
        projectId: project.id,
        assignedToId: users[1].id, // Michael Rodriguez
        createdById: users[9].id
      }
    }),
    // 3. Robot Cell Simulation
    prisma.workUnit.create({
      data: {
        name: 'Robot Cell Simulation',
        description: 'Create comprehensive robot cell simulation including all 6 robots, fixtures, and tooling. Validate collision-free operation and optimize robot paths.',
        workUnitType: 'simulation',
        roleType: 'simulation_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 48,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-01-31'),
        projectId: project.id,
        assignedToId: users[1].id, // Michael Rodriguez
        createdById: users[9].id
      }
    }),
    // 4. Robot Equipment List Generation
    prisma.workUnit.create({
      data: {
        name: 'Robot Equipment List Generation',
        description: 'Generate detailed robot equipment specifications including robot types, software packages, options, and configurations based on simulation requirements.',
        workUnitType: 'specification',
        roleType: 'simulation_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 16,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-02-03'),
        endDate: new Date('2025-02-07'),
        projectId: project.id,
        assignedToId: users[1].id, // Michael Rodriguez
        createdById: users[9].id
      }
    }),
    // 5. Custom Fixture Manufacturing
    prisma.workUnit.create({
      data: {
        name: 'Custom Fixture Manufacturing',
        description: 'Manufacture custom fixtures and tooling for the 6-robot cell based on design specifications. Includes grippers, tool changers, and specialized tooling.',
        workUnitType: 'manufacturing',
        roleType: 'manufacturing_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 160,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-03-07'),
        projectId: project.id,
        assignedToId: users[2].id, // David Kim
        createdById: users[9].id
      }
    }),
    // 6. Robot Procurement & Delivery
    prisma.workUnit.create({
      data: {
        name: 'Robot Procurement & Delivery',
        description: 'Procure 6 robots with specified configurations and software packages. Coordinate delivery timing with installation schedule.',
        workUnitType: 'procurement',
        roleType: 'procurement_specialist',
        status: 'pending',
        priority: 'high',
        estimatedHours: 40,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-04-25'),
        projectId: project.id,
        assignedToId: users[3].id, // Lisa Thompson
        createdById: users[9].id
      }
    }),
    // 7. Custom Items Shipping Coordination
    prisma.workUnit.create({
      data: {
        name: 'Custom Items Shipping Coordination',
        description: 'Coordinate shipping of custom manufactured items including fixtures, tooling, and specialized components. Ensure timely delivery for installation.',
        workUnitType: 'logistics',
        roleType: 'logistics_coordinator',
        status: 'pending',
        priority: 'high',
        estimatedHours: 24,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-04-25'),
        projectId: project.id,
        assignedToId: users[4].id, // James Wilson
        createdById: users[9].id
      }
    }),
    // 8. Site Preparation & Marking
    prisma.workUnit.create({
      data: {
        name: 'Site Preparation & Marking',
        description: 'Mark cell area using measuring equipment relative to datum. Mark robot positions, fixture locations, electrical panel locations, and pneumatic piping routes.',
        workUnitType: 'installation',
        roleType: 'site_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 40,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-04-28'),
        endDate: new Date('2025-05-02'),
        projectId: project.id,
        assignedToId: users[5].id, // Robert Johnson
        createdById: users[9].id
      }
    }),
    // 9. Equipment Installation (Parallel)
    prisma.workUnit.create({
      data: {
        name: 'Equipment Installation (Parallel)',
        description: 'Install all equipment including robots, fixtures, electrical panels, and pneumatic equipment. This task runs in parallel with other installation activities.',
        workUnitType: 'installation',
        roleType: 'installation_technician',
        status: 'pending',
        priority: 'high',
        estimatedHours: 160,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-05-05'),
        endDate: new Date('2025-05-16'),
        projectId: project.id,
        assignedToId: users[5].id, // Robert Johnson (acting as installation team lead)
        createdById: users[9].id
      }
    }),
    // 10. Systems Integration
    prisma.workUnit.create({
      data: {
        name: 'Systems Integration',
        description: 'Integrate electrical, pneumatic, and safety systems. Install trunking, wiring, piping, fencing, and electrical panels.',
        workUnitType: 'integration',
        roleType: 'systems_integration_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 40,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-05-19'),
        endDate: new Date('2025-05-23'),
        projectId: project.id,
        assignedToId: users[6].id, // Alex Thompson
        createdById: users[9].id
      }
    }),
    // 11. PLC Commissioning
    prisma.workUnit.create({
      data: {
        name: 'PLC Commissioning',
        description: 'Download PLC offline program, perform I/O checking and validation, validate sequence, and download HMI. Power-on milestone for PLC system.',
        workUnitType: 'commissioning',
        roleType: 'plc_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 40,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-05-26'),
        endDate: new Date('2025-06-02'),
        projectId: project.id,
        assignedToId: users[6].id, // Alex Thompson
        createdById: users[9].id
      }
    }),
    // 12. Robot Commissioning
    prisma.workUnit.create({
      data: {
        name: 'Robot Commissioning',
        description: 'Download robot offline program, validate paths with/without parts, program each point, set up program structure, and configure robot-to-robot coordination. Power-on milestone for robot system.',
        workUnitType: 'commissioning',
        roleType: 'robot_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 80,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-06-03'),
        endDate: new Date('2025-06-13'),
        projectId: project.id,
        assignedToId: users[7].id, // Robert Martinez
        createdById: users[9].id
      }
    }),
    // 13. Final Testing & Production Handoff
    prisma.workUnit.create({
      data: {
        name: 'Final Testing & Production Handoff',
        description: 'Perform comprehensive testing of the complete 6-robot cell system. Validate cycle time, quality, and safety. Hand over to production team.',
        workUnitType: 'testing',
        roleType: 'quality_engineer',
        status: 'pending',
        priority: 'high',
        estimatedHours: 40,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2025-06-16'),
        endDate: new Date('2025-06-27'),
        projectId: project.id,
        assignedToId: users[8].id, // Emily Davis
        createdById: users[9].id
      }
    })
  ]);

  console.log('✅ Created work units:', workUnits.length);

  // Create checkpoints for key work units
  const checkpoints = await Promise.all([
    // Checkpoints for Joint Data Import & Validation
    prisma.checkpoint.create({
      data: {
        name: 'Data Import Complete',
        description: 'All joint data successfully imported from CAD system',
        status: 'pending',
        dueDate: new Date('2025-01-02'),
        workUnitId: workUnits[0].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Data Validation Complete',
        description: 'All weld/sealer points validated and positioned correctly',
        status: 'pending',
        dueDate: new Date('2025-01-03'),
        workUnitId: workUnits[0].id
      }
    }),
    // Checkpoints for Sequence Chart Development
    prisma.checkpoint.create({
      data: {
        name: 'Initial Sequence Created',
        description: 'Basic robot sequence chart developed',
        status: 'pending',
        dueDate: new Date('2025-01-08'),
        workUnitId: workUnits[1].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Cycle Time Optimization',
        description: 'Sequence optimized to meet 47-second target',
        status: 'pending',
        dueDate: new Date('2025-01-10'),
        workUnitId: workUnits[1].id
      }
    }),
    // Checkpoints for Robot Cell Simulation
    prisma.checkpoint.create({
      data: {
        name: 'Simulation Model Created',
        description: 'Complete 6-robot cell simulation model built',
        status: 'pending',
        dueDate: new Date('2025-01-24'),
        workUnitId: workUnits[2].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Collision Analysis Complete',
        description: 'All robot paths validated as collision-free',
        status: 'pending',
        dueDate: new Date('2025-01-31'),
        workUnitId: workUnits[2].id
      }
    }),
    // Checkpoints for PLC Commissioning
    prisma.checkpoint.create({
      data: {
        name: 'PLC Program Downloaded',
        description: 'PLC offline program downloaded and functional',
        status: 'pending',
        dueDate: new Date('2025-05-28'),
        workUnitId: workUnits[10].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'I/O Validation Complete',
        description: 'All I/O devices tested and validated',
        status: 'pending',
        dueDate: new Date('2025-05-30'),
        workUnitId: workUnits[10].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Sequence Validation Complete',
        description: 'Machine operation sequence validated',
        status: 'pending',
        dueDate: new Date('2025-06-02'),
        workUnitId: workUnits[10].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'HMI Operational',
        description: 'HMI interface downloaded and operational',
        status: 'pending',
        dueDate: new Date('2025-06-02'),
        workUnitId: workUnits[10].id
      }
    }),
    // Checkpoints for Robot Commissioning
    prisma.checkpoint.create({
      data: {
        name: 'Robot Programs Downloaded',
        description: 'All robot offline programs downloaded and functional',
        status: 'pending',
        dueDate: new Date('2025-06-05'),
        workUnitId: workUnits[11].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Path Validation Complete',
        description: 'All robot paths validated as collision-free',
        status: 'pending',
        dueDate: new Date('2025-06-09'),
        workUnitId: workUnits[11].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Point Programming Complete',
        description: 'All weld/sealer points programmed and tested',
        status: 'pending',
        dueDate: new Date('2025-06-11'),
        workUnitId: workUnits[11].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Program Structure Established',
        description: 'Master program structure and subroutines created',
        status: 'pending',
        dueDate: new Date('2025-06-13'),
        workUnitId: workUnits[11].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Robot Coordination Validated',
        description: 'Robot-to-robot coordination and synchronization working',
        status: 'pending',
        dueDate: new Date('2025-06-13'),
        workUnitId: workUnits[11].id
      }
    }),
    // Checkpoints for Final Testing
    prisma.checkpoint.create({
      data: {
        name: 'System Testing Complete',
        description: 'Complete system testing performed',
        status: 'pending',
        dueDate: new Date('2025-06-20'),
        workUnitId: workUnits[12].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Cycle Time Validation',
        description: '47-second cycle time target achieved',
        status: 'pending',
        dueDate: new Date('2025-06-23'),
        workUnitId: workUnits[12].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Quality Validation',
        description: 'All quality requirements met',
        status: 'pending',
        dueDate: new Date('2025-06-25'),
        workUnitId: workUnits[12].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Production Handoff',
        description: 'System handed over to production team',
        status: 'pending',
        dueDate: new Date('2025-06-27'),
        workUnitId: workUnits[12].id
      }
    })
  ]);

  console.log('✅ Created checkpoints:', checkpoints.length);

  console.log('🎉 6-Robot Cell Project seeding completed successfully!');
  console.log('');
  console.log('📋 Project Summary:');
  console.log(`   Project: ${project.name}`);
  console.log(`   Timeline: ${project.startDate.toLocaleDateString()} - ${project.endDate.toLocaleDateString()}`);
  console.log(`   Budget: $${project.budget.toLocaleString()}`);
  console.log(`   Work Units: ${workUnits.length}`);
  console.log(`   Team Members: ${users.length}`);
  console.log(`   Checkpoints: ${checkpoints.length}`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   Email: project.manager@automotive.com');
  console.log('   Password: password123');
  console.log('');
  console.log('👥 Team Members:');
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 