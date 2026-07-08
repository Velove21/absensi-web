<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['tanggal', 'template_id', 'catatan'])]
class CalendarOverride extends Model
{
    protected $casts = [
        'tanggal' => 'date',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ScheduleTemplate::class, 'template_id');
    }
}
