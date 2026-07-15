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

# Install PHP & dependensi esensial agar 'php artisan' bisa berjalan
RUN apk add --no-cache php84 php84-common php84-cli php84-mbstring php84-xml php84-openssl php84-json php84-phar php84-curl php84-dom php84-tokenizer php84-xmlwriter php84-simplexml \
    && ln -sf /usr/bin/php84 /usr/bin/php

COPY package.json package-lock.json* pnpm-lock.yaml* ./
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
