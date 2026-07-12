const { PrismaClient } = require('@prisma/client');

const passwords = [
  'postgres', 'postgres123', 'postgres@123', 'postgres@2024', 'postgres@2025', 'postgres@2026', 'postgres@2027',
  'krish', 'krishvasoya', 'krishvasoya123', 'krish@123', 'vasoya@123',
  'TransitOps', 'TransitOps@2024!', 'TransitOps@2026', 'TransitOps@2027',
  'password', 'password123', 'password@123', 'Password', 'Password123', 'Password@123',
  'admin', 'admin123', 'admin@123', 'root', 'root123', 'root@123',
  '1234', '12345', '123456', '12345678', '123456789', '1234567890',
  'your_password', 'my_password', ''
];

async function test() {
  for (const pw of passwords) {
    const url = `postgresql://postgres:${encodeURIComponent(pw)}@127.0.0.1:5432/postgres`;
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url
        }
      }
    });

    try {
      await prisma.$connect();
      console.log(`\n🎉 SUCCESS! Password is: "${pw}"`);
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      // If the error is P1003 (Database not found), it means authentication SUCCEEDED but database doesn't exist!
      // If the error is P1000, authentication failed.
      const code = err.code || '';
      const msg = err.message || '';
      if (code === 'P1003' || msg.includes('does not exist')) {
        console.log(`\n🎉 SUCCESS! Password is: "${pw}" (Database "transitops_dev" does not exist yet)`);
        await prisma.$disconnect();
        process.exit(0);
      }
      process.stdout.write(`Failed: ${pw} (${code || 'Unknown'}) - ${err.message || err}\n`);
    } finally {
      try {
        await prisma.$disconnect();
      } catch (e) {}
    }
  }
  console.log('\n❌ None of the passwords matched.');
  process.exit(1);
}

test();
