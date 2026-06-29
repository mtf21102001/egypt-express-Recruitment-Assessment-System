const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@express.com';
  const password = 'adminPassword123!';
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`Admin user ${email} already exists!`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Successfully created initial Admin account:');
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
