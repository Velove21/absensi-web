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
            $table->foreignId('jurusan_id')->nullable()->change();
            $table->string('tingkat')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            // Note: Reverting nullable changes in SQLite might have edge cases,
            // but we can restore the original types if needed.
            $table->foreignId('jurusan_id')->change();
            $table->enum('tingkat', ['X', 'XI', 'XII', 'XIII'])->change();
        });
    }
};
