<?php

use App\Http\Controllers\PasswordResetController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome'))->name('home');

Route::middleware('auth')->group(function (): void {
    Route::get('dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');

    Route::get('ubah-sandi', [PasswordResetController::class, 'show'])->name('password.change.show');
    Route::post('ubah-sandi', [PasswordResetController::class, 'update'])->name('password.change.update');
});
