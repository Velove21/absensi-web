# ==========================================
# Tahap 1: Composer (PHP Dependencies)
# ==========================================
FROM composer:2 AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts

# ==========================================
# Tahap 2: Build Frontend Assets
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Declare build-time arguments (Coolify will pass these)
ARG APP_ENV=production
ARG APP_KEY
ARG DB_CONNECTION=sqlite
ARG DB_DATABASE=/app/database/database.sqlite

# Export them as environment variables so the php artisan child process inherits them
ENV APP_ENV=$APP_ENV
ENV APP_KEY=$APP_KEY
ENV DB_CONNECTION=$DB_CONNECTION
ENV DB_DATABASE=$DB_DATABASE

# Install PHP & essential dependencies (including session, pdo, sqlite, fileinfo) so 'php artisan' can boot
RUN apk add --no-cache php84 php84-common php84-cli php84-mbstring php84-xml php84-openssl php84-json php84-phar php84-curl php84-dom php84-tokenizer php84-xmlwriter php84-simplexml \
    php84-session php84-pdo php84-pdo_sqlite php84-sqlite3 php84-fileinfo \
    && ln -sf /usr/bin/php84 /usr/bin/php

COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# Salin folder vendor dari Tahap 1 agar bootstrap Laravel jalan saat build
COPY --from=composer-builder /app/vendor ./vendor
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# ==========================================
# Tahap 3: Aplikasi Produksi (Nginx + PHP)
# ==========================================
FROM serversideup/php:8.4-fpm-nginx
WORKDIR /var/www/html

# Salin seluruh kode aplikasi
COPY --chown=www-data:www-data . .

# Salin vendor hasil install Composer (produksi)
COPY --chown=www-data:www-data --from=composer-builder /app/vendor ./vendor

# Salin hasil kompilasi frontend
COPY --chown=www-data:www-data --from=frontend-builder /app/public/build ./public/build

# Optimalisasi permission untuk storage & cache Laravel
RUN chmod -R 775 storage bootstrap/cache
