
import { createClient } from '@supabase/supabase-js'
import { films as staticFilms } from '../src/lib/static-data';
import { clerkClient } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or a service role key is not provided')
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFilms() {
  console.log('Seeding films...');
  
  const filmsToInsert = staticFilms.map(film => ({
    id: parseInt(film.id, 10),
    title: film.title,
    overview: film.plot,
    poster_path: film.posterUrl,
    release_date: film.releaseDate,
    vote_average: film.averageRating * 2,
  }));

  const { data, error } = await supabase.from('films').upsert(filmsToInsert, { onConflict: 'id' });

  if (error) {
    console.error('Error seeding films:', error.message);
  } else {
    console.log(`Upserted ${data?.length || 0} films.`);
  }
}

async function seedUsers() {
    console.log('Seeding users...');
    const users = await clerkClient.users.getUserList({ limit: 10 });

    for (const user of users) {
        const { data, error } = await supabase.from('users').upsert({
            id: user.id,
            email: user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress,
            name: user.fullName,
            username: user.username,
            image_url: user.imageUrl,
            bio: "A film enthusiast exploring the world of cinema."
        }, { onConflict: 'id' });

        if (error) {
            console.error(`Error upserting user ${user.id}:`, error.message);
        } else {
            console.log(`Upserted user: ${user.fullName} (${user.id})`);
        }
    }
}

async function seedJournalEntries() {
  console.log('Seeding journal entries...');
  const { data: users, error: userError } = await supabase.from('users').select('id');
  const { data: films, error: filmError } = await supabase.from('films').select('id');
  
  if (userError || filmError || !users || !films || users.length === 0 || films.length === 0) {
    console.error('Cannot seed journal entries without users and films.');
    return;
  }
  
  const journalEntries = users.flatMap(user => 
    films.slice(0, 5).map(film => ({
      user_id: user.id,
      film_id: film.id,
      rating: (Math.random() * 4 + 1).toFixed(1),
      review: "This was a truly captivating film. The cinematography was breathtaking and the performances were top-notch. Highly recommended!",
      logged_date: new Date(Date.now() - Math.random() * 1e10).toISOString(),
    }))
  );

  const { data, error } = await supabase.from('journal_entries').insert(journalEntries);
  if (error) {
    console.error('Error seeding journal entries:', error.message);
  } else {
    console.log(`Seeded ${journalEntries.length} journal entries.`);
  }
}

async function main() {
  console.log('Starting database seed...');
  await seedFilms();
  await seedUsers();
  await seedJournalEntries();
  console.log('Database seed complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
