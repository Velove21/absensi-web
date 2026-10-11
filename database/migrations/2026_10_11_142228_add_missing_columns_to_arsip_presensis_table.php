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
        Schema::table('arsip_presensis', function (Blueprint $table) {
            if (! Schema::hasColumn('arsip_presensis', 'siswa_nis')) {
                $table->string('siswa_nis', 20)->nullable();
            }
            if (! Schema::hasColumn('arsip_presensis', 'siswa_nama')) {
                $table->string('siswa_nama')->nullable();
            }
            if (! Schema::hasColumn('arsip_presensis', 'siswa_foto_url')) {
                $table->string('siswa_foto_url')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('arsip_presensis', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('arsip_presensis', 'siswa_nis')) {
                $cols[] = 'siswa_nis';
            }
            if (Schema::hasColumn('arsip_presensis', 'siswa_nama')) {
                $cols[] = 'siswa_nama';
            }
            if (Schema::hasColumn('arsip_presensis', 'siswa_foto_url')) {
                $cols[] = 'siswa_foto_url';
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
