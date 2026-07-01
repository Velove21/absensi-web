<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, seed jenjang_kelas from existing distinct tingkat values
        $existingTingkats = DB::table('kelas')->distinct()->pluck('tingkat')->filter();

        foreach ($existingTingkats as $tingkat) {
            DB::table('jenjang_kelas')->insertOrIgnore([
                'nama_jenjang' => $tingkat,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Add the new FK column
        Schema::table('kelas', function (Blueprint $table) {
            $table->foreignId('jenjang_kelas_id')
                ->nullable()
                ->after('jurusan_id')
                ->constrained('jenjang_kelas')
                ->nullOnDelete();
        });

        // Migrate existing data: map tingkat string values to jenjang_kelas IDs
        $jenjangMap = DB::table('jenjang_kelas')->pluck('id', 'nama_jenjang');
        foreach ($jenjangMap as $nama => $id) {
            DB::table('kelas')->where('tingkat', $nama)->update(['jenjang_kelas_id' => $id]);
        }

        // Drop the old tingkat column
        Schema::table('kelas', function (Blueprint $table) {
            $table->dropColumn('tingkat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->string('tingkat', 10)->nullable()->after('jurusan_id');
        });

        // Migrate data back
        $jenjangMap = DB::table('jenjang_kelas')->pluck('nama_jenjang', 'id');
        foreach ($jenjangMap as $id => $nama) {
            DB::table('kelas')->where('jenjang_kelas_id', $id)->update(['tingkat' => $nama]);
        }

        Schema::table('kelas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('jenjang_kelas_id');
        });
    }
};
