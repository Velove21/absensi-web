<?php

namespace Database\Seeders;

use App\Models\Jurusan;
use Illuminate\Database\Seeder;

class JurusanSeeder extends Seeder
{
    public function run(): void
    {
        $jurusans = [
            ['nama_jurusan' => 'Desain Pemodelan dan Informasi Bangunan', 'singkatan' => 'DPIB'],
            ['nama_jurusan' => 'Pengembangan Perangkat Lunak dan GIM', 'singkatan' => 'PPLG'],
            ['nama_jurusan' => 'Teknik Elektronika', 'singkatan' => 'TE'],
            ['nama_jurusan' => 'Geomatika', 'singkatan' => 'GEO'],
            ['nama_jurusan' => 'Teknik Ketenagalistrikan', 'singkatan' => 'TKL'],
            ['nama_jurusan' => 'Teknik Jaringan Komputer dan Telekomunikasi', 'singkatan' => 'TJKT'],
            ['nama_jurusan' => 'Teknik Konstruksi dan Perumahan', 'singkatan' => 'TKP'],
            ['nama_jurusan' => 'Teknik Mesin', 'singkatan' => 'TM'],
            ['nama_jurusan' => 'Teknik Otomotif', 'singkatan' => 'TO'],
            ['nama_jurusan' => 'Teknik Pengelasan dan Fabrikasi Logam', 'singkatan' => 'TPFL'],
        ];

        foreach ($jurusans as $jurusan) {
            Jurusan::updateOrCreate(['singkatan' => $jurusan['singkatan']], $jurusan);
        }
    }
}
