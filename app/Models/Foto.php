<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Foto extends Model
{
    protected $fillable = [
        'fotoable_type',
        'fotoable_id',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
    ];

    /**
     * Get the parent guru/siswa that owns the foto.
     */
    public function fotoable(): MorphTo
    {
        return $this->morphTo();
    }
}
