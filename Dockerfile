# Use the official Node.js image as a base image
FROM node:20-slim AS base

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 9002

# Set the command to start the app
CMD ["npm", "start", "-p", "9002"]
