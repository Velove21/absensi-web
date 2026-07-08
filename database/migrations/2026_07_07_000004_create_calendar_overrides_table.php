<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_overrides', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal')->unique();
            $table->foreignId('template_id')->constrained('schedule_templates')->cascadeOnDelete();
            $table->string('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_overrides');
    }
};
