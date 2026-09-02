<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Perbaiki data role users yang salah karena kolom enum role
     * memiliki default 'siswa'. Saat database di hosting dibangun dari
     * import data lama lalu dimigrasi ulang, seluruh user lama (termasuk
     * admin/guru) bisa tercatat sebagai 'siswa'. Migration ini
     * menyelaraskan role user berdasarkan record yang ada di tabel
     * gurus/siswas sehingga login per role selalu mengarah ke halaman
     * yang benar.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereExists(fn ($query) => $query
                ->select(DB::raw(1))
                ->from('gurus')
                ->whereColumn('gurus.user_id', 'users.id'))
            ->update(['role' => 'guru']);

        DB::table('users')
            ->whereExists(fn ($query) => $query
                ->select(DB::raw(1))
                ->from('siswas')
                ->whereColumn('siswas.user_id', 'users.id'))
            ->update(['role' => 'siswa']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak ada yang perlu di-reverse; ini hanya sinkronisasi data.
    }
};
