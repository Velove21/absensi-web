<?php

namespace Database\Seeders;

use App\Models\JenjangKelas;
use App\Models\Jurusan;
use App\Models\Kelas;
use Illuminate\Database\Seeder;

class KelasSeeder extends Seeder
{
    public function run(): void
    {
        $kelasList = [
            'X DPIB A',
            'X DPIB B',
            'X PPLG A',
            'X PPLG B',
            'X TE A',
            'X TE B',
            'X TE C',
            'X GEO',
            'X TKL A',
            'X TKL B',
            'X TJKT A',
            'X TJKT B',
            'X TJKT C',
            'X TKP',
            'X TM A',
            'X TM B',
            'X TM C',
            'X TM D',
            'X TO A',
            'X TO B',
            'X TO C',
            'X TO D',
            'X TPFL',
            'XI DPIB A',
            'XI DPIB B',
            'XI PPLG A',
            'XI PPLG B',
            'XI TE A',
            'XI TE B',
            'XI TE C',
            'XI GEO',
            'XI TKL A',
            'XI TKL B',
            'XI TJKT A',
            'XI TJKT B',
            'XI TJKT C',
            'XI TKP',
            'XI TM A',
            'XI TM B',
            'XI TM C',
            'XI TM D',
            'XI TO A',
            'XI TO B',
            'XI TO C',
            'XI TO D',
            'XI TPFL',
            'XII DPIB A',
            'XII DPIB B',
            'XII PPLG A',
            'XII PPLG B',
            'XII TE A',
            'XII TE B',
            'XII TE C',
            'XII GEO',
            'XII TKL A',
            'XII TKL B',
            'XII TJKT A',
            'XII TJKT B',
            'XII TJKT C',
            'XII TKP',
            'XII TM A',
            'XII TM B',
            'XII TM C',
            'XII TM D',
            'XII TO A',
            'XII TO B',
            'XII TO C',
            'XII TO D',
            'XII TPFL',
            'XIII TPFL',

        ];

        $jurusanMap = Jurusan::pluck('id', 'singkatan')->toArray();
        $jenjangMap = [];

        foreach ($kelasList as $kelasString) {
            $parts = explode(' ', $kelasString);
            $tingkat = $parts[0];
            $singkatan = $parts[1];
            $nama_kelas = isset($parts[2]) ? $parts[2] : '';

            // Find or create JenjangKelas
            if (! isset($jenjangMap[$tingkat])) {
                $jenjang = JenjangKelas::firstOrCreate([
                    'nama_jenjang' => $tingkat,
                ]);
                $jenjangMap[$tingkat] = $jenjang->id;
            }

            if (isset($jurusanMap[$singkatan])) {
                Kelas::updateOrCreate([
                    'jurusan_id' => $jurusanMap[$singkatan],
                    'jenjang_kelas_id' => $jenjangMap[$tingkat],
                    'nama_kelas' => $nama_kelas,
                ]);
            }
        }
    }
}
