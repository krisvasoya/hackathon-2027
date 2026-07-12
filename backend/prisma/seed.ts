import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding TransitOps database...');

  const saltRounds = 12;
  const defaultPassword = await bcrypt.hash('TransitOps@2024!', saltRounds);

  // ─── Super Admin ───────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0001',
      email: 'admin@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      department: 'IT Administration',
      phone: '+1-555-0100',
      passwordChangedAt: new Date(),
    },
  });

  // ─── Fleet Manager ─────────────────────────────────────────────────────────
  const fleetManager = await prisma.user.upsert({
    where: { email: 'fleet.manager@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0002',
      email: 'fleet.manager@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'James',
      lastName: 'Mitchell',
      role: UserRole.FLEET_MANAGER,
      status: UserStatus.ACTIVE,
      department: 'Fleet Operations',
      phone: '+1-555-0101',
      passwordChangedAt: new Date(),
    },
  });

  // ─── Safety Officer ────────────────────────────────────────────────────────
  const safetyOfficer = await prisma.user.upsert({
    where: { email: 'safety.officer@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0003',
      email: 'safety.officer@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: UserRole.SAFETY_OFFICER,
      status: UserStatus.ACTIVE,
      department: 'Safety & Compliance',
      phone: '+1-555-0102',
      passwordChangedAt: new Date(),
    },
  });

  // ─── Financial Analyst ─────────────────────────────────────────────────────
  const financialAnalyst = await prisma.user.upsert({
    where: { email: 'finance@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0004',
      email: 'finance@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'Robert',
      lastName: 'Park',
      role: UserRole.FINANCIAL_ANALYST,
      status: UserStatus.ACTIVE,
      department: 'Finance',
      phone: '+1-555-0103',
      passwordChangedAt: new Date(),
    },
  });

  console.log('✅ Seed complete.');
  console.log(`   Super Admin:        ${superAdmin.email}`);
  console.log(`   Fleet Manager:      ${fleetManager.email}`);
  console.log(`   Safety Officer:     ${safetyOfficer.email}`);
  console.log(`   Financial Analyst:  ${financialAnalyst.email}`);
  console.log('   Default Password:   TransitOps@2024!');
  console.log('   ⚠️  Change all passwords immediately after first login.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
