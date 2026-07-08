<?php

use App\Models\CalendarOverride;
use App\Models\Schedule;
use App\Models\ScheduleTemplate;
use App\Models\TemplateSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('schedule templates are seeded correctly', function () {
    $this->seed(\Database\Seeders\ScheduleTemplateSeeder::class);

    expect(Schedule::count())->toBeGreaterThan(0);
    expect(ScheduleTemplate::count())->toBeGreaterThan(0);
    expect(TemplateSchedule::count())->toBeGreaterThan(0);
});

test('schedule template resolves correctly for monday with upacara', function () {
    $this->seed(\Database\Seeders\ScheduleTemplateSeeder::class);

    $template = ScheduleTemplate::forDate('2026-07-06');

    expect($template)->not->toBeNull();
    expect($template->nama)->toBe('Senin/Upacara');
    expect($template->schedules->count())->toBe(11);
    expect($template->schedules->first()->nama)->toBe('Upacara');
});

test('schedule template resolves correctly for wednesday without upacara', function () {
    $this->seed(\Database\Seeders\ScheduleTemplateSeeder::class);

    $template = ScheduleTemplate::forDate('2026-07-08');

    expect($template)->not->toBeNull();
    expect($template->nama)->toBe('Selasa-Kamis');
    expect($template->schedules->count())->toBe(10);
    expect($template->schedules->first()->nama)->not->toBe('Upacara');
});

test('calendar override takes precedence over default template', function () {
    $this->seed(\Database\Seeders\ScheduleTemplateSeeder::class);

    $seninUpacara = ScheduleTemplate::where('nama', 'Senin/Upacara')->first();

    CalendarOverride::create([
        'tanggal' => '2026-07-08',
        'template_id' => $seninUpacara->id,
        'catatan' => 'Hari khusus - ada upacara',
    ]);

    $template = ScheduleTemplate::forDate('2026-07-08');

    expect($template)->not->toBeNull();
    expect($template->nama)->toBe('Senin/Upacara');
    expect($template->schedules->count())->toBe(11);
    expect($template->schedules->first()->nama)->toBe('Upacara');
});
