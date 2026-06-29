import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const prisma = new PrismaClient();

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
