<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('durasi_pembelajarans', function (Blueprint $table) {
            $table->string('nama', 50)->nullable()->after('jam_ke');
        });
    }

    public function down(): void
    {
        Schema::table('durasi_pembelajarans', function (Blueprint $table) {
            $table->dropColumn('nama');
        });
    }
};
