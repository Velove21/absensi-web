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
        Schema::create('arsip_presensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajarans')->cascadeOnDelete();
            $table->foreignId('siswa_id')->nullable()->constrained('siswas')->nullOnDelete();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->foreignId('guru_id')->nullable()->constrained('gurus')->nullOnDelete();
            $table->foreignId('mapel_id')->nullable()->constrained('mata_pelajarans')->nullOnDelete();
            $table->date('tanggal');
            $table->string('jam_ke')->nullable();
            $table->string('status');
            $table->string('keterangan')->nullable();
            $table->string('bukti')->nullable();
            $table->boolean('is_alumni')->default(false);
            $table->timestamps();
            $table->index(['tahun_ajaran_id', 'kelas_id']);
            $table->index('tanggal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arsip_presensis');
    }
};
