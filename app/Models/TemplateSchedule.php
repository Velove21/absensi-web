<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['template_id', 'schedule_id', 'urutan'])]
class TemplateSchedule extends Model
{
    protected $table = 'template_schedules';

    public function template(): BelongsTo
    {
        return $this->belongsTo(ScheduleTemplate::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }
}
