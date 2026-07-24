# Design Doc: Nixpacks Configuration for Laravel 13

## Goal
Configure Nixpacks for deployment of a Laravel 13 application using PHP 8.3 and npm for compiling frontend assets.

## Proposed Design
We will implement an explicit configuration in `nixpacks.toml` to:
1. Define `providers = ["php", "node"]`.
2. Specify PHP 8.3 and Node 20.
3. Use `npm` for the JS build phase, overriding automatic pnpm detection.
4. Set up production optimization commands in the postbuild phase.

## Configuration Details
The configuration will be written to `nixpacks.toml` at the root of the project.
