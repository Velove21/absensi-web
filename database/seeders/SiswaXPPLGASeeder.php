<?php

namespace Database\Seeders;

use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SiswaXPPLGASeeder extends Seeder
{
    public function run(): void
    {
        $kelas = Kelas::all()->filter(fn ($k) => $k->full_nama_kelas === 'X PPLG A')->first();

        if (! $kelas) {
            $this->command->error('Kelas X PPLG A tidak ditemukan.');

            return;
        }

        $siswaData = [
            ['25.013001', 'ADITYA PRATAMA PUTRA'],
            ['25.013002', 'AULIA RAHMA SARI'],
            ['25.013003', 'BAGAS ARYA SAPUTRA'],
            ['25.013004', 'BELLA SAFIRA ANGGRAINI'],
            ['25.013005', 'CAHYA NINGRUM'],
            ['25.013006', 'DENI SETIAWAN'],
            ['25.013007', 'DEVINA AULIA PUTRI'],
            ['25.013008', 'DIMAS ARYA WICAKSANA'],
            ['25.013009', 'EKA SAPUTRI'],
            ['25.013010', 'FARHAN ADITYA NUGRAHA'],
            ['25.013011', 'FATHIA ZAHRA NABILA'],
            ['25.013012', 'GILANG RAMADHAN'],
            ['25.013013', 'HANIF AKBAR MAULANA'],
            ['25.013014', 'INDAH PERMATA SARI'],
            ['25.013015', 'IRFAN MAULANA HAKIM'],
            ['25.013016', 'JESSICA AURELIA PRAMESWARI'],
            ['25.013017', 'KEVIN ARDIANSYAH'],
            ['25.013018', 'LINTANG AYU PRATIWI'],
            ['25.013019', 'LUTFI HAKIM SAPUTRA'],
            ['25.013020', 'MAULANA RIZKI ANANDA'],
            ['25.013021', 'MELATI DWI ANGGRAINI'],
            ['25.013022', 'MUHAMMAD ALFIAN HIDAYAT'],
            ['25.013023', 'NADIA PUTRI LESTARI'],
            ['25.013024', 'NAUFAL FAUZAN HAKIM'],
            ['25.013025', 'NURUL AISYAH'],
            ['25.013026', 'OKTAVIAN SYAH PUTRA'],
            ['25.013027', 'RAHMA DWI LESTARI'],
            ['25.013028', 'RAISYA NABILA AZ-ZAHRA'],
            ['25.013029', 'RANDY PRASETYO'],
            ['25.013030', 'REZA ADITYA FIRMANSYAH'],
            ['25.013031', 'RIZKY ANANDA PRATAMA'],
            ['25.013032', 'SALSA BILA AZZAHRA'],
            ['25.013033', 'SATYA ADI NUGROHO'],
            ['25.013034', 'TIARA AYU WULANDARI'],
            ['25.013035', 'YOGA PRATAMA WIJAYA'],
            ['25.013036', 'ZAHRA NUR AULIA'],
        ];

        foreach ($siswaData as $data) {
            [$nis, $nama] = $data;

            $user = User::updateOrCreate(
                ['username' => $nis],
                [
                    'name' => $nama,
                    'email' => strtolower(str_replace([' ', '.', '-', "'"], '', $nama)).'@siswa.com',
                    'password' => Hash::make('password'),
                    'role' => 'siswa',
                    'password_default' => true,
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

        $this->command->info('Data siswa X PPLG A (36) berhasil di-seed.');
    }
}
