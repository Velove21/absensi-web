<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nama_kategori', 'kode'])]
class KategoriPembelajaran extends Model
{
    protected $table = 'kategori_pembelajarans';

    /**
     * Get the mata pelajarans for this kategori.
     */
    public function mataPelajarans(): HasMany
    {
        return $this->hasMany(MataPelajaran::class);
    }
}
