<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nama_jurusan', 'singkatan'])]
class Jurusan extends Model
{
    /**
     * Get the kelas for the jurusan.
     */
    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class);
    }

    /**
     * Get the gurus assigned to the jurusan.
     */
    public function gurus(): BelongsToMany
    {
        return $this->belongsToMany(Guru::class, 'guru_jurusan');
    }
}
