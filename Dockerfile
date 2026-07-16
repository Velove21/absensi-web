# ==========================================
# Tahap 1: Composer (PHP Dependencies)
# ==========================================
FROM composer:2 AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts

# ==========================================
# Tahap 2: Build Frontend Assets (Butuh Node + PHP untuk Wayfinder)
# ==========================================
FROM php:8.4-fpm-alpine AS frontend-builder
WORKDIR /app

# Pasang Node.js & npm di dalam image PHP standar (Bebas Error TLS Alpine)
RUN apk add --no-cache nodejs npm

# Salin manifest frontend
COPY package.json package-lock.json* ./
RUN npm install

# Salin seluruh kode aplikasi
COPY . .

# Salin folder vendor dari Tahap 1 agar 'php artisan' Wayfinder bisa booting saat build
COPY --from=composer-builder /app/vendor ./vendor

# Jalankan build frontend (Sekarang aman karena PHP sudah tersedia!)
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# ==========================================
# Tahap 3: Aplikasi Produksi (Nginx + PHP)
# ==========================================
FROM serversideup/php:8.4-fpm-nginx
WORKDIR /var/www/html

# Salin seluruh kode aplikasi dari repositori
COPY --chown=www-data:www-data . .

# Salin vendor hasil install Composer dari Tahap 1
COPY --chown=www-data:www-data --from=composer-builder /app/vendor ./vendor

# Salin hasil kompilasi frontend dari Tahap 2
COPY --chown=www-data:www-data --from=frontend-builder /app/public/build ./public/build

# Optimalisasi permission untuk storage & cache Laravel
RUN chmod -R 775 storage bootstrap/cache