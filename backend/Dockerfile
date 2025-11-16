# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your backend code
COPY . .

# Expose the backend port (usually 3000)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
