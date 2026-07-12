const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- PASSWORD VERIFICATION ---');
  for (const u of users) {
    const isPasswordValid = await bcrypt.compare('TransitOps@2024!', u.passwordHash);
    console.log(`Email: ${u.email}, Password Valid: ${isPasswordValid}`);
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
