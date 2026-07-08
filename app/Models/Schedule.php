<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

#[Fillable(['hari', 'waktu_mulai', 'waktu_selesai', 'urutan'])]
class Schedule extends Model
{
    public static function indonesianDayName(string $dateStr): string
    {
        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        return $days[(int) Carbon::parse($dateStr)->format('w')];
    }
}
