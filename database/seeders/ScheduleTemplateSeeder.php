<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\ScheduleTemplate;
use App\Models\TemplateSchedule;
use Illuminate\Database\Seeder;

class ScheduleTemplateSeeder extends Seeder
{
    public function run(): void
    {
        if (ScheduleTemplate::count() > 0) {
            return;
        }

        $scheduleData = [
            ['nama' => 'Jam 1', 'waktu_mulai' => '07:00', 'waktu_selesai' => '07:45', 'urutan' => 1],
            ['nama' => 'Jam 2', 'waktu_mulai' => '07:50', 'waktu_selesai' => '08:35', 'urutan' => 2],
            ['nama' => 'Jam 3', 'waktu_mulai' => '08:35', 'waktu_selesai' => '09:20', 'urutan' => 3],
            ['nama' => 'Jam 4', 'waktu_mulai' => '09:25', 'waktu_selesai' => '10:10', 'urutan' => 4],
            ['nama' => 'Jam 5', 'waktu_mulai' => '10:10', 'waktu_selesai' => '10:55', 'urutan' => 5],
            ['nama' => 'Jam 6', 'waktu_mulai' => '10:55', 'waktu_selesai' => '11:40', 'urutan' => 6],
            ['nama' => 'Jam 7', 'waktu_mulai' => '12:00', 'waktu_selesai' => '12:45', 'urutan' => 7],
            ['nama' => 'Jam 8', 'waktu_mulai' => '12:50', 'waktu_selesai' => '13:35', 'urutan' => 8],
            ['nama' => 'Jam 9', 'waktu_mulai' => '13:35', 'waktu_selesai' => '14:20', 'urutan' => 9],
            ['nama' => 'Jam 10', 'waktu_mulai' => '14:25', 'waktu_selesai' => '15:10', 'urutan' => 10],
            ['nama' => 'Upacara', 'waktu_mulai' => '07:00', 'waktu_selesai' => '07:45', 'urutan' => 0],
        ];

        $schedules = [];
        foreach ($scheduleData as $data) {
            $schedules[$data['nama']] = Schedule::create($data);
        }

        $mondayTemplate = ScheduleTemplate::create([
            'nama' => 'Senin/Upacara',
            'hari' => ['Senin'],
        ]);

        $selasaKamisTemplate = ScheduleTemplate::create([
            'nama' => 'Selasa-Kamis',
            'hari' => ['Selasa', 'Rabu', 'Kamis'],
        ]);

        $jumatTemplate = ScheduleTemplate::create([
            'nama' => 'Jumat',
            'hari' => ['Jumat'],
        ]);

        $orderedSchedules = [$schedules['Upacara'], $schedules['Jam 1'], $schedules['Jam 2'], $schedules['Jam 3'], $schedules['Jam 4'], $schedules['Jam 5'], $schedules['Jam 6'], $schedules['Jam 7'], $schedules['Jam 8'], $schedules['Jam 9'], $schedules['Jam 10']];

        foreach ($orderedSchedules as $index => $schedule) {
            TemplateSchedule::create([
                'template_id' => $mondayTemplate->id,
                'schedule_id' => $schedule->id,
                'urutan' => $index,
            ]);
        }

        $regularSchedules = [$schedules['Jam 1'], $schedules['Jam 2'], $schedules['Jam 3'], $schedules['Jam 4'], $schedules['Jam 5'], $schedules['Jam 6'], $schedules['Jam 7'], $schedules['Jam 8'], $schedules['Jam 9'], $schedules['Jam 10']];

        foreach ($regularSchedules as $index => $schedule) {
            TemplateSchedule::create([
                'template_id' => $selasaKamisTemplate->id,
                'schedule_id' => $schedule->id,
                'urutan' => $index,
            ]);
        }

        foreach ($regularSchedules as $index => $schedule) {
            TemplateSchedule::create([
                'template_id' => $jumatTemplate->id,
                'schedule_id' => $schedule->id,
                'urutan' => $index,
            ]);
        }
    }
}
