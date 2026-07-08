<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            AdminSeeder::class,
            JurusanSeeder::class,
            KelasSeeder::class,
            DurasiPembelajaranSeeder::class,
            MataPelajaranSeeder::class,
            GuruSeeder::class,
            SiswaXIPPLGASeeder::class,
            SiswaXIDPIBBSeeder::class,
            SiswaXITMASeeder::class,
            ScheduleTemplateSeeder::class,
        ]);
    }
}
