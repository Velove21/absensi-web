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
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL retains the check constraint created from initial enum column
            DB::statement('ALTER TABLE absensis DROP CONSTRAINT IF EXISTS absensis_status_check');
        }

        Schema::table('absensis', function (Blueprint $table) {
            $table->string('status')->default('hadir')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE absensis ADD CONSTRAINT absensis_status_check CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha', 'dispensasi'))");
        }
    }
};
