<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'kelas_id', 'nis', 'nama'])]
class Siswa extends Model
{
    /**
     * Get the user that owns the siswa.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the kelas that owns the siswa.
     */
    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    /**
     * Get the absensis for the siswa.
     */
    public function absensis(): HasMany
    {
        return $this->hasMany(Absensi::class);
    }
}
