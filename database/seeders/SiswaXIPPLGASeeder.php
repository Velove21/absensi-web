<?php

namespace Database\Seeders;

use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SiswaXIPPLGASeeder extends Seeder
{
    public function run(): void
    {
        $kelas = Kelas::all()->filter(fn ($k) => $k->full_nama_kelas == 'XI PPLG A')->first();

        if (! $kelas) {
            $this->command->error('Kelas XI PPLG A tidak ditemukan.');

            return;
        }

        $siswaData = [
            ['24.012472', 'ADIB DIABI'],
            ['24.012473', 'ADRIAN FARELA PUTRA'],
            ['24.012474', 'AHMAD YULIANTO ASHARI'],
            ['24.012475', 'ALFIAN DAFARI'],
            ['24.012476', 'ANINDYA IVANA SALSABILA'],
            ['24.012477', 'ARFAN MUHAMMAD ASFAR ARROYAN'],
            ['24.012478', 'AUDINA DESHIFA NURANI'],
            ['24.012479', 'AYUDYA WIDI IBNATY'],
            ['24.012480', 'BAYU ADI SETYAWAN'],
            ['24.012481', 'CHALISA MELVIN AZZAHWAH'],
            ['24.012482', 'DANISWARA NAYAKA INDRASTATA'],
            ['24.012483', 'DIARA NINDYA AJENG KIRANA'],
            ['24.012484', 'DIAZT MUHAMMAD FIRMANSYAH'],
            ['24.012485', 'ERNESIA MAHIRA PUTRI'],
            ['24.012486', 'FADLAN KHOIRUL ANNAM'],
            ['24.012487', 'FINO ERZA ATTA ARIELLA'],
            ['24.012488', 'HANUNG SATYA ADI WICAKSONO'],
            ['24.012489', 'HUBERT HENRY PUTRA WIJANARKO'],
            ['24.012490', 'HUMAM ZADA NAHARI'],
            ['24.012491', 'IRSYADUDDIN NUR WAHID'],
            ['24.012492', 'KEISHA KIRANA LARASATI'],
            ['24.012493', 'MARCELL DIMAS SAPUTRA'],
            ['24.012494', 'MOCH ALDO YUFAN MAHENDRA'],
            ['24.012495', 'MUHAMMAD FAREL'],
            ['24.012496', 'MUHAMMAD RAJAH AJI GUSTI FIRDAUS'],
            ['24.012497', 'NABILLA RATRI KHOIRUNNISA'],
            ['24.012498', 'NAUFAL AZZAM HANANTA'],
            ['24.012499', 'NUR PRABOWO'],
            ['24.012500', 'PRACANDA ARGA SAVA NAYOTTAMA'],
            ['24.012501', 'RIDHO ALHASAN'],
            ['24.012502', 'SALMA BASALAMAH'],
            ['24.012503', 'SATRIO WIBOWO SEKTIAJI PUTRA'],
            ['24.012504', 'TOMY ANWAR MUSTOFA'],
            ['24.012505', 'VELOVE AZALIA PUTRI FEBRIANTO'],
            ['24.012506', 'VIVIAN NYSSA LUCIDA'],
            ['24.012507', 'ZAIDAN HISYAM AL-BATATI'],
        ];

        foreach ($siswaData as $data) {
            $nis = $data[0];
            $nama = $data[1];

            // Create User
            $user = User::updateOrCreate(
                ['username' => $nis],
                [
                    'name' => $nama,
                    'email' => strtolower(str_replace([' ', '.', '-'], '', $nama)).'@siswa.com',
                    'password' => Hash::make('password'),
                    'role' => 'siswa',
                ]
            );

            // Create Siswa
            Siswa::updateOrCreate(
                ['nis' => $nis],
                [
                    'user_id' => $user->id,
                    'kelas_id' => $kelas->id,
                    'nama' => $nama,
                ]
            );
        }

        $this->command->info('Data siswa XI PPLG A berhasil di-seed.');
    }
}
