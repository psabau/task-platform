FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
RUN mkdir -p /var/www/web-admin
COPY --from=builder /app/dist /var/www/web-admin
