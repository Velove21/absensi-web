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
        // Seed default categories from existing enum values
        DB::table('kategori_pembelajarans')->insertOrIgnore([
            ['nama_kategori' => 'Mata Pelajaran Umum', 'kode' => 'MPU', 'created_at' => now(), 'updated_at' => now()],
            ['nama_kategori' => 'Konsentrasi Kejuruan', 'kode' => 'KK', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Add the new FK column
        Schema::table('mata_pelajarans', function (Blueprint $table) {
            $table->foreignId('kategori_pembelajaran_id')
                ->nullable()
                ->after('nama_mapel')
                ->constrained('kategori_pembelajarans')
                ->nullOnDelete();
        });

        // Migrate existing data: map kategori string values to IDs
        $kategoriMap = DB::table('kategori_pembelajarans')->pluck('id', 'kode');
        foreach ($kategoriMap as $kode => $id) {
            DB::table('mata_pelajarans')->where('kategori', $kode)->update(['kategori_pembelajaran_id' => $id]);
        }

        // Drop the old enum column
        Schema::table('mata_pelajarans', function (Blueprint $table) {
            $table->dropColumn('kategori');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mata_pelajarans', function (Blueprint $table) {
            $table->string('kategori', 10)->nullable()->after('nama_mapel');
        });

        // Migrate data back
        $kategoriMap = DB::table('kategori_pembelajarans')->pluck('kode', 'id');
        foreach ($kategoriMap as $id => $kode) {
            DB::table('mata_pelajarans')->where('kategori_pembelajaran_id', $id)->update(['kategori' => $kode]);
        }

        Schema::table('mata_pelajarans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kategori_pembelajaran_id');
        });
    }
};
