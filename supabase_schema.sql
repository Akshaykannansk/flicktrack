
-- Supabase schema for FlickTrack

-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Corresponds to Supabase Auth user_id
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    image_url TEXT,
    bio TEXT,
    social_links JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Films Table (assuming you have a way to populate this, e.g., from an external API like TMDB)
CREATE TABLE films (
    id BIGINT PRIMARY KEY, -- TMDB Film ID
    title TEXT NOT NULL,
    release_date DATE,
    poster_path TEXT,
    overview TEXT
);

-- Film Lists Table
CREATE TABLE film_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- List Items Table (linking films to lists)
CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES film_lists(id) ON DELETE CASCADE,
    film_id BIGINT REFERENCES films(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(list_id, film_id)
);

-- Journal Entries Table (for logging films)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    film_id BIGINT REFERENCES films(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL,
    rating DECIMAL(2, 1), -- e.g., 3.5
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Follows Table
CREATE TABLE follows (
    follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Watchlist Table
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    film_id BIGINT REFERENCES films(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, film_id)
);

-- Liked Films Table
CREATE TABLE liked_films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    film_id BIGINT REFERENCES films(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, film_id)
);

-- Liked Lists Table
CREATE TABLE liked_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES film_lists(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, list_id)
);

-- Review Likes Table (for liking journal entry reviews)
CREATE TABLE review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, journal_entry_id)
);

-- Comments Table (for journal entries)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorite Films Table (Top 4)
CREATE TABLE favorite_films (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    film_id BIGINT REFERENCES films(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, film_id)
);

CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- RLS Policies
-- Allow public read access for most tables, but restrict modifications.

-- Users Table
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);

-- Films Table
CREATE POLICY "Enable read access for all users" ON public.films FOR SELECT USING (true);
CREATE POLICY "Allow admin insert" ON public.films FOR INSERT WITH CHECK (false); -- Assuming seeding is done by an admin role

-- Film Lists Table
CREATE POLICY "Enable read access for all users" ON public.film_lists FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.film_lists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for list owners" ON public.film_lists FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for list owners" ON public.film_lists FOR DELETE USING (auth.uid()::text = user_id);

-- Journal Entries Table
CREATE POLICY "Enable read access for all users" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Enable update for entry owners" ON public.journal_entries FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for entry owners" ON public.journal_entries FOR DELETE USING (auth.uid()::text = user_id);

-- All other tables (likes, comments, etc.)
CREATE POLICY "Enable all access for authenticated users" ON public.follows FOR ALL USING (auth.uid()::text = follower_id);
CREATE POLICY "Enable read access for all users" ON public.watchlist_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.watchlist_items FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for owners" ON public.watchlist_items FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable read access for all users" ON public.liked_films FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.liked_films FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for likers" ON public.liked_films FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable read access for all users" ON public.liked_lists FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.liked_lists FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for likers" ON public.liked_lists FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable read access for all users" ON public.review_likes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.review_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for likers" ON public.review_likes FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable read access for all users" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for comment owners" ON public.comments FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable read access for all users" ON public.favorite_films FOR SELECT USING (true);
CREATE POLICY "Enable all for owners" ON public.favorite_films FOR ALL USING (auth.uid()::text = user_id);

-- App Settings Table
CREATE POLICY "Enable read access for all users" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');
