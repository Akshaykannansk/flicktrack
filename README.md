
# FlickTrack - Your Personal Film Journal

This is a Next.js application for tracking films you've watched, creating lists, and getting AI-powered recommendations.

## Running Locally with Docker

To run this application on your local machine, you'll need [Docker](https://www.docker.com/products/docker-desktop/) installed.

### 1. Create an Environment File

The application requires API keys and other secrets to be stored in a local environment file.

Create a file named `.env` in the root of the project and add the following content. You will need to get your own keys from the respective services.

```env
# Get from https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key

# Get from https://dashboard.clerk.com -> Your Application -> API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 2. Start the Application

With Docker running, open your terminal and run the following command from the project root:

```bash
docker-compose up --build
```

This will build the Docker images for the application, database, and cache, and then start all the services. The application will be available at [http://localhost:9002](http://localhost:9002).

### 3. Seed the Database (Optional)

After the application has started for the first time, you can seed the database with some sample data. Open a new terminal window and run:

```bash
docker-compose exec app