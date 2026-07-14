<?php

use App\Http\Controllers\Export\AttendanceExportController;
use App\Http\Controllers\Guru\AbsensiController;
use App\Http\Controllers\Guru\DataAbsensiController;
use App\Http\Controllers\Guru\DownloadBuktiController;
use App\Http\Controllers\Guru\ExportPageController;
use App\Http\Controllers\PasswordResetController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:guru', 'check.password.status'])->prefix('guru')->name('guru.')->group(function () {
    Route::get('absensi', [AbsensiController::class, 'index'])->name('absensi.index');
    Route::post('absensi', [AbsensiController::class, 'store'])->name('absensi.store');
    Route::delete('absensi/{absensi}', [AbsensiController::class, 'destroy'])->name('absensi.destroy');

    Route::get('data-absensi', [DataAbsensiController::class, 'index'])->name('data-absensi.index');

    Route::get('export', [ExportPageController::class, 'index'])->name('export.index');

    Route::get('download-bukti/{absensi}', [DownloadBuktiController::class, 'download'])->name('download-bukti');

    Route::post('ubah-sandi', [PasswordResetController::class, 'updateChange'])->name('password.change');

    Route::get('export-absensi', [AttendanceExportController::class, 'export'])->name('export-absensi');
});
