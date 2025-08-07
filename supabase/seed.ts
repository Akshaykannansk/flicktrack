
import { PrismaClient } from '@prisma/client'
import { films as staticFilms } from '../src/lib/static-data';

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

async function main() {
  console.log('Starting database seed...');
  await seedFilms();
  console.log('Database seed complete. Users and other data will be created via the application.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
