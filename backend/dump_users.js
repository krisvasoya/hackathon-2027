const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- ALL USERS IN DB ---');
  for (const u of users) {
    console.log(`Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, HasPassword: ${!!u.passwordHash}`);
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
