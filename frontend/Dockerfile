# STAGE 1: Build the React Application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Use npm install instead of npm ci to avoid lockfile sync issues in CI
# --legacy-peer-deps helps avoid peer dependency conflicts generic to React apps
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Pass API URL as build argument and environment variable
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build the Vite application for production
RUN npm run build

# STAGE 2: Serve with Nginx (Optimized for Production)
FROM nginx:1.27-alpine

# Copy custom Nginx configuration if present (uncomment if needed)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
