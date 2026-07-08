<?php

namespace Database\Seeders;

use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SiswaXIDPIBBSeeder extends Seeder
{
    public function run(): void
    {
        $kelas = Kelas::all()->filter(fn ($k) => $k->full_nama_kelas === 'XI DPIB B')->first();

        if (! $kelas) {
            $this->command->error('Kelas XI DPIB B tidak ditemukan.');

            return;
        }

        $siswaData = [
            ['24.011872', 'ALFIAN MUHAMMAD DZULFA'],
            ['24.011873', 'ANGGORO GAZA LINTANG MANGKULUHUR'],
            ['24.011874', 'AULIA FAUZIAH'],
            ['24.011875', 'AUREL RICHELLE YUSNANTO'],
            ['24.011876', 'AYUDIA MAHARANI'],
            ['24.011877', 'BAGAS APRIARTA'],
            ['24.011878', 'BINTANG HAMI MURSYADAD'],
            ['24.011879', 'CALLISTA CORRY ANDAYANI'],
            ['24.011880', 'EKA DESTYA MAHARANI'],
            ['24.011881', 'FARREL ARDIANSYAH'],
            ['24.011882', 'FERLICIA ANGELIA ITADA'],
            ['24.011883', 'FRAN\'S ANGGARA PRAYOGA'],
            ['24.011884', 'JELITA ARUM FEBRIANA'],
            ['24.011885', 'JUANG AGBIANO RISKY SAMUDRA'],
            ['24.011886', 'KYLA FERIL ANASTASA'],
            ['24.011887', 'MAHESH TIBRA EL FURQON'],
            ['24.011888', 'MOSES YUGOS STEFANO'],
            ['24.011889', 'MUHAMMAD GUNTUR SAPUTRO'],
            ['24.011890', 'NABILA ALIYA HUWAIDATU SHOLEHA'],
            ['24.011891', 'NIKEISHA ARISTA ESTININGTYAS'],
            ['24.011892', 'NINDYA SATRIYA UTAMA'],
            ['24.011893', 'PRISCILA CAHYA SHELOMITA'],
            ['24.011894', 'PUTRI NUR SAFITRI'],
            ['24.011895', 'QEISSA RAZZAQ ANANTA'],
            ['24.011896', 'RACHEL ANANDITA MASSAHID'],
            ['24.011897', 'RAFE FAITH LUTFHI'],
            ['24.011898', 'RENNO EXZA JAYA ERLANGGA'],
            ['24.011899', 'REVIAN DEVA SAPUTRO'],
            ['24.011900', 'SAMUDRA ARYA WICAKSANA PUTRA BUDIASTUTI'],
            ['24.011901', 'SASHY PUTRI KAILA RAHARJO'],
            ['24.011902', 'SHELLYO JOVAN SANTOSO'],
            ['24.011903', 'SHOFINA NUUR AULIA LATHIFA'],
            ['24.011904', 'STEVANUS VANO SEBASTIAN'],
            ['24.011905', 'TECTONA HARSANA PUTRA'],
            ['24.011906', 'TSAFIR MAHMUD'],
            ['24.011907', 'YAZKI IBRAHIM'],
        ];

        foreach ($siswaData as $data) {
            $nis = $data[0];
            $nama = $data[1];

            $user = User::updateOrCreate(
                ['username' => $nis],
                [
                    'name' => $nama,
                    'email' => strtolower(str_replace([' ', '.', '-'], '', $nama)).'@siswa.com',
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

        $this->command->info('Data siswa XI DPIB B berhasil di-seed.');
    }
}
