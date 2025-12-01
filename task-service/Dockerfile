# Use official Node.js LTS image
FROM node:24-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port used by the app
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
