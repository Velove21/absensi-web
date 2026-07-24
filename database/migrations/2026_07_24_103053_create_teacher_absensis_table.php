<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_absensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('gurus')->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('status'); // hadir, izin, sakit
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['guru_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_absensis');
    }
};
