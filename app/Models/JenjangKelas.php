<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nama_jenjang'])]
class JenjangKelas extends Model
{
    protected $table = 'jenjang_kelas';

    /**
     * Get the kelas for this jenjang.
     */
    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class);
    }
}
