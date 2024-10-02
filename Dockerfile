# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app


# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Set environment variables (these should be overwritten using a Docker Compose file or when running the container)
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the app
CMD [ "node", "server.js" ]