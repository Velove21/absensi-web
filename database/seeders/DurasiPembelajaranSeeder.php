<?php

namespace Database\Seeders;

use App\Models\DurasiPembelajaran;
use Illuminate\Database\Seeder;

class DurasiPembelajaranSeeder extends Seeder
{
    public function run(): void
    {
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        $schedules = [
            ['jam_ke' => 1, 'waktu_mulai' => '07:00', 'waktu_selesai' => '07:45'],
            ['jam_ke' => 2, 'waktu_mulai' => '07:50', 'waktu_selesai' => '08:35'],
            ['jam_ke' => 3, 'waktu_mulai' => '08:35', 'waktu_selesai' => '09:20'],
            ['jam_ke' => 4, 'waktu_mulai' => '09:25', 'waktu_selesai' => '10:10'],
            ['jam_ke' => 5, 'waktu_mulai' => '10:10', 'waktu_selesai' => '10:55'],
            ['jam_ke' => 6, 'waktu_mulai' => '10:55', 'waktu_selesai' => '11:40'],
            ['jam_ke' => 7, 'waktu_mulai' => '12:00', 'waktu_selesai' => '12:45'],
            ['jam_ke' => 8, 'waktu_mulai' => '12:50', 'waktu_selesai' => '13:35'],
            ['jam_ke' => 9, 'waktu_mulai' => '13:35', 'waktu_selesai' => '14:20'],
            ['jam_ke' => 10, 'waktu_mulai' => '14:25', 'waktu_selesai' => '15:10'],
        ];

        foreach ($days as $day) {
            foreach ($schedules as $schedule) {
                DurasiPembelajaran::firstOrCreate(
                    ['hari' => $day, 'jam_ke' => $schedule['jam_ke']],
                    [
                        'waktu_mulai' => $schedule['waktu_mulai'],
                        'waktu_selesai' => $schedule['waktu_selesai'],
                    ]
                );
            }
        }

        // Add Upacara on Monday (Senin)
        DurasiPembelajaran::firstOrCreate(
            ['hari' => 'Senin', 'jam_ke' => 0],
            [
                'nama' => 'Upacara',
                'waktu_mulai' => '07:00',
                'waktu_selesai' => '07:45',
            ]
        );
    }
}
