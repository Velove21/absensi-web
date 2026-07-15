# Design Doc: Dockerfile Configuration for Laravel 13

## Goal
Replace Nixpacks deployment with a custom, multi-stage Dockerfile using Node 22 Alpine for compiling assets and `serversideup/php:8.3-fpm-nginx` for production serving.

## Proposed Design
1. Delete `nixpacks.toml`.
2. Create `Dockerfile` in the project root containing:
   - Stage 1: Composer dependencies (`composer:2`).
   - Stage 2: Frontend builder using `node:22-alpine` with PHP 8.3 installed to support `php artisan wayfinder:generate` during `npm run build`.
   - Stage 3: Production runner using `serversideup/php:8.3-fpm-nginx`.
3. Restore `vite.config.ts` to run Wayfinder normally in all environments (since PHP is now available in the build stage).
