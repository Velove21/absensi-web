<?php

use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProfilController;
use App\Http\Controllers\Siswa\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'role:siswa', 'check.password.status'])->prefix('siswa')->name('siswa.')->group(function () {
    Route::get('profil', [ProfilController::class, 'show'])->name('profil');

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('ubah-sandi', [PasswordResetController::class, 'showChange'])->name('password.change.show');
    Route::post('ubah-sandi', [PasswordResetController::class, 'updateChange'])->name('password.change');
});
