<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['guru_id', 'tanggal', 'status', 'keterangan'])]
class TeacherAbsensi extends Model
{
    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }
}
