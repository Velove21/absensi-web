<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\DurasiPembelajaran;
use App\Models\Kelas;
use App\Models\Schedule;
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DataAbsensiController extends Controller
{
    public function index(Request $request)
    {
        $selectedKelasId = $request->query('kelas_id');
        $tanggal = $request->query('tanggal', now()->toDateString());
        $berhalanganHadir = $request->query('berhalangan_hadir') === 'true';

        $active = TahunAjaran::where('is_active', true)->first();
        $activeYear = null;
        $isOutOfYear = false;
        if ($active) {
            try {
                $s = Carbon::create((int) $active->tahun_awal, 7, 1)->format('Y-m-d');
                $e = Carbon::create((int) $active->tahun_akhir, 6, 30)->format('Y-m-d');
                $activeYear = ['tahun_awal' => $active->tahun_awal, 'tahun_akhir' => $active->tahun_akhir, 'start' => $s, 'end' => $e];
                $isOutOfYear = ! TahunAjaran::isDateInActiveYear($tanggal);
            } catch (\Throwable $ex) {
            }
        }

        // Universal: semua guru dapat lihat semua kelas (read-only) - per kelas 1 data 1 hari
        $kelasList = Kelas::with(['jurusan', 'jenjangKelas'])->orderBy('id')->get();

        $absensis = [];
        $stats = ['hadir' => 0, 'sakit' => 0, 'izin' => 0, 'alpha' => 0, 'dispensasi' => 0];
        $schedules = collect();
        $jamAktif = null;
        $guruAktif = null;

        if ($selectedKelasId && $tanggal && ! $isOutOfYear) {
            $dayName = Schedule::indonesianDayName($tanggal);
            $schedules = DurasiPembelajaran::where('hari', $dayName)->orderBy('jam_ke')->get();

            // Tentukan jam aktif berdasarkan waktu sekarang jika tanggal adalah hari ini
            if ($tanggal === now()->toDateString()) {
                $now = now()->format('H:i:s');
                $jamAktif = $schedules->first(function ($j) use ($now) {
                    return $j->waktu_mulai <= $now && $now <= $j->waktu_selesai;
                });
            }

            $query = Absensi::with(['siswa.kelas.jurusan', 'siswa.kelas.jenjangKelas', 'siswa.foto', 'guru', 'mapel.kategoriPembelajaran'])
                ->whereHas('siswa', function ($q) use ($selectedKelasId) {
                    $q->where('kelas_id', $selectedKelasId)
                        ->where('is_alumni', false);
                })
                ->where('tanggal', $tanggal)
                ->orderBy('updated_at', 'desc')
                ->orderBy('id', 'desc');

            if ($berhalanganHadir) {
                $query->whereIn('status', ['sakit', 'izin', 'alpha', 'dispensasi']);
            }

            $raw = $query->get();

            // Gabungkan per siswa: status Sakit/Izin/Dispensasi/Alpha berlaku seharian, jadi jangan biarkan Hadir di jam selanjutnya menimpa surat sebelumnya.
            // Ambil data terbaru per siswa dengan merge bukti: pilih baris berhalangan terbaru jika ada, dan pertahankan bukti terbaru seharian.
            $grouped = $raw->groupBy('siswa_id');
            $latestPerSiswa = $grouped->map(function ($group) {
                // Urutkan grup dari terbaru (updated_at desc, id desc)
                $sorted = $group->sort(function ($a, $b) {
                    $ta = $a->updated_at ? $a->updated_at->getTimestamp() : 0;
                    $tb = $b->updated_at ? $b->updated_at->getTimestamp() : 0;
                    if ($ta === $tb) {
                        return $b->id <=> $a->id;
                    }

                    return $tb <=> $ta;
                })->values();

                // Prioritas: baris berhalangan (sakit/izin/dispensasi/alpha) berlaku seharian mengalahkan Hadir
                $berhalangan = $sorted->first(function ($item) {
                    return in_array($item->status, ['sakit', 'izin', 'dispensasi', 'alpha'], true);
                });
                $primary = $berhalangan ?? $sorted->first();
                if (! $primary) {
                    return null;
                }

                // Preserve bukti: jika primary tidak punya bukti, ambil bukti terbaru dari grup (dari guru/jam mana pun) agar surat tidak hilang
                if (empty($primary->bukti)) {
                    $latestBukti = $sorted->first(function ($item) {
                        return ! empty($item->bukti);
                    });
                    if ($latestBukti) {
                        $primary->setAttribute('bukti', $latestBukti->bukti);
                        // Jika primary Hadir tapi bukti berasal dari berhalangan, tetap tampilkan status berhalangan tersebut
                        // (sudah ter-handle karena primary dipilih dari berhalangan). Jika primary berhalangan tanpa bukti,
                        // bukti dari record lain tetap ditampilkan.
                    }
                }

                // Preserve keterangan untuk Alpha jika kosong
                if ($primary->status === 'alpha' && empty(trim((string) $primary->keterangan))) {
                    $withKet = $sorted->first(function ($item) {
                        return $item->status === 'alpha' && ! empty(trim((string) $item->keterangan));
                    });
                    if ($withKet) {
                        $primary->setAttribute('keterangan', $withKet->keterangan);
                    }
                }

                return $primary;
            })->filter()->values();

            // Urutkan dari absen: sesuai no urut/NIS di admin (jangan diubah), pakai NIS string natural order, fallback ke id
            $latestPerSiswa = $latestPerSiswa->sortBy(function ($a) {
                $nis = trim((string) ($a->siswa?->nis ?? ''));
                if ($nis !== '') {
                    return $nis;
                }

                return sprintf('%08d', $a->siswa_id);
            }, SORT_NATURAL)->values();

            // Hitung stats dari latest per siswa (seperti statistik admin)
            foreach ($latestPerSiswa as $abs) {
                if (isset($stats[$abs->status])) {
                    $stats[$abs->status]++;
                }
            }

            // Jika ada jam aktif, cari guru aktif (guru terakhir yang update pada jam tersebut)
            // Waktu update: waktu guru terakhir mengabsen (submit) untuk kelas ini, bukan waktu user buka halaman
            if ($jamAktif) {
                $guruAktifRecord = $raw->firstWhere('jam_ke', (string) $jamAktif->jam_ke);
                if ($guruAktifRecord && $guruAktifRecord->guru) {
                    $guruAktif = [
                        'id' => $guruAktifRecord->guru->id,
                        'nama' => $guruAktifRecord->guru->nama,
                        'jam_ke' => $jamAktif->jam_ke,
                        'waktu' => substr($jamAktif->waktu_mulai, 0, 5).' - '.substr($jamAktif->waktu_selesai, 0, 5),
                        'updated_at' => $guruAktifRecord->updated_at ? $guruAktifRecord->updated_at->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : null,
                    ];
                } else {
                    // Jika jam aktif tapi belum ada yang absen di jam itu, fallback ke update terakhir overall
                    $lastUpdateJam = $latestPerSiswa->sortByDesc('updated_at')->first();
                    if ($lastUpdateJam) {
                        $guruAktif = [
                            'id' => $lastUpdateJam->guru?->id,
                            'nama' => $lastUpdateJam->guru?->nama,
                            'jam_ke' => $lastUpdateJam->jam_ke,
                            'waktu' => $lastUpdateJam->waktu_mulai && $lastUpdateJam->waktu_selesai ? substr($lastUpdateJam->waktu_mulai, 0, 5).' - '.substr($lastUpdateJam->waktu_selesai, 0, 5) : substr($jamAktif->waktu_mulai, 0, 5).' - '.substr($jamAktif->waktu_selesai, 0, 5),
                            'updated_at' => $lastUpdateJam->updated_at ? $lastUpdateJam->updated_at->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : null,
                        ];
                    } else {
                        $guruAktif = [
                            'id' => null,
                            'nama' => null,
                            'jam_ke' => $jamAktif->jam_ke,
                            'waktu' => substr($jamAktif->waktu_mulai, 0, 5).' - '.substr($jamAktif->waktu_selesai, 0, 5),
                            'updated_at' => null,
                        ];
                    }
                }
            } else {
                // Fallback: guru terakhir yang melakukan update (overall) untuk indikator
                $lastUpdate = $latestPerSiswa->sortByDesc('updated_at')->first();
                if ($lastUpdate) {
                    $guruAktif = [
                        'id' => $lastUpdate->guru?->id,
                        'nama' => $lastUpdate->guru?->nama,
                        'jam_ke' => $lastUpdate->jam_ke,
                        'waktu' => $lastUpdate->waktu_mulai && $lastUpdate->waktu_selesai ? substr($lastUpdate->waktu_mulai, 0, 5).' - '.substr($lastUpdate->waktu_selesai, 0, 5) : null,
                        'updated_at' => $lastUpdate->updated_at ? $lastUpdate->updated_at->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : null,
                    ];
                }
            }

            $absensis = $latestPerSiswa->map(function ($absensi) {
                $siswa = $absensi->siswa;
                $kelas = $siswa?->kelas;

                return [
                    'id' => $absensi->id,
                    'siswa_id' => $absensi->siswa_id,
                    'mapel_id' => $absensi->mapel_id,
                    'tanggal' => $absensi->tanggal,
                    'jam_ke' => $absensi->jam_ke,
                    'waktu_mulai' => $absensi->waktu_mulai,
                    'waktu_selesai' => $absensi->waktu_selesai,
                    'status' => $absensi->status,
                    'keterangan' => $absensi->keterangan,
                    'bukti' => $absensi->bukti,
                    'updated_at' => $absensi->updated_at ? $absensi->updated_at->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : null,
                    'created_at' => $absensi->created_at ? $absensi->created_at->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : null,
                    'siswa' => $siswa ? [
                        'id' => $siswa->id,
                        'nis' => $siswa->nis,
                        'nama' => $siswa->nama,
                        'foto_url' => $siswa->foto_url,
                    ] : null,
                    'kelas' => $kelas ? [
                        'id' => $kelas->id,
                        'nama_kelas' => $kelas->nama_kelas,
                        'full_nama_kelas' => $kelas->full_nama_kelas,
                    ] : null,
                    'mapel' => $absensi->mapel ? [
                        'id' => $absensi->mapel->id,
                        'nama_mapel' => $absensi->mapel->nama_mapel,
                        'kategori' => $absensi->mapel->kategori ?? $absensi->mapel->kategoriPembelajaran?->nama_kategori ?? '-',
                    ] : null,
                    'guru' => $absensi->guru ? [
                        'id' => $absensi->guru->id,
                        'nama' => $absensi->guru->nama,
                    ] : null,
                ];
            })->values()->all();

            // Fallback jika tidak ada absensi tapi ingin menampilkan daftar siswa dengan status kosong
            // Untuk universal view, jika belum ada mapel filter, tetap tampilkan stats 0 dan list kosong
        }

        return Inertia::render('guru/absensi/data', [
            'kelasList' => $kelasList,
            'filters' => [
                'kelas_id' => $selectedKelasId,
                'tanggal' => $tanggal,
                'berhalangan_hadir' => $berhalanganHadir,
            ],
            'absensis' => $absensis,
            'stats' => $stats,
            'schedules' => $schedules,
            'jamAktif' => $jamAktif,
            'guruAktif' => $guruAktif,
            'activeYear' => $activeYear,
            'isOutOfYear' => $isOutOfYear,
        ]);
    }
}
