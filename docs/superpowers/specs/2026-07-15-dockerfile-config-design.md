# Design Doc: Dockerfile Configuration for Laravel 13

## Goal
Replace Nixpacks deployment with a custom, multi-stage Dockerfile using Node 22 Alpine for compiling assets and `serversideup/php:8.3-fpm-nginx` for production serving.

## Proposed Design
1. Delete `nixpacks.toml`.
2. Create `Dockerfile` in the project root containing:
   - Frontend builder using `node:22-alpine`
   - Production container using `serversideup/php:8.3-fpm-nginx`
   - Production dependencies via Composer and npm compilation of assets.
3. Migrate and seed are configured externally (e.g., via Coolify pre-start / post-deployment commands) rather than inside the Docker build process.
