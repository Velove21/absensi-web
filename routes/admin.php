<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\ArsipController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DurasiPembelajaranController;
use App\Http\Controllers\Admin\GuruController;
use App\Http\Controllers\Admin\ImportController;
use App\Http\Controllers\Admin\JenjangKelasController;
use App\Http\Controllers\Admin\JurusanController;
use App\Http\Controllers\Admin\KategoriPembelajaranController;
use App\Http\Controllers\Admin\KelasController;
use App\Http\Controllers\Admin\MataPelajaranController;
use App\Http\Controllers\Admin\ResetPasswordController;
use App\Http\Controllers\Admin\ScheduleController;
use App\Http\Controllers\Admin\SiswaController;
use App\Http\Controllers\Admin\StatistikController;
use App\Http\Controllers\Admin\TahunAjaranController;
use App\Http\Controllers\Export\AttendanceExportController;
use App\Http\Controllers\PasswordResetController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'role:admin', 'check.password.status'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('statistik/{status}', [StatistikController::class, 'index'])->name('statistik');

    Route::get('tambah-admin', [AdminController::class, 'tambahAdmin'])->name('tambah-admin');
    Route::post('admin', [AdminController::class, 'store'])->name('admin.store');
    Route::put('admin/{admin}', [AdminController::class, 'update'])->name('admin.update');
    Route::delete('admin/{admin}', [AdminController::class, 'destroy'])->name('admin.destroy');
    Route::post('admin/{admin}/reset-password', [AdminController::class, 'resetPassword'])->name('admin.resetPassword');

    Route::get('guru', [GuruController::class, 'index'])->name('guru.index');
    Route::get('guru/{guru}/profil', [GuruController::class, 'show'])->name('guru.profil');
    Route::post('guru', [GuruController::class, 'store'])->name('guru.store');
    Route::put('guru/{guru}', [GuruController::class, 'update'])->name('guru.update');
    Route::delete('guru/{guru}', [GuruController::class, 'destroy'])->name('guru.destroy');
    Route::post('guru/{guru}/reset-password', [ResetPasswordController::class, 'resetGuru'])->name('guru.resetPassword');

    Route::get('siswa', [SiswaController::class, 'index'])->name('siswa.index');
    Route::get('siswa/{siswa}/profil', [SiswaController::class, 'show'])->name('siswa.profil');
    Route::post('siswa', [SiswaController::class, 'store'])->name('siswa.store');
    Route::put('siswa/{siswa}', [SiswaController::class, 'update'])->name('siswa.update');
    Route::delete('siswa/{siswa}', [SiswaController::class, 'destroy'])->name('siswa.destroy');
    Route::post('siswa/{siswa}/reset-password', [ResetPasswordController::class, 'resetSiswa'])->name('siswa.resetPassword');

    Route::get('tahun-ajaran', [TahunAjaranController::class, 'index'])->name('tahun-ajaran.index');
    Route::post('tahun-ajaran', [TahunAjaranController::class, 'store'])->name('tahun-ajaran.store');
    Route::put('tahun-ajaran/{tahun_ajaran}', [TahunAjaranController::class, 'update'])->name('tahun-ajaran.update');
    Route::delete('tahun-ajaran/{tahun_ajaran}', [TahunAjaranController::class, 'destroy'])->name('tahun-ajaran.destroy');
    Route::post('tahun-ajaran/{tahun_ajaran}/activate', [TahunAjaranController::class, 'activate'])->name('tahun-ajaran.activate');
    Route::post('tahun-ajaran/naik-kelas', [TahunAjaranController::class, 'naikKelas'])->name('tahun-ajaran.naik-kelas');
    Route::get('tahun-ajaran/{tahunAjaran}/arsip', [ArsipController::class, 'tingkat'])->name('tahun-ajaran.arsip');
    Route::get('tahun-ajaran/{tahunAjaran}/arsip/{jenjang}/{jurusan}', [ArsipController::class, 'kelas'])->name('tahun-ajaran.arsip.kelas');
    Route::get('tahun-ajaran/{tahunAjaran}/arsip/{kelas}/detail', [ArsipController::class, 'detail'])->name('tahun-ajaran.arsip.detail');
    Route::get('tahun-ajaran/{tahunAjaran}/arsip/{kelas}/export', [ArsipController::class, 'export'])->name('tahun-ajaran.arsip.export');

    Route::get('jurusan', [JurusanController::class, 'index'])->name('jurusan.index');
    Route::post('jurusan', [JurusanController::class, 'store'])->name('jurusan.store');
    Route::put('jurusan/{jurusan}', [JurusanController::class, 'update'])->name('jurusan.update');
    Route::delete('jurusan/{jurusan}', [JurusanController::class, 'destroy'])->name('jurusan.destroy');

    Route::get('kelas', [KelasController::class, 'index'])->name('kelas.index');
    Route::post('kelas', [KelasController::class, 'store'])->name('kelas.store');
    Route::put('kelas/{kela}', [KelasController::class, 'update'])->name('kelas.update');
    Route::delete('kelas/{kela}', [KelasController::class, 'destroy'])->name('kelas.destroy');

    Route::get('jenjang-kelas', [JenjangKelasController::class, 'index'])->name('jenjang-kelas.index');
    Route::post('jenjang-kelas', [JenjangKelasController::class, 'store'])->name('jenjang-kelas.store');
    Route::put('jenjang-kelas/{jenjang_kela}', [JenjangKelasController::class, 'update'])->name('jenjang-kelas.update');
    Route::delete('jenjang-kelas/{jenjang_kela}', [JenjangKelasController::class, 'destroy'])->name('jenjang-kelas.destroy');

    // Alias baru: Jenjang (tanpa Kelas) - konsisten dengan penamaan UI
    Route::get('jenjang', [JenjangKelasController::class, 'index'])->name('jenjang.index');
    Route::post('jenjang', [JenjangKelasController::class, 'store'])->name('jenjang.store');
    Route::put('jenjang/{jenjang}', [JenjangKelasController::class, 'update'])->name('jenjang.update');
    Route::delete('jenjang/{jenjang}', [JenjangKelasController::class, 'destroy'])->name('jenjang.destroy');

    Route::get('matapelajaran', [MataPelajaranController::class, 'index'])->name('matapelajaran.index');
    Route::post('matapelajaran', [MataPelajaranController::class, 'store'])->name('matapelajaran.store');
    Route::put('matapelajaran/{matapelajaran}', [MataPelajaranController::class, 'update'])->name('matapelajaran.update');
    Route::delete('matapelajaran/{matapelajaran}', [MataPelajaranController::class, 'destroy'])->name('matapelajaran.destroy');

    Route::get('kategori-pembelajaran', [KategoriPembelajaranController::class, 'index'])->name('kategori-pembelajaran.index');
    Route::post('kategori-pembelajaran', [KategoriPembelajaranController::class, 'store'])->name('kategori-pembelajaran.store');
    Route::put('kategori-pembelajaran/{kategori_pembelajaran}', [KategoriPembelajaranController::class, 'update'])->name('kategori-pembelajaran.update');
    Route::delete('kategori-pembelajaran/{kategori_pembelajaran}', [KategoriPembelajaranController::class, 'destroy'])->name('kategori-pembelajaran.destroy');

    Route::get('durasi-pembelajaran', [DurasiPembelajaranController::class, 'index'])->name('durasi-pembelajaran.index');
    Route::post('durasi-pembelajaran', [DurasiPembelajaranController::class, 'store'])->name('durasi-pembelajaran.store');
    Route::put('durasi-pembelajaran/{durasi_pembelajaran}', [DurasiPembelajaranController::class, 'update'])->name('durasi-pembelajaran.update');
    Route::delete('durasi-pembelajaran/{durasi_pembelajaran}', [DurasiPembelajaranController::class, 'destroy'])->name('durasi-pembelajaran.destroy');

    Route::get('jadwal-pelajaran', [ScheduleController::class, 'index'])->name('jadwal-pelajaran.index');
    Route::post('jadwal-pelajaran', [ScheduleController::class, 'store'])->name('jadwal-pelajaran.store');
    Route::put('jadwal-pelajaran/{jadwal_pelajaran}', [ScheduleController::class, 'update'])->name('jadwal-pelajaran.update');
    Route::delete('jadwal-pelajaran/{jadwal_pelajaran}', [ScheduleController::class, 'destroy'])->name('jadwal-pelajaran.destroy');

    Route::get('ubah-sandi', [PasswordResetController::class, 'showChange'])->name('password.change.show');
    Route::post('ubah-sandi', [PasswordResetController::class, 'updateChange'])->name('password.change');

    Route::get('export-absensi', [AttendanceExportController::class, 'export'])->name('export-absensi');

    // CSV Import: template & import untuk 10 platform
    Route::get('import/template/{entity}', [ImportController::class, 'template'])->name('import.template');
    Route::post('import/{entity}', [ImportController::class, 'import'])->name('import');
    Route::get('import/template/{entity}/info', function (string $entity) {
        $map = [
            'tahun-ajaran' => ['headers' => ['tahun_awal', 'tahun_akhir']],
            'jurusan' => ['headers' => ['nama_jurusan', 'singkatan']],
            'jenjang-kelas' => ['headers' => ['nama_jenjang']],
            'jenjang' => ['headers' => ['nama_jenjang']],
            'durasi-pembelajaran' => ['headers' => ['hari', 'jam_ke', 'waktu_mulai', 'waktu_selesai']],
            'kelas' => ['headers' => ['nama_kelas', 'jurusan_singkatan', 'jenjang_nama']],
            'kategori-pembelajaran' => ['headers' => ['nama_kategori', 'kode']],
            'mata-pelajaran' => ['headers' => ['nama_mapel', 'kategori_kode']],
            'guru' => ['headers' => ['nip', 'nama', 'jenis_kelamin', 'kelas', 'mata_pelajaran']],
            'siswa' => ['headers' => ['nis', 'nama', 'jenis_kelamin', 'kelas']],
            'admin' => ['headers' => ['name', 'email', 'password']],
        ];

        return response()->json($map[$entity] ?? ['headers' => []]);
    })->name('import.info');
});
