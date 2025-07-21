# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Install openssl, which is a dependency for Prisma
RUN apt-get update && apt-get install -y openssl

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's code
COPY . .

# Generate Prisma Client
RUN npm run build

# Make port 9002 available to the world outside this container
EXPOSE 9002

# Define the command to run the app
CMD ["npm", "run", "start"]
