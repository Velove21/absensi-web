<?php

namespace Database\Seeders;

use App\Models\KategoriPembelajaran;
use App\Models\MataPelajaran;
use Illuminate\Database\Seeder;

class MataPelajaranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjects = [
            'Pendidikan Agama dan Budi Pekerti',
            'Pendidikan Pancasila',
            'Bahasa Indonesia',
            'Matematika',
            'Sejarah',
            'Bahasa Inggris',
            'Seni Budaya',
            'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
            'Informatika',
            'Projek Penguatan Profil Pelajar Pancasila (P5)',
        ];

        $kategori = KategoriPembelajaran::firstOrCreate(
            ['kode' => 'MPU'],
            ['nama_kategori' => 'Mata Pelajaran Umum']
        );

        foreach ($subjects as $subject) {
            MataPelajaran::firstOrCreate([
                'nama_mapel' => $subject,
                'kategori_pembelajaran_id' => $kategori->id,
            ]);
        }
    }
}
