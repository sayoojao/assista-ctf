FROM node:18-slim

WORKDIR /app

# Copy backend package.json and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ ./

# Expose the port
ENV PORT=5001
EXPOSE 5001

CMD ["node", "index.js"]

