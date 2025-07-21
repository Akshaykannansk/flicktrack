# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Install dependencies for Prisma and PostgreSQL client
RUN apt-get update && apt-get install -y procps openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Make the wait script executable
RUN chmod +x /app/wait-for-postgres.sh

# The Next.js app will be started by the command in docker-compose.yml
# But we can specify a default command here as a fallback.
CMD ["./wait-for-postgres.sh", "db", "npm", "run", "start"]

# Expose the port the app runs on
EXPOSE 9002
