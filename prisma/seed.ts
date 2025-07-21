import { PrismaClient } from '@prisma/client';
import { films as staticFilms } from '../src/lib/static-data';

const prisma = new PrismaClient();

const USER_ID = 'user_2jvcJkLgQf9Qz3gYtH8rXz9Ew1B';

async function main() {
  console.log('Start seeding...');

  const user = await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      email: 'alex.doe@example.com',
      name: 'Alex Doe',
    },
  });
  console.log(`Upserted user: ${user.name}`);

  // Create films in the database
  const filmCreatePromises = staticFilms.map(film => {
    const filmId = parseInt(film.id, 10);
    if (isNaN(filmId)) return Promise.resolve();

    return prisma.film.upsert({
      where: { id: filmId },
      update: {},
      create: {
        id: filmId,
        title: film.title,
        overview: film.plot,
        posterPath: film.posterUrl.includes('placehold.co') ? null : film.posterUrl,
        releaseDate: film.releaseDate,
        voteAverage: film.averageRating * 2,
      },
    });
  });
  await Promise.all(filmCreatePromises);
  console.log(`Upserted ${staticFilms.length} films.`);

  const journalEntries = [
    { filmId: 680, rating: 5, review: "An absolute masterpiece. The non-linear storytelling is brilliant and every scene is iconic.", loggedDate: new Date("2023-10-26") },
    { filmId: 155, rating: 4.5, review: "Heath Ledger's performance as the Joker is legendary. A gripping and intelligent superhero film.", loggedDate: new Date("2023-10-22") },
    { filmId: 238, rating: 5, review: "The greatest mob movie ever made. Al Pacino's transformation is incredible to watch.", loggedDate: new Date("2023-09-15") },
  ];

  for (const entry of journalEntries) {
    await prisma.journalEntry.upsert({
      where: { userId_filmId_loggedDate: { userId: user.id, filmId: entry.filmId, loggedDate: entry.loggedDate } },
      update: {},
      create: { ...entry, userId: user.id },
    });
  }
  console.log(`Upserted ${journalEntries.length} journal entries.`);


  const watchlistItems = [
      { filmId: 27205 }, // Inception
      { filmId: 157336 }, // Interstellar
      { filmId: 335984 }, // Blade Runner 2049
      { filmId: 324857 }, // Spider-Man: Into the Spider-Verse
  ];

  for (const item of watchlistItems) {
      await prisma.watchlistItem.upsert({
          where: { userId_filmId: { userId: user.id, filmId: item.filmId } },
          update: {},
          create: { ...item, userId: user.id }
      })
  }
  console.log(`Upserted ${watchlistItems.length} watchlist items.`);

  const list1 = await prisma.filmList.upsert({
    where: { id: 'clerk_list_1' },
    update: {},
    create: {
      id: 'clerk_list_1',
      name: 'Mind-Bending Movies',
      description: 'Films that will make you question reality.',
      userId: user.id,
    },
  });

  const list2 = await prisma.filmList.upsert({
     where: { id: 'clerk_list_2' },
    update: {},
    create: {
      id: 'clerk_list_2',
      name: 'Modern Sci-Fi Essentials',
      description: 'Must-see science fiction from the 21st century.',
      userId: user.id,
    },
  });

  const list1Films = [
    { listId: list1.id, filmId: 27205 }, // Inception
    { listId: list1.id, filmId: 338952 }, // Arrival
    { listId: list1.id, filmId: 539961 }, // Everything Everywhere All at Once
  ];
  
  const list2Films = [
    { listId: list2.id, filmId: 157336 }, // Interstellar
    { listId: list2.id, filmId: 335984 }, // Blade Runner 2049
    { listId: list2.id, filmId: 338952 }, // Arrival
    { listId: list2.id, filmId: 27205 }, // Inception
  ];

  for (const film of [...list1Films, ...list2Films]) {
      await prisma.filmOnList.upsert({
          where: { listId_filmId: { listId: film.listId, filmId: film.filmId } },
          update: {},
          create: film
      });
  }
  console.log('Upserted films to lists.');


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
