# Build
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# MUST run Tailwind build through Vite
RUN npm run build

# Serve step
FROM nginx:alpine

RUN mkdir -p /var/www/web-shell

COPY --from=builder /app/dist /var/www/web-shell
