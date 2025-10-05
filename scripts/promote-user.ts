
// scripts/promote-user.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide a user email address.');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });

    console.log(`Successfully promoted ${user.name} (${user.email}) to admin.`);
  } catch (error) {
    console.error(`Error promoting user:`, error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
