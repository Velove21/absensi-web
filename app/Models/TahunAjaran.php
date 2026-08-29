<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['tahun_awal', 'tahun_akhir', 'is_active'])]
class TahunAjaran extends Model
{
    protected $table = 'tahun_ajarans';
}
