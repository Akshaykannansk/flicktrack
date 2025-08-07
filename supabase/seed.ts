
import { PrismaClient } from '@prisma/client'
import { films as staticFilms } from '../src/lib/static-data';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

async function seedFilms() {
  console.log('Seeding films...');
  
  for (const film of staticFilms) {
    await prisma.film.upsert({
        where: { id: parseInt(film.id, 10) },
        update: {},
        create: {
            id: parseInt(film.id, 10),
            title: film.title,
            overview: film.plot,
            poster_path: film.posterUrl,
            release_date: new Date(film.releaseDate),
            vote_average: film.averageRating * 2,
        }
    });
  }
  console.log(`Upserted ${staticFilms.length} films.`);
}

async function seedUsers() {
    console.log('Seeding users...');
    const users = await clerkClient.users.getUserList({ limit: 10 });

    for (const user of users) {
        const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
        if (!primaryEmail) {
            console.warn(`Skipping user ${user.id} due to missing primary email.`);
            continue;
        }

        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: primaryEmail,
                name: user.fullName,
                username: user.username,
                imageUrl: user.imageUrl,
                bio: "A film enthusiast exploring the world of cinema."
            },
            create: {
                id: user.id,
                email: primaryEmail,
                name: user.fullName,
                username: user.username,
                imageUrl: user.imageUrl,
                bio: "A film enthusiast exploring the world of cinema."
            }
        });
        console.log(`Upserted user: ${user.fullName} (${user.id})`);
    }
}

async function seedJournalEntries() {
  console.log('Seeding journal entries...');
  const users = await prisma.user.findMany({ select: { id: true } });
  const films = await prisma.film.findMany({ select: { id: true } });
  
  if (users.length === 0 || films.length === 0) {
    console.error('Cannot seed journal entries without users and films.');
    return;
  }
  
  const journalEntries = users.flatMap(user => 
    films.slice(0, 5).map(film => ({
      userId: user.id,
      filmId: film.id,
      rating: parseFloat((Math.random() * 4 + 1).toFixed(1)),
      review: "This was a truly captivating film. The cinematography was breathtaking and the performances were top-notch. Highly recommended!",
      logged_date: new Date(Date.now() - Math.random() * 1e10),
    }))
  );

  await prisma.journalEntry.createMany({
      data: journalEntries,
      skipDuplicates: true,
  });

  console.log(`Seeded ${journalEntries.length} journal entries.`);
}

async function main() {
  console.log('Starting database seed...');
  await seedFilms();
  await seedUsers();
  await seedJournalEntries();
  console.log('Database seed complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
