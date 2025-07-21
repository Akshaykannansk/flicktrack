# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Install dependencies needed for Prisma and other native modules
RUN apt-get update && apt-get install -y openssl postgresql-client

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's code
COPY . .

# Copy the wait script and make it executable
COPY wait-for-postgres.sh ./
RUN chmod +x wait-for-postgres.sh

# Prisma generate
RUN npm run build

# Make port 9002 available to the world outside this container
EXPOSE 9002

# Define the command to run your app
CMD ["./wait-for-postgres.sh", "db", "npm", "run", "start"]
