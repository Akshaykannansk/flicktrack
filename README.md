# FlickTrack - Your Personal Film Journal

This is a Next.js application for tracking films you've watched, creating lists, and getting AI-powered recommendations.

## Running Locally with Docker

To run this application on your local machine, you'll need [Docker](https://www.docker.com/products/docker-desktop/) installed.

### 1. Set up Supabase

This project uses Supabase for its database.

1.  Go to [supabase.com](https://supabase.com), sign in, and create a new project.
2.  Once your project is created, navigate to the **SQL Editor** in the sidebar.
3.  Click on "+ New query".
4.  Copy the entire content of the `supabase_schema.sql` file from the root of this project and paste it into the query editor.
5.  Click "Run" to create all the necessary database tables.
6.  Next, go to **Project Settings > API**.
7.  Find your **Project URL** and the **Service Role Key**. You will need these for the next step.

### 2. Create an Environment File

The application requires API keys and other secrets to be stored in a local environment file.

Create a file named `.env` in the root of the project and add the following content. You will need to get your own keys from the respective services.

```env
# Get from https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key

# Get from https://dashboard.clerk.com -> Your Application -> API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Get from your Supabase project settings (Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Configure Clerk (Important for Social Login & Bio)

To allow users to update their bio and connect social media accounts, you need to configure custom fields and OAuth providers in your Clerk Dashboard.

*   **Bio Field**:
    1.  Go to your Clerk Dashboard.
    2.  Navigate to **Users > User & Organization Settings**.
    3.  Under "Custom user attributes", add a new attribute.
    4.  Set the **Name** to `bio`.
    5.  Set the **Type** to `Text`.
    6.  Make sure it is a **Public** attribute.
    This will automatically add a "Bio" field to the "Edit Profile" page for your users.

*   **Social Connections**:
    1.  In your Clerk Dashboard, go to **User & Authentication > Social Connections**.
    2.  Enable the providers you want to support (e.g., Google, GitHub). Follow the setup instructions for each.
    These will then appear as options on the user's "Edit Profile" page.

### 4. Start the Application

With Docker running, open your terminal and run the following command from the project root:

```bash
docker-compose up --build
```

This will build the Docker image for the application and start the service. The application will be available at [http://localhost:9002](http://localhost:9002).

### 5. Seed the Database (Optional)

After the application has started for the first time, you can seed the database with some sample data. Open a new terminal window and run:

```bash
docker-compose exec app npm run db:seed
```

This will populate the database with sample users, films, journal entries, and lists.

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
