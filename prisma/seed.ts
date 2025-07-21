import { PrismaClient } from '@prisma/client';
import { films as staticFilms } from '../src/lib/static-data';

const prisma = new PrismaClient();

const USER_ID = 'user_2jvcJkLgQf9Qz3gYtH8rXz9Ew1B'; // Dummy user ID

async function main() {
  console.log('Start seeding...');

  const userCount = await prisma.user.count();
  // Only seed if there are no users
  if (userCount > 0) {
    console.log('Database has already been seeded. Skipping.');
    return;
  }

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      id: USER_ID,
      email: 'alex.doe@example.com',
      name: 'Alex Doe',
    },
  });
  console.log(`Created user: ${user.name}`);

  // Create films in the database
  const filmCreatePromises = staticFilms.map(film => {
    return prisma.film.upsert({
      where: { id: parseInt(film.id, 10) || Math.floor(Math.random() * 100000) },
      update: {},
      create: {
        id: parseInt(film.id, 10) || Math.floor(Math.random() * 100000),
        title: film.title,
        overview: film.plot,
        posterPath: film.posterUrl.includes('placehold.co') ? null : film.posterUrl.split('/').pop(),
        releaseDate: film.releaseDate,
        voteAverage: film.averageRating * 2,
      },
    });
  });
  await Promise.all(filmCreatePromises);
  console.log(`Upserted ${staticFilms.length} films.`);

  // Create Journal Entries
  const journalEntries = [
    { filmId: 680, rating: 5, review: "An absolute masterpiece. The non-linear storytelling is brilliant and every scene is iconic.", loggedDate: new Date("2023-10-26") },
    { filmId: 155, rating: 4.5, review: "Heath Ledger's performance as the Joker is legendary. A gripping and intelligent superhero film.", loggedDate: new Date("2023-10-22") },
    { filmId: 238, rating: 5, review: "The greatest mob movie ever made. Al Pacino's transformation is incredible to watch.", loggedDate: new Date("2023-09-15") },
  ];

  for (const entry of journalEntries) {
    await prisma.journalEntry.create({
      data: { ...entry, userId: user.id },
    });
  }
  console.log(`Created ${journalEntries.length} journal entries.`);

  // Create Watchlist
  const watchlistItems = [
      { filmId: 27205 }, // Inception
      { filmId: 157336 }, // Interstellar
      { filmId: 335984 }, // Blade Runner 2049
      { filmId: 324857 }, // Spider-Man: Into the Spider-Verse
  ];

  for (const item of watchlistItems) {
      await prisma.watchlistItem.create({
          data: { ...item, userId: user.id }
      })
  }
  console.log(`Created ${watchlistItems.length} watchlist items.`);


  // Create Lists
  const list1 = await prisma.filmList.create({
    data: {
      name: 'Mind-Bending Movies',
      description: 'Films that will make you question reality.',
      userId: user.id,
    },
  });

  const list2 = await prisma.filmList.create({
    data: {
      name: 'Modern Sci-Fi Essentials',
      description: 'Must-see science fiction from the 21st century.',
      userId: user.id,
    },
  });

  // Add films to lists
  await prisma.filmOnList.createMany({
    data: [
      { listId: list1.id, filmId: 27205 }, // Inception
      { listId: list1.id, filmId: 338952 }, // Arrival
      { listId: list1.id, filmId: 539961 }, // Everything Everywhere All at Once

      { listId: list2.id, filmId: 157336 }, // Interstellar
      { listId: list2.id, filmId: 335984 }, // Blade Runner 2049
      { listId: list2.id, filmId: 338952 }, // Arrival
      { listId: list2.id, filmId: 27205 }, // Inception
    ],
    skipDuplicates: true,
  });
  console.log('Added films to lists.');


  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
