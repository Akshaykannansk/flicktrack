
-- USERS Table
-- Stores public user information.
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT NOT NULL PRIMARY KEY,
    email TEXT,
    name TEXT,
    username TEXT,
    image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- FILMS Table
-- Stores basic film information.
CREATE TABLE IF NOT EXISTS public.films (
    id BIGINT NOT NULL PRIMARY KEY,
    title TEXT,
    overview TEXT,
    poster_path TEXT,
    release_date DATE,
    vote_average REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;

-- FOLLOWS Table
-- Tracks user follow relationships.
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- JOURNAL ENTRIES Table
-- Stores user film logs, ratings, and reviews.
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    film_id BIGINT NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
    rating REAL,
    review TEXT,
    logged_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- WATCHLIST ITEMS Table
-- Stores films a user wants to watch.
CREATE TABLE IF NOT EXISTS public.watchlist_items (
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    film_id BIGINT NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, film_id)
);
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- LIKED FILMS Table
-- Stores films a user has liked.
CREATE TABLE IF NOT EXISTS public.liked_films (
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    film_id BIGINT NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, film_id)
);
ALTER TABLE public.liked_films ENABLE ROW LEVEL SECURITY;

-- FILM LISTS Table
-- Stores user-created film lists.
CREATE TABLE IF NOT EXISTS public.film_lists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.film_lists ENABLE ROW LEVEL SECURITY;

-- FILMS ON LISTS Table
-- Junction table for films and lists.
CREATE TABLE IF NOT EXISTS public.films_on_lists (
    list_id UUID NOT NULL REFERENCES public.film_lists(id) ON DELETE CASCADE,
    film_id BIGINT NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (list_id, film_id)
);
ALTER TABLE public.films_on_lists ENABLE ROW LEVEL SECURITY;

-- LIKED LISTS Table
-- Tracks user likes for film lists.
CREATE TABLE IF NOT EXISTS public.liked_lists (
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES public.film_lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, list_id)
);
ALTER TABLE public.liked_lists ENABLE ROW LEVEL SECURITY;

-- REVIEW LIKES Table
-- Tracks likes on specific journal entry reviews.
CREATE TABLE IF NOT EXISTS public.review_likes (
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, journal_entry_id)
);
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

-- COMMENTS Table
-- Stores comments on journal entries.
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- FAVORITE FILMS Table
-- Stores a user's top 4 favorite films.
CREATE TABLE IF NOT EXISTS public.favorite_films (
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    film_id BIGINT NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, film_id)
);
ALTER TABLE public.favorite_films ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Enable delete for watchlist owners" ON public.watchlist_items FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable read access for all users" ON public.liked_films FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.liked_films FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Enable delete for likers" ON public.liked_films FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Enable read access for all users" ON public.films_on_lists FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.films_on_lists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
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

-- Create a view to get film lists with film posters and counts
CREATE OR REPLACE VIEW public.film_lists_with_details AS
SELECT
    fl.id,
    fl.user_id,
    fl.name,
    fl.description,
    fl.created_at,
    (SELECT count(*) FROM public.films_on_lists fol WHERE fol.list_id = fl.id) as film_count,
    (SELECT json_agg(json_build_object('id', f.id, 'poster_path', f.poster_path))
     FROM (
         SELECT f_inner.*
         FROM public.films_on_lists fol_inner
         JOIN public.films f_inner ON f_inner.id = fol_inner.film_id
         WHERE fol_inner.list_id = fl.id
         ORDER BY fol_inner.added_at DESC
         LIMIT 4
     ) f
    ) as films
FROM
    public.film_lists fl;

-- Create a view to get journal entries with like and comment counts
CREATE OR REPLACE VIEW public.journal_entries_with_counts AS
SELECT
    je.*,
    f.id as film_id,
    f.title as film_title,
    f.poster_path as film_poster_path,
    u.id as user_id,
    u.name as user_name,
    u.username as user_username,
    u.image_url as user_image_url,
    (SELECT count(*) FROM public.review_likes rl WHERE rl.journal_entry_id = je.id) as like_count,
    (SELECT count(*) FROM public.comments c WHERE c.journal_entry_id = je.id) as comment_count
FROM
    public.journal_entries je
JOIN public.films f ON f.id = je.film_id
JOIN public.users u ON u.id = je.user_id;


-- Function to copy a film list
CREATE OR REPLACE FUNCTION public.copy_film_list(
    original_list_id UUID,
    new_owner_id TEXT,
    new_list_name TEXT,
    new_list_description TEXT
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, user_id TEXT) AS $$
DECLARE
    new_list_id UUID;
BEGIN
    -- Create the new list
    INSERT INTO public.film_lists (user_id, name, description)
    VALUES (new_owner_id, new_list_name, new_list_description)
    RETURNING public.film_lists.id INTO new_list_id;

    -- Copy films from the original list to the new one
    INSERT INTO public.films_on_lists (list_id, film_id)
    SELECT new_list_id, fol.film_id
    FROM public.films_on_lists fol
    WHERE fol.list_id = original_list_id;

    -- Return the new list details
    RETURN QUERY
    SELECT fl.id, fl.name, fl.description, fl.user_id
    FROM public.film_lists fl
    WHERE fl.id = new_list_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user feed
CREATE OR REPLACE FUNCTION public.get_feed_for_user(
    p_user_id TEXT,
    p_following_ids TEXT[]
)
RETURNS TABLE (
    id UUID,
    rating REAL,
    review TEXT,
    logged_date TIMESTAMPTZ,
    film JSONB,
    "user" JSONB,
    liked_by_user JSONB,
    review_likes_count BIGINT,
    comments_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.id,
        je.rating,
        je.review,
        je.logged_date,
        jsonb_build_object(
            'id', f.id,
            'title', f.title,
            'poster_path', f.poster_path,
            'release_date', f.release_date
        ) AS film,
        jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'username', u.username,
            'imageUrl', u.image_url
        ) AS "user",
        (SELECT jsonb_agg(rl.user_id) FROM public.review_likes rl WHERE rl.journal_entry_id = je.id AND rl.user_id = p_user_id) as liked_by_user,
        (SELECT count(*) FROM public.review_likes rl WHERE rl.journal_entry_id = je.id) as review_likes_count,
        (SELECT count(*) FROM public.comments c WHERE c.journal_entry_id = je.id) as comments_count
    FROM
        public.journal_entries je
    JOIN
        public.films f ON je.film_id = f.id
    JOIN
        public.users u ON je.user_id = u.id
    WHERE
        je.user_id = ANY(p_following_ids)
    ORDER BY
        je.logged_date DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending reviews
CREATE OR REPLACE FUNCTION public.get_trending_reviews(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    rating REAL,
    review TEXT,
    created_at TIMESTAMPTZ,
    film JSONB,
    "user" JSONB,
    liked_by_user JSONB,
    review_likes_count BIGINT,
    comments_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.id,
        je.rating,
        je.review,
        je.created_at,
        jsonb_build_object(
            'id', f.id,
            'title', f.title,
            'poster_path', f.poster_path,
            'release_date', f.release_date
        ) AS film,
        jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'username', u.username,
            'imageUrl', u.image_url
        ) AS "user",
        (SELECT jsonb_agg(rl.user_id) FROM public.review_likes rl WHERE rl.journal_entry_id = je.id AND rl.user_id = p_user_id) as liked_by_user,
        (SELECT count(*) FROM public.review_likes rl WHERE rl.journal_entry_id = je.id) as review_likes_count,
        (SELECT count(*) FROM public.comments c WHERE c.journal_entry_id = je.id) as comments_count
    FROM
        public.journal_entries je
    JOIN
        public.films f ON je.film_id = f.id
    JOIN
        public.users u ON je.user_id = u.id
    WHERE
        je.review IS NOT NULL AND je.review != ''
    ORDER BY
        je.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
