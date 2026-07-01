<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nama_mapel', 'kategori_pembelajaran_id', 'jurusan_id'])]
class MataPelajaran extends Model
{
    /**
     * Get the kategori pembelajaran that owns the mata pelajaran.
     */
    public function kategoriPembelajaran(): BelongsTo
    {
        return $this->belongsTo(KategoriPembelajaran::class);
    }

    /**
     * Get the jurusan that owns the mata pelajaran (only relevant for KK category).
     */
    public function jurusan(): BelongsTo
    {
        return $this->belongsTo(Jurusan::class);
    }

    /**
     * Get the absensis for this mata pelajaran.
     */
    public function absensis(): HasMany
    {
        return $this->hasMany(Absensi::class, 'mapel_id');
    }

    /**
     * Get the appended kategori attribute for frontend usage.
     */
    public function getKategoriAttribute()
    {
        return $this->kategoriPembelajaran ? $this->kategoriPembelajaran->kode : '';
    }

    protected $appends = ['kategori'];
}
