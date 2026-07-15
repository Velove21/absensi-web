# ==========================================
# Tahap 1: Build Frontend Assets
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Salin package.json dan lockfile
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependensi frontend (menggunakan npm)
RUN npm install

# Salin seluruh kode untuk kompilasi
COPY . .

# Build assets (menghasilkan folder public/build)
RUN npm run build

# ==========================================
# Tahap 2: Aplikasi Produksi (Nginx + PHP)
# ==========================================
FROM serversideup/php:8.3-fpm-nginx

# Set directory kerja default serversideup
WORKDIR /var/www/html

# Salin kode aplikasi dari host dengan owner www-data
COPY --chown=www-data:www-data . .

# Salin file frontend yang sudah dikompilasi dari Tahap 1
COPY --chown=www-data:www-data --from=frontend-builder /app/public/build ./public/build

# Jalankan composer install untuk dependensi produksi
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Optimalisasi permission untuk storage & cache Laravel
RUN chmod -R 775 storage bootstrap/cache
