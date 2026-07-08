<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['nama', 'hari', 'is_default'])]
class ScheduleTemplate extends Model
{
    protected $casts = [
        'hari' => 'array',
        'is_default' => 'boolean',
    ];

    public function schedules(): BelongsToMany
    {
        return $this->belongsToMany(Schedule::class, 'template_schedules', 'template_id', 'schedule_id')
            ->withPivot('urutan')
            ->withTimestamps()
            ->orderByPivot('urutan');
    }

    public function calendarOverrides(): HasMany
    {
        return $this->hasMany(CalendarOverride::class);
    }

    public static function forDate(string|\DateTimeInterface $date): ?self
    {
        $dateStr = Carbon::parse($date)->toDateString();

        $override = CalendarOverride::whereDate('tanggal', $dateStr)
            ->with('template')
            ->first();

        if ($override) {
            return $override->template;
        }

        $dayName = self::indonesianDayName($dateStr);

        return static::whereJsonContains('hari', $dayName)->first();
    }

    public static function indonesianDayName(string $dateStr): string
    {
        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        return $days[(int) Carbon::parse($dateStr)->format('w')];
    }
}
