<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['hari', 'jam_ke', 'waktu_mulai', 'waktu_selesai'])]
class DurasiPembelajaran extends Model
{
    protected $table = 'durasi_pembelajarans';
}
