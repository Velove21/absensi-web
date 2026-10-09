<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('arsip_presensis', function (Blueprint $table) {
            // Add snapshot columns to survive siswa deletion
            if (! Schema::hasColumn('arsip_presensis', 'siswa_nis')) {
                $table->string('siswa_nis', 20)->nullable()->after('siswa_id');
            }
            if (! Schema::hasColumn('arsip_presensis', 'siswa_nama')) {
                $table->string('siswa_nama')->nullable()->after('siswa_nis');
            }
            if (! Schema::hasColumn('arsip_presensis', 'siswa_foto_url')) {
                $table->string('siswa_foto_url')->nullable()->after('siswa_nama');
            }
        });

        // Fix FK: siswa_id should be nullOnDelete, not cascade (keep arsip for alumni)
        // Drop existing FK and recreate if needed
        try {
            // Fill snapshot for existing rows first
            $rows = DB::table('arsip_presensis')->whereNull('siswa_nis')->orWhereNull('siswa_nama')->get();
            foreach ($rows as $row) {
                $siswa = DB::table('siswas')->where('id', $row->siswa_id)->first();
                if ($siswa) {
                    $foto = DB::table('profile_fotos')->where('fotoable_type', 'App\\Models\\Siswa')->where('fotoable_id', $siswa->id)->first();
                    $fotoUrl = null;
                    if ($foto && $foto->path) {
                        $fotoUrl = '/storage/'.ltrim($foto->path, '/');
                    }
                    DB::table('arsip_presensis')->where('id', $row->id)->update([
                        'siswa_nis' => $siswa->nis,
                        'siswa_nama' => $siswa->nama,
                        'siswa_foto_url' => $fotoUrl,
                    ]);
                }
            }
        } catch (Throwable $e) {
        }

        // Try to fix FK - may fail on sqlite, ignore
        try {
            Schema::table('arsip_presensis', function (Blueprint $table) {
                // Drop old FK if exists
                $table->dropForeign(['siswa_id']);
            });
        } catch (Throwable $e) {
        }
        try {
            Schema::table('arsip_presensis', function (Blueprint $table) {
                $table->foreign('siswa_id')->references('id')->on('siswas')->nullOnDelete();
            });
        } catch (Throwable $e) {
        }

        // Also make siswa_id nullable if not already
        try {
            DB::statement('ALTER TABLE arsip_presensis MODIFY siswa_id BIGINT UNSIGNED NULL');
        } catch (Throwable $e) {
        }
    }

    public function down(): void
    {
        Schema::table('arsip_presensis', function (Blueprint $table) {
            if (Schema::hasColumn('arsip_presensis', 'siswa_foto_url')) {
                $table->dropColumn('siswa_foto_url');
            }
            if (Schema::hasColumn('arsip_presensis', 'siswa_nama')) {
                $table->dropColumn('siswa_nama');
            }
            if (Schema::hasColumn('arsip_presensis', 'siswa_nis')) {
                $table->dropColumn('siswa_nis');
            }
        });
    }
};
