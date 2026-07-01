<?php

namespace Database\Seeders;

use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SiswaXITMASeeder extends Seeder
{
    public function run(): void
    {
        $kelas = Kelas::all()->filter(fn ($k) => $k->full_nama_kelas === 'XI TM A')->first();

        if (! $kelas) {
            $this->command->error('Kelas XI TM A tidak ditemukan.');

            return;
        }

        $siswaData = [
            ['24.012088', "ABU MUHAMMAD 'URWAH"],
            ['24.012089', 'ADITIYA RESTU SETIYA WARDHANU'],
            ['24.012090', 'ADITYA MAULANA RIZKI'],
            ['24.012091', 'ALVIN VANDIEGO NUR ROHMANSYAH'],
            ['24.012092', 'ANGGORO WINMA AZIZ SAPUTRO'],
            ['24.012093', 'ARCO ARDIYANTO'],
            ['24.012094', 'ARDYYANSYAH DEVVA BAGUS SAPUTRA'],
            ['24.012095', 'ARIF WICAKSONO'],
            ['24.012096', 'ASTAKUSUMA RAKAIHAN PRASETYA'],
            ['24.012097', 'CALLEA NABILA MAYVIYANT'],
            ['24.012098', 'CHRISTIAN DEVANO BRAMASTA PUTRA'],
            ['24.012099', 'DAVINDRA RHYO RAHLIL'],
            ['24.012100', 'FITRAH ADITYA PRATAMA'],
            ['24.012101', 'GHEOFANY CAHYO SAPUTRA'],
            ['24.012102', 'HAFIDZ AKBAR MUMTAZ'],
            ['24.012103', 'KRISTIANTO REYSHATOPO'],
            ['24.012104', 'MAHESA FIRDAUS MUBENI'],
            ['24.012105', 'MAHESWARA FARREL GHAZALI PURWANTO'],
            ['24.012106', 'MARCEL PUTRA SATRYA NUR QAMAR'],
            ['24.012107', 'MUHAMMAD ADNAN RIZKY RAMADHAN'],
            ['24.012108', 'MUHAMMAD CHANDRA HAFIZ PAHLEVI'],
            ['24.012109', "MUHAMMAD DANANG RIFA'I"],
            ['24.012110', 'MUHAMMAD FAREL RISQI MULADI'],
            ['24.012111', 'MUHAMMAD FAUZIY MAHFUDH'],
            ['24.012112', 'NOVAL ADLIANSA'],
            ['24.012113', 'NOVAL ANDREANO'],
            ['24.012114', 'ORYZA ILMIRA'],
            ['24.012116', 'RADHITYA ARYA YODHA WARDHANA'],
            ['24.012117', 'RAIHAN HAFIDZ'],
            ['24.012118', 'REYSA BAGAS DEWANTORO'],
            ['24.012119', 'SAFERO LUCKY ARVA UTAMA'],
            ['24.012120', 'SEPTIAN TEGAR WIBISONO'],
            ['24.012121', 'STEVE YON ARDITYA'],
            ['24.012122', 'ULUNG MULYA GATI'],
            ['24.012123', 'YUSUF HAMDANI'],
        ];

        foreach ($siswaData as $data) {
            $nis = $data[0];
            $nama = $data[1];

            $user = User::updateOrCreate(
                ['username' => $nis],
                [
                    'name' => $nama,
                    'email' => strtolower(str_replace([' ', '.', '-', "'"], '', $nama)).'@siswa.com',
                    'password' => Hash::make('password'),
                    'role' => 'siswa',
                ]
            );

            Siswa::updateOrCreate(
                ['nis' => $nis],
                [
                    'user_id' => $user->id,
                    'kelas_id' => $kelas->id,
                    'nama' => $nama,
                ]
            );
        }

        $this->command->info('Data siswa XI TM A berhasil di-seed.');
    }
}
