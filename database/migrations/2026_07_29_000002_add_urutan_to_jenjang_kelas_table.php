<?php

use App\Models\JenjangKelas;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jenjang_kelas', function (Blueprint $table) {
            $table->integer('urutan')->nullable()->after('nama_jenjang');
        });

        $urutanMap = [
            'X' => 1,
            'XI' => 2,
            'XII' => 3,
            'XIII' => 4,
            '1' => 1,
            '2' => 2,
            '3' => 3,
            '4' => 4,
        ];

        foreach (JenjangKelas::all() as $jenjang) {
            if (isset($urutanMap[$jenjang->nama_jenjang])) {
                $jenjang->update(['urutan' => $urutanMap[$jenjang->nama_jenjang]]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('jenjang_kelas', function (Blueprint $table) {
            $table->dropColumn('urutan');
        });
    }
};
