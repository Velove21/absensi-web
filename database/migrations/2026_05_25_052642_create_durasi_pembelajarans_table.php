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
        Schema::create('durasi_pembelajarans', function (Blueprint $table) {
            $table->id();
            $table->string('hari', 10);
            $table->integer('jam_ke');
            $table->time('waktu_mulai');
            $table->time('waktu_selesai');
            $table->timestamps();

            $table->unique(['hari', 'jam_ke']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('durasi_pembelajarans');
    }
};
