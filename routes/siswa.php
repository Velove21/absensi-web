<?php

use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\Siswa\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:siswa', 'check.password.status'])->prefix('siswa')->name('siswa.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::post('ubah-sandi', [PasswordResetController::class, 'updateChange'])->name('password.change');
});
