# Use a specific Debian-based image that is known to be compatible with Prisma
FROM --platform=linux/amd64 node:20-bookworm-slim

# Set the working directory
WORKDIR /app

# Install dependencies needed for Prisma and psql
RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Make the wait script executable
RUN chmod +x /app/wait-for-postgres.sh

# Expose the port the app runs on
EXPOSE 9002

# The command will be specified in docker-compose.yml
CMD ["./wait-for-postgres.sh", "db", "npm", "run", "dev"]
