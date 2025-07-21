# Use the official Node.js 20 image as a base.
FROM node:20-slim

# Install necessary packages for Prisma and PostgreSQL client.
# The 'openssl' package is explicitly installed to help Prisma detect the correct version.
RUN apt-get update && apt-get install -y procps openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container.
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache.
COPY package*.json ./

# Install project dependencies.
RUN npm install

# Copy the rest of the application code.
COPY . .

# Make the wait script executable.
RUN chmod +x ./wait-for-postgres.sh

# Expose the port the app will run on.
EXPOSE 9002

# The CMD instruction specifies the command to run when the container starts.
# It's overridden by the command in docker-compose.yml but is good practice to include.
CMD ["npm", "run", "dev"]

# The ENTRYPOINT is what is executed when the container starts.
# It runs our wait script first, and then executes the command (CMD) passed to it.
ENTRYPOINT ["./wait-for-postgres.sh", "db"]
