<?php

use App\Http\Controllers\Admin\DurasiPembelajaranController;
use App\Http\Controllers\Admin\GuruController;
use App\Http\Controllers\Admin\JenjangKelasController;
use App\Http\Controllers\Admin\JurusanController;
use App\Http\Controllers\Admin\KategoriPembelajaranController;
use App\Http\Controllers\Admin\KelasController;
use App\Http\Controllers\Admin\MataPelajaranController;
use App\Http\Controllers\Admin\ResetPasswordController;
use App\Http\Controllers\Admin\ScheduleController;
use App\Http\Controllers\Admin\SiswaController;
use App\Http\Controllers\Export\AttendanceExportController;
use App\Http\Controllers\Guru\AbsensiController;
use App\Http\Controllers\Guru\DownloadBuktiController;
use App\Http\Controllers\Guru\ExportPageController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\Siswa\DashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Force change password – accessible to all authenticated users, exempt from CheckPasswordStatus
    Route::get('password/change', [PasswordResetController::class, 'show'])->name('password.change.show');
    Route::post('password/change', [PasswordResetController::class, 'update'])->name('password.change.update');

    // All routes below require password to not be default
    Route::middleware(['check.password.status'])->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');

        // Admin Routes
        Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
            Route::get('dashboard', App\Http\Controllers\Admin\DashboardController::class)->name('dashboard');
            Route::resource('jurusan', JurusanController::class);
            Route::resource('jenjang-kelas', JenjangKelasController::class);
            Route::resource('kategori-pembelajaran', KategoriPembelajaranController::class);
            Route::resource('durasi-pembelajaran', DurasiPembelajaranController::class)->except(['destroy']);
            Route::resource('jadwal-pelajaran', ScheduleController::class);
            Route::resource('kelas', KelasController::class);
            Route::resource('matapelajaran', MataPelajaranController::class);
            Route::resource('guru', GuruController::class);
            Route::resource('siswa', SiswaController::class);
            // Password reset by admin
            Route::post('guru/{guru}/reset-password', [ResetPasswordController::class, 'resetGuru'])->name('guru.reset-password');
            Route::post('siswa/{siswa}/reset-password', [ResetPasswordController::class, 'resetSiswa'])->name('siswa.reset-password');
            // Admin change password
            Route::get('ubah-sandi', [PasswordResetController::class, 'showChange'])->name('ubah-sandi.show');
            Route::post('ubah-sandi', [PasswordResetController::class, 'updateChange'])->name('ubah-sandi.update');
            // Export
            Route::get('export-absensi', [AttendanceExportController::class, 'export'])->name('export-absensi');
        });

        // Guru Routes
        Route::middleware(['role:guru'])->prefix('guru')->name('guru.')->group(function () {
            Route::get('absensi', [AbsensiController::class, 'index'])->name('absensi.index');
            Route::post('absensi', [AbsensiController::class, 'store'])->name('absensi.store');
            Route::delete('absensi/{absensi}', [AbsensiController::class, 'destroy'])->name('absensi.destroy');
            Route::get('ubah-sandi', [PasswordResetController::class, 'showChange'])->name('ubah-sandi.show');
            Route::post('ubah-sandi', [PasswordResetController::class, 'updateChange'])->name('ubah-sandi.update');
            // Export
            Route::get('export-absensi', [AttendanceExportController::class, 'export'])->name('export-absensi');
            Route::get('export', [ExportPageController::class, 'index'])->name('export.index');
            // Download bukti
            Route::get('download-bukti/{absensi}', [DownloadBuktiController::class, 'download'])->name('download-bukti');
        });

        // Siswa Routes
        Route::middleware(['role:siswa'])->prefix('siswa')->name('siswa.')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::get('ubah-sandi', [PasswordResetController::class, 'showChange'])->name('ubah-sandi.show');
            Route::post('ubah-sandi', [PasswordResetController::class, 'updateChange'])->name('ubah-sandi.update');
        });
    });
});

require __DIR__.'/settings.php';
