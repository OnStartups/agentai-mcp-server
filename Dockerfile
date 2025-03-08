FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
ENV NODE_ENV=production
RUN npm ci --ignore-scripts --omit=dev

# Copy application code
COPY index.js ./

# Make the JavaScript file executable
RUN chmod +x index.js

# Set up environment
ENV NODE_ENV=production

# Run the application
ENTRYPOINT ["node", "index.js"]