<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['tahun_awal', 'tahun_akhir', 'is_active'])]
class TahunAjaran extends Model
{
    protected $table = 'tahun_ajarans';

    public function arsipPresensis(): HasMany
    {
        return $this->hasMany(ArsipPresensi::class);
    }
}
