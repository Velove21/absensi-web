<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('template_schedules');

        Schema::create('template_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('schedule_templates')->cascadeOnDelete();
            $table->foreignId('schedule_id')->constrained()->cascadeOnDelete();
            $table->integer('urutan');
            $table->timestamps();

            $table->unique(['template_id', 'schedule_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_schedules');
    }
};
