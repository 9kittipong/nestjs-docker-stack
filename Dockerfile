# Use Node.js version 20 (LTS)
FROM node:20-alpine

# Create app directory inside the container
WORKDIR /usr/src/app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build the Nest.js app
RUN npm run build

# Open port 3000
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
