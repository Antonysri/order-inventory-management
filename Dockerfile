# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production PHP 8.3-FPM + Nginx Runtime
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    curl \
    libzip-dev \
    libpng-dev \
    oniguruma-dev \
    supervisor \
    ca-certificates \
    && update-ca-certificates \
    && docker-php-ext-install pdo_mysql bcmath opcache

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Laravel Backend
COPY backend/composer*.json ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY backend/ ./
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Copy Frontend Build from Stage 1
COPY --from=frontend-builder /app/frontend/dist /var/www/frontend

# Copy Nginx Configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Supervisord setup to run both Nginx and PHP-FPM
RUN mkdir -p /etc/supervisor/conf.d
RUN echo -e '[supervisord]\nnodaemon=true\nuser=root\n\n[program:php-fpm]\ncommand=php-fpm -F\nautostart=true\nautorestart=true\n\n[program:nginx]\ncommand=nginx -g "daemon off;"\nautostart=true\nautorestart=true' > /etc/supervisor/conf.d/supervisord.conf

# Entrypoint to automate database migrations on boot
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
