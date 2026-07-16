# ==========================================
# Tahap 1: Composer (PHP Dependencies)
# ==========================================
FROM composer:2 AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts

# ==========================================
# Tahap 2: Build Frontend Assets (Node Murni + Pinjam PHP Lokal)
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
# We rewrite apk repositories to use http to prevent TLS unspecified errors in Docker build network environment
RUN sed -i 's/https/http/g' /etc/apk/repositories \
    && apk add --no-cache php php-common php-cli php-mbstring php-xml php-openssl php-phar php-curl php-dom php-tokenizer php-xmlwriter php-simplexml \
    php-session php-pdo php-pdo_sqlite php-sqlite3 php-fileinfo \
    && (ln -sf /usr/bin/php8* /usr/bin/php || true)

# Salin berkas frontend & install package
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# Salin folder vendor agar perintah 'php artisan wayfinder' bisa booting
COPY --from=composer-builder /app/vendor ./vendor

# Jalankan build frontend
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# ==========================================
# Tahap 3: Aplikasi Produksi Akhir
# ==========================================
FROM serversideup/php:8.4-fpm-nginx
WORKDIR /var/www/html

# Salin seluruh kode aplikasi
COPY --chown=www-data:www-data . .

# Salin vendor hasil install Composer dari Tahap 1
COPY --chown=www-data:www-data --from=composer-builder /app/vendor ./vendor

# Salin hasil kompilasi frontend dari Tahap 2
COPY --chown=www-data:www-data --from=frontend-builder /app/public/build ./public/build

# Optimalisasi permission untuk storage & cache Laravel
RUN chmod -R 775 storage bootstrap/cache