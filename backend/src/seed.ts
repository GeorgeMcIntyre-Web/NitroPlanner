import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo users
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@nitroplanner.com' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@nitroplanner.com',
      passwordHash: 'demo123', // In production, use a hashed password!
      role: 'PROJECT_MANAGER',
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { name: 'Sample Project' },
    update: {},
    create: {
      name: 'Sample Project',
      description: 'A demo project for NitroPlanner',
      status: 'active',
      priority: 'medium',
      createdBy: demoUser.id,
    },
  });

  console.log('Seeded demo user and project:', { demoUser, project });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 