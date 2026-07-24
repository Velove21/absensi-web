<?php

use App\Http\Controllers\PasswordResetController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome'))->name('home');

Route::middleware('auth')->group(function (): void {
    Route::get('dashboard', function (Request $request) {
        $role = $request->user()?->role;

        if ($role === 'admin') {
            return redirect()->route('admin.dashboard');
        } elseif ($role === 'guru') {
            return redirect()->route('guru.absensi.index');
        } elseif ($role === 'siswa') {
            return redirect()->route('siswa.dashboard');
        }

        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('ubah-sandi', [PasswordResetController::class, 'show'])->name('password.change.show');
    Route::post('ubah-sandi', [PasswordResetController::class, 'update'])->name('password.change.update');
});
