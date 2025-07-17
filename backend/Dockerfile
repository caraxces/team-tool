# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies (including dev dependencies for build)
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Install netcat-openbsd for the wait-for-it script
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built application and other necessary assets from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/migrations ./migrations

# Copy the scripts
COPY ./scripts/ /usr/src/app/scripts/
RUN chmod +x /usr/src/app/scripts/wait-for-it.sh
RUN chmod +x /usr/src/app/scripts/entrypoint.sh

# Your app binds to port 3001
EXPOSE 3001

# Set the entrypoint
ENTRYPOINT ["/usr/src/app/scripts/entrypoint.sh"]

# Define the command to run your app
CMD [ "node", "dist/index.js" ] 