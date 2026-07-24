<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['jurusan_id', 'jenjang_kelas_id', 'nama_kelas'])]
class Kelas extends Model
{
    protected $appends = ['full_nama_kelas'];

    /**
     * Get the jurusan that owns the kelas.
     */
    public function jurusan(): BelongsTo
    {
        return $this->belongsTo(Jurusan::class);
    }

    /**
     * Get the jenjang kelas (grade level).
     */
    public function jenjangKelas(): BelongsTo
    {
        return $this->belongsTo(JenjangKelas::class);
    }

    /**
     * Get the full name of the kelas.
     */
    protected function getFullNamaKelasAttribute(): string
    {
        $parts = [];
        if ($this->jenjangKelas?->nama_jenjang) {
            $parts[] = $this->jenjangKelas->nama_jenjang;
        }
        if ($this->jurusan?->singkatan) {
            $parts[] = $this->jurusan->singkatan;
        }
        if ($this->nama_kelas) {
            $parts[] = $this->nama_kelas;
        }

        return implode(' ', $parts);
    }

    /**
     * Get the siswas for the kelas.
     */
    public function siswas(): HasMany
    {
        return $this->hasMany(Siswa::class);
    }

    /**
     * Get the gurus assigned to the kelas.
     */
    public function gurus(): BelongsToMany
    {
        return $this->belongsToMany(Guru::class, 'guru_kelas');
    }
}
