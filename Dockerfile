# ==========================================
# Tahap 1: Composer (PHP Dependencies)
# ==========================================
FROM composer:2 AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts

# ==========================================
# Tahap 2: Build Frontend Assets (Menggunakan Serversideup yang sudah ada PHP + Node)
# ==========================================
FROM serversideup/php:8.4-fpm-nginx AS frontend-builder
WORKDIR /app

# Pindah ke user root sementara agar bisa menjalankan instalasi npm global jika dibutuhkan
USER root

# Salin manifest frontend
COPY package.json package-lock.json* ./
RUN npm install

# Salin seluruh kode aplikasi
COPY . .

# Salin folder vendor dari Tahap 1 agar 'php artisan' Wayfinder bisa jalan saat build
COPY --from=composer-builder /app/vendor ./vendor

# Jalankan build frontend (Pasti aman karena PHP 8.4 & Node sudah ada di dalam image ini!)
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# ==========================================
# Tahap 3: Aplikasi Produksi Akhir
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