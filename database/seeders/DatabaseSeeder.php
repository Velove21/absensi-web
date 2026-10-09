<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            JurusanSeeder::class,
            KelasSeeder::class,
            DurasiPembelajaranSeeder::class,
            MataPelajaranSeeder::class,
            GuruSeeder::class,
            SiswaXPPLGASeeder::class,
            SiswaXIPPLGASeeder::class,
            SiswaXIDPIBBSeeder::class,
            SiswaXITMASeeder::class,
        ]);
    }
}
