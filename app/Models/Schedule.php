<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['nama', 'waktu_mulai', 'waktu_selesai', 'urutan'])]
class Schedule extends Model
{
    public function templates(): BelongsToMany
    {
        return $this->belongsToMany(ScheduleTemplate::class, 'template_schedules', 'schedule_id', 'template_id')
            ->withPivot('urutan')
            ->withTimestamps();
    }
}
