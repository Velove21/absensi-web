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
        Schema::table('absensis', function (Blueprint $table) {
            $table->foreignId('mapel_id')->nullable()->constrained('mata_pelajarans')->onDelete('cascade');
            $table->string('jam_ke')->nullable();
            $table->string('waktu_mulai')->nullable();
            $table->string('waktu_selesai')->nullable();
            $table->string('status')->default('hadir')->change();

            // Drop unique constraint
            $table->dropUnique(['siswa_id', 'tanggal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            $table->unique(['siswa_id', 'tanggal']);
            $table->enum('status', ['hadir', 'sakit', 'izin', 'alpha'])->change();
            $table->dropColumn(['mapel_id', 'jam_ke', 'waktu_mulai', 'waktu_selesai']);
        });
    }
};
