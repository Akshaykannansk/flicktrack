# Use a specific Node.js version for consistency
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Install necessary dependencies, including OpenSSL and PostgreSQL client
RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package.json ./
COPY package-lock.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Make the wait script executable
RUN chmod +x /app/wait-for-postgres.sh

# The command to run the application will be specified in docker-compose.yml
# This allows for different commands for development vs. production
CMD ["npm", "run", "dev"]
