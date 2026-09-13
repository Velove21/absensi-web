<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            // jurusan wajib diisi - ubah jadi NOT NULL (jika ada data null sebelumnya, isi dulu)
            // cek apakah ada baris null, jika ada biarkan nullable untuk avoid error, tapi validasi aplikasi akan wajib
            $table->string('nama_kelas')->nullable()->change();
        });
        // Jika ingin jurusan jadi NOT NULL dan tidak ada data null, uncomment:
        // Schema::table('kelas', function (Blueprint $table) {
        //     $table->foreignId('jurusan_id')->nullable(false)->change();
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->string('nama_kelas')->nullable(false)->change();
        });
    }
};
