const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./middleware/auth');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample company
  const company = await prisma.company.create({
    data: {
      name: 'Automotive Solutions Inc.',
      industry: 'automotive',
      companySize: 'medium',
      subscriptionTier: 'pro',
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        theme: 'dark'
      }
    }
  });

  console.log('✅ Created company:', company.name);

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@autosolutions.com',
        username: 'admin',
        password: await hashPassword('password123'),
        firstName: 'John',
        lastName: 'Admin',
        role: 'project_manager',
        department: 'Management',
        companyId: company.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'designer@autosolutions.com',
        username: 'designer',
        password: await hashPassword('password123'),
        firstName: 'Sarah',
        lastName: 'Designer',
        role: 'mechanical_designer',
        department: 'Engineering',
        companyId: company.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'engineer@autosolutions.com',
        username: 'engineer',
        password: await hashPassword('password123'),
        firstName: 'Mike',
        lastName: 'Engineer',
        role: 'simulation_engineer',
        department: 'Engineering',
        companyId: company.id
      }
    })
  ]);

  console.log('✅ Created users:', users.length);

  // Create sample projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Electric Vehicle Assembly Line',
        description: 'Design and implementation of automated assembly line for electric vehicles',
        status: 'active',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        budget: 2500000,
        priority: 'high',
        progress: 35,
        companyId: company.id,
        createdById: users[0].id
      }
    }),
    prisma.project.create({
      data: {
        name: 'Battery Pack Manufacturing System',
        description: 'Automated manufacturing system for battery pack assembly',
        status: 'active',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-11-30'),
        budget: 1800000,
        priority: 'medium',
        progress: 20,
        companyId: company.id,
        createdById: users[0].id
      }
    }),
    prisma.project.create({
      data: {
        name: 'Quality Control Automation',
        description: 'Implementation of automated quality control systems',
        status: 'planning',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-02-28'),
        budget: 1200000,
        priority: 'medium',
        progress: 5,
        companyId: company.id,
        createdById: users[0].id
      }
    })
  ]);

  console.log('✅ Created projects:', projects.length);

  // Create sample work units
  const workUnits = await Promise.all([
    prisma.workUnit.create({
      data: {
        name: 'Assembly Line Design',
        description: 'Design the main assembly line layout and workflow',
        workUnitType: 'design',
        roleType: 'mechanical_designer',
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 120,
        actualHours: 80,
        progress: 65,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-04-15'),
        projectId: projects[0].id,
        assignedToId: users[1].id,
        createdById: users[0].id
      }
    }),
    prisma.workUnit.create({
      data: {
        name: 'Simulation Analysis',
        description: 'Run simulation analysis for assembly line performance',
        workUnitType: 'simulation',
        roleType: 'simulation_engineer',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 80,
        actualHours: 0,
        progress: 0,
        startDate: new Date('2024-04-20'),
        endDate: new Date('2024-06-15'),
        projectId: projects[0].id,
        assignedToId: users[2].id,
        createdById: users[0].id
      }
    }),
    prisma.workUnit.create({
      data: {
        name: 'Manufacturing Process Design',
        description: 'Design manufacturing processes for battery pack assembly',
        workUnitType: 'manufacturing',
        roleType: 'manufacturing_engineer',
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 100,
        actualHours: 45,
        progress: 45,
        startDate: new Date('2024-03-10'),
        endDate: new Date('2024-07-30'),
        projectId: projects[1].id,
        assignedToId: users[1].id,
        createdById: users[0].id
      }
    })
  ]);

  console.log('✅ Created work units:', workUnits.length);

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        name: 'Create 3D CAD Models',
        description: 'Create detailed 3D CAD models for assembly line components',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-04-10'),
        estimatedHours: 40,
        actualHours: 25,
        progress: 60,
        kanbanColumn: 'in_progress',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-10'),
        projectId: projects[0].id,
        workUnitId: workUnits[0].id,
        assignedToId: users[1].id,
        createdById: users[0].id
      }
    }),
    prisma.task.create({
      data: {
        name: 'Review Design Specifications',
        description: 'Review and approve design specifications for assembly line',
        status: 'review',
        priority: 'medium',
        dueDate: new Date('2024-04-15'),
        estimatedHours: 8,
        actualHours: 6,
        progress: 75,
        kanbanColumn: 'review',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-15'),
        projectId: projects[0].id,
        workUnitId: workUnits[0].id,
        assignedToId: users[0].id,
        createdById: users[1].id
      }
    }),
    prisma.task.create({
      data: {
        name: 'Setup Simulation Environment',
        description: 'Setup and configure simulation environment for analysis',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2024-04-25'),
        estimatedHours: 16,
        actualHours: 0,
        progress: 0,
        kanbanColumn: 'todo',
        startDate: new Date('2024-04-20'),
        endDate: new Date('2024-04-25'),
        projectId: projects[0].id,
        workUnitId: workUnits[1].id,
        assignedToId: users[2].id,
        createdById: users[0].id
      }
    }),
    prisma.task.create({
      data: {
        name: 'Process Flow Documentation',
        description: 'Document manufacturing process flow for battery assembly',
        status: 'completed',
        priority: 'low',
        dueDate: new Date('2024-03-30'),
        estimatedHours: 12,
        actualHours: 10,
        progress: 100,
        kanbanColumn: 'done',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-30'),
        projectId: projects[1].id,
        workUnitId: workUnits[2].id,
        assignedToId: users[1].id,
        createdById: users[0].id
      }
    })
  ]);

  console.log('✅ Created tasks:', tasks.length);

  // Create sample checkpoints
  const checkpoints = await Promise.all([
    prisma.checkpoint.create({
      data: {
        name: 'Design Review',
        description: 'Initial design review and approval',
        checkpointType: 'review',
        status: 'passed',
        requiredRole: 'project_manager',
        dueDate: new Date('2024-03-15'),
        completedDate: new Date('2024-03-14'),
        notes: 'Design approved with minor modifications',
        workUnitId: workUnits[0].id,
        assignedToId: users[0].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'CAD Model Validation',
        description: 'Validate 3D CAD models for manufacturability',
        checkpointType: 'validation',
        status: 'in_progress',
        requiredRole: 'manufacturing_engineer',
        dueDate: new Date('2024-04-20'),
        notes: 'In progress - checking manufacturability',
        workUnitId: workUnits[0].id,
        assignedToId: users[1].id
      }
    }),
    prisma.checkpoint.create({
      data: {
        name: 'Simulation Setup Review',
        description: 'Review simulation setup and parameters',
        checkpointType: 'quality_gate',
        status: 'pending',
        requiredRole: 'simulation_engineer',
        dueDate: new Date('2024-04-30'),
        workUnitId: workUnits[1].id,
        assignedToId: users[2].id
      }
    })
  ]);

  console.log('✅ Created checkpoints:', checkpoints.length);

  // Create sample process templates
  const processTemplates = await Promise.all([
    prisma.processTemplate.create({
      data: {
        name: 'Mechanical Design Process',
        description: 'Standard process for mechanical design work units',
        roleType: 'mechanical_designer',
        workUnitType: 'design',
        templateData: {
          checkpoints: [
            {
              name: 'Requirements Review',
              type: 'quality_gate',
              requiredRole: 'project_manager'
            },
            {
              name: 'CAD Modeling',
              type: 'review',
              requiredRole: 'senior_designer'
            },
            {
              name: 'Design Validation',
              type: 'validation',
              requiredRole: 'simulation_engineer'
            },
            {
              name: 'Manufacturing Review',
              type: 'review',
              requiredRole: 'manufacturing_engineer'
            },
            {
              name: 'Final Approval',
              type: 'approval',
              requiredRole: 'project_manager'
            }
          ]
        },
        companyId: company.id
      }
    }),
    prisma.processTemplate.create({
      data: {
        name: 'Simulation Analysis Process',
        description: 'Standard process for simulation work units',
        roleType: 'simulation_engineer',
        workUnitType: 'simulation',
        templateData: {
          checkpoints: [
            {
              name: 'Model Preparation',
              type: 'quality_gate',
              requiredRole: 'simulation_engineer'
            },
            {
              name: 'Mesh Generation',
              type: 'review',
              requiredRole: 'simulation_engineer'
            },
            {
              name: 'Boundary Conditions',
              type: 'validation',
              requiredRole: 'senior_engineer'
            },
            {
              name: 'Analysis Run',
              type: 'test',
              requiredRole: 'simulation_engineer'
            },
            {
              name: 'Results Validation',
              type: 'validation',
              requiredRole: 'senior_engineer'
            },
            {
              name: 'Report Generation',
              type: 'documentation',
              requiredRole: 'project_manager'
            }
          ]
        },
        companyId: company.id
      }
    })
  ]);

  console.log('✅ Created process templates:', processTemplates.length);

  // Create sample CAD software integrations
  const cadSoftware = await Promise.all([
    prisma.cADSoftware.create({
      data: {
        name: 'CATIA',
        version: 'V6',
        description: 'Dassault Systèmes CATIA - Advanced CAD/CAM/CAE software',
        isActive: true,
        apiEndpoint: 'https://catia-api.company.com',
        settings: {
          licenseServer: 'catia-license.company.com',
          defaultWorkspace: '/workspace/projects',
          autoSave: true
        },
        companyId: company.id
      }
    }),
    prisma.cADSoftware.create({
      data: {
        name: 'NX',
        version: '12.0',
        description: 'Siemens NX - Advanced CAD/CAM/CAE software',
        isActive: true,
        apiEndpoint: 'https://nx-api.company.com',
        settings: {
          licenseServer: 'nx-license.company.com',
          defaultWorkspace: '/nx/projects',
          autoSave: true
        },
        companyId: company.id
      }
    }),
    prisma.cADSoftware.create({
      data: {
        name: 'Fides',
        version: '2023',
        description: 'Fides - Specialized automotive design software',
        isActive: true,
        apiEndpoint: 'https://fides-api.company.com',
        settings: {
          licenseServer: 'fides-license.company.com',
          defaultWorkspace: '/fides/projects',
          autoSave: true
        },
        companyId: company.id
      }
    })
  ]);

  console.log('✅ Created CAD software:', cadSoftware.length);

  // Create extraction templates for CAD software
  const extractionTemplates = await Promise.all([
    prisma.cADExtractionTemplate.create({
      data: {
        name: 'CATIA BOM Extraction',
        description: 'Standard BOM extraction template for CATIA files',
        templateType: 'bom',
        isActive: true,
        templateConfig: {
          includeProperties: ['PartNumber', 'Material', 'Mass', 'Volume'],
          excludeComponents: ['Standard Parts', 'Fasteners'],
          hierarchyLevels: 3,
          includeMetadata: true
        },
        cadSoftwareId: cadSoftware[0].id
      }
    }),
    prisma.cADExtractionTemplate.create({
      data: {
        name: 'NX Assembly BOM',
        description: 'BOM extraction for NX assembly files',
        templateType: 'bom',
        isActive: true,
        templateConfig: {
          includeProperties: ['PartNumber', 'Material', 'Mass', 'Volume'],
          excludeComponents: ['Standard Parts'],
          hierarchyLevels: 5,
          includeMetadata: true
        },
        cadSoftwareId: cadSoftware[1].id
      }
    }),
    prisma.cADExtractionTemplate.create({
      data: {
        name: 'Fides Automotive BOM',
        description: 'Specialized BOM extraction for automotive components',
        templateType: 'bom',
        isActive: true,
        templateConfig: {
          includeProperties: ['PartNumber', 'Material', 'Mass', 'Volume', 'Manufacturer'],
          excludeComponents: ['Standard Parts', 'Fasteners', 'Hardware'],
          hierarchyLevels: 4,
          includeMetadata: true,
          automotiveSpecific: true
        },
        cadSoftwareId: cadSoftware[2].id
      }
    })
  ]);

  console.log('✅ Created extraction templates:', extractionTemplates.length);

  // Create sample BOMs
  const boms = await Promise.all([
    prisma.billOfMaterials.create({
      data: {
        name: 'Electric Vehicle Assembly Line BOM',
        description: 'Complete bill of materials for EV assembly line',
        bomType: 'assembly',
        version: '1.0',
        status: 'draft',
        extractedFrom: 'CATIA',
        extractionMethod: 'automatic',
        extractionDate: new Date(),
        extractionStatus: 'completed',
        bomData: {
          totalComponents: 1250,
          totalCost: 450000,
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        },
        projectId: projects[0].id
      }
    }),
    prisma.billOfMaterials.create({
      data: {
        name: 'Battery Pack Assembly BOM',
        description: 'Bill of materials for battery pack manufacturing',
        bomType: 'assembly',
        version: '1.0',
        status: 'review',
        extractedFrom: 'NX',
        extractionMethod: 'automatic',
        extractionDate: new Date(),
        extractionStatus: 'completed',
        bomData: {
          totalComponents: 850,
          totalCost: 320000,
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        },
        projectId: projects[1].id
      }
    })
  ]);

  console.log('✅ Created BOMs:', boms.length);

  // Create sample BOM components
  const bomComponents = await Promise.all([
    prisma.bOMComponent.create({
      data: {
        partNumber: 'EV-AL-001',
        name: 'Main Assembly Frame',
        description: 'Primary structural frame for assembly line',
        quantity: 1,
        unit: 'pcs',
        material: 'Steel A36',
        supplier: 'SteelCorp Industries',
        supplierPartNumber: 'SC-FRAME-001',
        cost: 15000,
        currency: 'USD',
        leadTime: 30,
        location: 'Warehouse A',
        status: 'active',
        cadPartNumber: 'CATIA-PART-001',
        cadMaterial: 'Steel A36',
        bomId: boms[0].id
      }
    }),
    prisma.bOMComponent.create({
      data: {
        partNumber: 'EV-AL-002',
        name: 'Conveyor System',
        description: 'Automated conveyor system for part transport',
        quantity: 4,
        unit: 'pcs',
        material: 'Aluminum 6061',
        supplier: 'ConveyTech Solutions',
        supplierPartNumber: 'CT-CONV-002',
        cost: 8500,
        currency: 'USD',
        leadTime: 45,
        location: 'Warehouse B',
        status: 'active',
        cadPartNumber: 'CATIA-PART-002',
        cadMaterial: 'Aluminum 6061',
        bomId: boms[0].id
      }
    }),
    prisma.bOMComponent.create({
      data: {
        partNumber: 'BP-ASM-001',
        name: 'Battery Cell Array',
        description: 'Main battery cell assembly',
        quantity: 1,
        unit: 'pcs',
        material: 'Lithium-Ion',
        supplier: 'BatteryTech Inc',
        supplierPartNumber: 'BT-CELL-001',
        cost: 45000,
        currency: 'USD',
        leadTime: 60,
        location: 'Warehouse C',
        status: 'active',
        cadPartNumber: 'NX-PART-001',
        cadMaterial: 'Lithium-Ion',
        bomId: boms[1].id
      }
    })
  ]);

  console.log('✅ Created BOM components:', bomComponents.length);

  // Create sample manufacturing instructions
  const manufacturingInstructions = await Promise.all([
    prisma.manufacturingInstruction.create({
      data: {
        name: 'EV Assembly Line Installation',
        description: 'Step-by-step instructions for installing the electric vehicle assembly line',
        instructionType: 'assembly',
        difficulty: 'hard',
        estimatedTime: 480, // 8 hours
        status: 'draft',
        instructionData: {
          totalSteps: 12,
          requiredTools: ['Crane', 'Torque Wrench', 'Alignment Tools'],
          safetyNotes: ['Use proper PPE', 'Follow lockout/tagout procedures'],
          attachments: []
        },
        projectId: projects[0].id,
        designFileId: null
      }
    }),
    prisma.manufacturingInstruction.create({
      data: {
        name: 'Battery Pack Assembly Process',
        description: 'Manufacturing instructions for battery pack assembly',
        instructionType: 'assembly',
        difficulty: 'expert',
        estimatedTime: 360, // 6 hours
        status: 'review',
        instructionData: {
          totalSteps: 8,
          requiredTools: ['Insulated Tools', 'Multimeter', 'Safety Equipment'],
          safetyNotes: ['Battery safety procedures', 'Use insulated tools'],
          attachments: []
        },
        projectId: projects[1].id,
        designFileId: null
      }
    })
  ]);

  console.log('✅ Created manufacturing instructions:', manufacturingInstructions.length);

  // Create sample manufacturing steps
  const manufacturingSteps = await Promise.all([
    prisma.manufacturingStep.create({
      data: {
        instructionId: manufacturingInstructions[0].id,
        stepNumber: 1,
        title: 'Prepare Foundation',
        description: 'Prepare and level the foundation for assembly line installation',
        instructions: '1. Clear the installation area\n2. Level the foundation\n3. Mark anchor points',
        estimatedTime: 60,
        requiredTools: ['Level', 'Measuring Tape', 'Marking Tools'],
        requiredMaterials: ['Concrete Anchors', 'Leveling Compound'],
        safetyNotes: 'Ensure proper ventilation and lighting',
        qualityChecks: ['Foundation level within 0.1 degrees', 'Anchor points marked correctly']
      }
    }),
    prisma.manufacturingStep.create({
      data: {
        instructionId: manufacturingInstructions[0].id,
        stepNumber: 2,
        title: 'Install Main Frame',
        description: 'Install the main structural frame of the assembly line',
        instructions: '1. Position main frame\n2. Align with foundation\n3. Secure with anchors',
        estimatedTime: 120,
        requiredTools: ['Crane', 'Torque Wrench', 'Alignment Tools'],
        requiredMaterials: ['Main Frame', 'Anchor Bolts'],
        safetyNotes: 'Use proper lifting equipment and procedures',
        qualityChecks: ['Frame aligned within specifications', 'All bolts torqued to specification']
      }
    }),
    prisma.manufacturingStep.create({
      data: {
        instructionId: manufacturingInstructions[1].id,
        stepNumber: 1,
        title: 'Prepare Battery Cells',
        description: 'Prepare and inspect battery cells for assembly',
        instructions: '1. Inspect battery cells\n2. Test cell voltage\n3. Sort by capacity',
        estimatedTime: 90,
        requiredTools: ['Multimeter', 'Testing Equipment'],
        requiredMaterials: ['Battery Cells', 'Testing Fixtures'],
        safetyNotes: 'Handle batteries with care, avoid short circuits',
        qualityChecks: ['All cells within voltage specification', 'No damaged cells']
      }
    })
  ]);

  console.log('✅ Created manufacturing steps:', manufacturingSteps.length);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample Data Summary:');
  console.log(`- Company: ${company.name}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Projects: ${projects.length}`);
  console.log(`- Work Units: ${workUnits.length}`);
  console.log(`- Tasks: ${tasks.length}`);
  console.log(`- Checkpoints: ${checkpoints.length}`);
  console.log(`- Process Templates: ${processTemplates.length}`);
  console.log(`- CAD Software: ${cadSoftware.length}`);
  console.log(`- Extraction Templates: ${extractionTemplates.length}`);
  console.log(`- BOMs: ${boms.length}`);
  console.log(`- BOM Components: ${bomComponents.length}`);
  console.log(`- Manufacturing Instructions: ${manufacturingInstructions.length}`);
  console.log(`- Manufacturing Steps: ${manufacturingSteps.length}`);
  
  console.log('\n🔑 Sample Login Credentials:');
  console.log('Admin: admin@autosolutions.com / password123');
  console.log('Designer: designer@autosolutions.com / password123');
  console.log('Engineer: engineer@autosolutions.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 