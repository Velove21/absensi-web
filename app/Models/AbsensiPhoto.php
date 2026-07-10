<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbsensiPhoto extends Model
{
    protected $fillable = [
        'absensi_id',
        'file_path',
        'original_name',
        'file_size',
        'mime_type',
        'compressed',
        'compressed_size',
    ];

    public function absensi(): BelongsTo
    {
        return $this->belongsTo(Absensi::class);
    }
}
