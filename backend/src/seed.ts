import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo company
  const demoCompany = await prisma.company.create({
    data: {
      name: 'Demo Company',
      subscriptionTier: 'basic',
    },
  });

  // Hash the password
  const hashedPassword = await bcrypt.hash('demo123', 10);

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@nitroplanner.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      username: 'demo',
      email: 'demo@nitroplanner.com',
      passwordHash: hashedPassword, // Now using a hashed password
      role: 'PROJECT_MANAGER',
      firstName: 'Demo',
      lastName: 'User',
      companyId: demoCompany.id,
    },
  });

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'Sample Project',
      description: 'A demo project for NitroPlanner',
      status: 'active',
      priority: 'medium',
      companyId: demoCompany.id,
      createdById: demoUser.id,
    },
  });

  console.log('Seeded demo user and project:', demoUser.email, project.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });