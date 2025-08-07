# FlickTrack - Your Personal Film Journal

This is a Next.js application for tracking films you've watched, creating lists, and getting AI-powered recommendations.

## Running Locally with Docker

To run this application on your local machine, you'll need [Docker](https://www.docker.com/products/docker-desktop/) installed.

### 1. Set up Supabase & Prisma

This project uses a Supabase-hosted PostgreSQL database with the Prisma ORM for data storage and Supabase for authentication.

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com), sign in, and create a new project.

2.  **Create `.env` File**: Create a file named `.env` in the root of the project. You will need to get the following keys from your Supabase project dashboard:
    *   **Database Connection String**: Navigate to **Project Settings > Database**. Under "Connection string," find the **PostgreSQL connection string**. You must add `?pgbouncer=true&connection_limit=1` to the end of the connection string to use Prisma's connection pooling correctly.
    *   **Project URL & Anon Key**: Navigate to **Project Settings > API**. Find your Project URL and anon public key.
    *   **TMDB API Key**: You'll also need an API key from The Movie Database (TMDB). You can get one from [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
    *   **JWT Secret**: This is for securing the custom authentication sessions. You can generate a strong secret.

    Your `.env` file should look like this:

    ```env
    # Get from Supabase Project Settings > Database. Add `?pgbouncer=true&connection_limit=1` to the end.
    DATABASE_URL="your_supabase_connection_string"

    # Get from Supabase Project Settings > API
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key

    # Get from https://www.themoviedb.org/settings/api
    TMDB_API_KEY=your_tmdb_api_key
    
    # A long, random string for signing JWTs
    JWT_SECRET=your_super_secret_jwt_key
    ```

3.  **Sync Database Schema**: With your `.env` file configured, run the following command to sync the Prisma schema with your Supabase database. This will create all the necessary tables.

    ```bash
    npx prisma db push
    ```

### 2. Start the Application

With Docker running, open your terminal and run the following command from the project root:

```bash
docker-compose up --build
```

This will build the Docker image for the application and start the service. The application will be available at [http://localhost:9002](http://localhost:9002).

### 3. Seed the Database (Optional)

After the application has started for the first time, you can seed the database with some sample data. This is not fully supported with the new Supabase auth setup yet.

## Exposing Locally with Cloudflare Tunnel (Optional)

If you want to expose your local development server to the internet for webhooks or sharing, you can use Cloudflare Tunnel.

### 1. Install `cloudflared`

Follow the [official Cloudflare instructions](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/installation/) to install the `cloudflared` CLI tool on your machine.

### 2. Login to Cloudflare

Run the following command to authenticate `cloudflared` with your Cloudflare account.

```bash
cloudflared tunnel login
```

### 3. Create a Tunnel

Create a tunnel and give it a name. We'll use `flicktrack-dev`.

```bash
cloudflared tunnel create flicktrack-dev
```

This command will output a tunnel ID and create a credentials file in your `~/.cloudflared/` directory.

### 4. Get Your Tunnel Token

Now, you can get the token for your newly created tunnel.

```bash
cloudflared tunnel token flicktrack-dev
```

Copy the token that is displayed.

### 5. Add Token to Environment File

Open your `.env` file and add the tunnel token to it.

```env
# ... your other keys ...
TUNNEL_TOKEN=your_copied_tunnel_token
```

### 6. Start the Tunnel

In a new terminal window (while your main application from `docker-compose up` is still running), run the following command:

```bash
docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up
```

This will start the `cloudflared` container, which will connect to your `app` container and expose it to the internet through a secure tunnel. Check the terminal output for the public URL.
