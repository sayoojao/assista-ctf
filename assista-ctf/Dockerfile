# Stage 1: Build the frontend
FROM node:18-alpine AS build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Create the final image
FROM node:18-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --production
COPY backend/ .
COPY --from=build /app/frontend/dist ./public

USER node
EXPOSE 5000
CMD ["node", "index.js"]
