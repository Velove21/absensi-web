<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\DurasiPembelajaran;
use App\Models\Kelas;
use App\Models\Schedule;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    public function index(Request $request)
    {
        $guruAuth = $request->user()->guru;
        $kelas = $guruAuth ? $guruAuth->kelas()->with(['jurusan', 'jenjangKelas'])->get() : Kelas::with(['jurusan', 'jenjangKelas'])->get();

        $selectedKelasId = $request->query('kelas_id');
        $selectedMapelId = $request->query('mapel_id');
        $jamKe = $request->query('jam_ke');
        $waktuMulai = $request->query('waktu_mulai');
        $waktuSelesai = $request->query('waktu_selesai');
        $tanggal = $request->query('tanggal', now()->toDateString());

        $siswas = [];
        $mataPelajarans = [];
        $schedules = collect();
        $isFirstGuru = true;
        $hasSubmitted = false;

        if ($selectedKelasId) {
            $selectedKelas = Kelas::findOrFail($selectedKelasId);
            $guru = $request->user()->guru;

            $mataPelajarans = $guru ? $guru->mataPelajarans()->with('kategoriPembelajaran')->get() : collect([]);

            if ($selectedMapelId && $jamKe) {
                $rawSiswas = Siswa::where('kelas_id', $selectedKelasId)
                    ->with(['foto', 'absensis' => function ($query) use ($tanggal, $selectedMapelId, $jamKe, $guru) {
                        $query->where('tanggal', $tanggal)
                            ->where('mapel_id', $selectedMapelId)
                            ->where('jam_ke', $jamKe);
                        if ($guru) {
                            $query->where('guru_id', $guru->id);
                        }
                        $query->orderBy('updated_at', 'desc');
                    }])
                    ->get();

                $hasSubmitted = $rawSiswas->contains(fn ($s) => $s->absensis->isNotEmpty());

                $isFirstGuru = true;
                if ($guru) {
                    $otherExists = Absensi::where('tanggal', $tanggal)
                        ->where('guru_id', '!=', $guru->id)
                        ->whereHas('siswa', fn ($q) => $q->where('kelas_id', $selectedKelasId))
                        ->exists();
                    $isFirstGuru = ! $otherExists;
                }

                $missingIds = $rawSiswas->filter(fn ($s) => $s->absensis->isEmpty())->pluck('id');
                $fallbackMap = collect();
                if ($missingIds->isNotEmpty() && ! $isFirstGuru) {
                    $fallbacks = Absensi::whereIn('siswa_id', $missingIds)
                        ->where('tanggal', $tanggal)
                        ->whereHas('siswa', fn ($q) => $q->where('kelas_id', $selectedKelasId))
                        ->orderBy('updated_at', 'desc')
                        ->get()
                        ->groupBy('siswa_id');

                    foreach ($fallbacks as $sid => $group) {
                        $fallbackMap[$sid] = $group->first();
                    }
                }

                $siswas = $rawSiswas->map(function ($siswa) use ($fallbackMap) {
                    $absensi = $siswa->absensis->first();
                    if (! $absensi && $fallbackMap->has($siswa->id)) {
                        $fb = $fallbackMap->get($siswa->id);

                        return [
                            'id' => $siswa->id,
                            'nis' => $siswa->nis,
                            'nama' => $siswa->nama,
                            'foto_url' => $siswa->foto_url,
                            'absensi' => [
                                'id' => null,
                                'status' => $fb->status,
                                'keterangan' => $fb->keterangan,
                                'bukti' => $fb->bukti,
                                'waktu_mulai' => $fb->waktu_mulai,
                                'waktu_selesai' => $fb->waktu_selesai,
                                'is_copy' => true,
                                'source_guru_id' => $fb->guru_id,
                                'source_mapel_id' => $fb->mapel_id,
                                'source_jam_ke' => $fb->jam_ke,
                            ],
                        ];
                    }

                    return [
                        'id' => $siswa->id,
                        'nis' => $siswa->nis,
                        'nama' => $siswa->nama,
                        'foto_url' => $siswa->foto_url,
                        'absensi' => $absensi ? [
                            'id' => $absensi->id,
                            'status' => $absensi->status,
                            'keterangan' => $absensi->keterangan,
                            'bukti' => $absensi->bukti,
                            'waktu_mulai' => $absensi->waktu_mulai,
                            'waktu_selesai' => $absensi->waktu_selesai,
                            'is_copy' => false,
                            'source_guru_id' => null,
                            'source_mapel_id' => null,
                            'source_jam_ke' => null,
                        ] : null,
                    ];
                })->values()->all();
            }

            $dayName = Schedule::indonesianDayName($tanggal);
            $schedules = DurasiPembelajaran::where('hari', $dayName)->orderBy('jam_ke')->get();
        }

        return Inertia::render('guru/absensi/index', [
            'kelasList' => $kelas,
            'mataPelajarans' => $mataPelajarans,
            'schedules' => $schedules,
            'filters' => [
                'kelas_id' => $selectedKelasId,
                'mapel_id' => $selectedMapelId,
                'jam_ke' => $jamKe,
                'waktu_mulai' => $waktuMulai,
                'waktu_selesai' => $waktuSelesai,
                'tanggal' => $tanggal,
            ],
            'siswas' => $siswas,
            'meta' => [
                'is_first_guru' => $isFirstGuru,
                'has_submitted' => $hasSubmitted,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'siswa_id' => 'required|exists:siswas,id',
            'mapel_id' => 'required|exists:mata_pelajarans,id',
            'tanggal' => 'required|date',
            'jam_ke' => 'required|string|max:50',
            'waktu_mulai' => 'nullable|string|max:10',
            'waktu_selesai' => 'nullable|string|max:10',
            'status' => 'required|in:hadir,sakit,izin,alpha,dispensasi',
            'keterangan' => 'nullable|string|max:255',
            'bukti' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:10240',
        ];

        $existingAny = Absensi::where([
            'siswa_id' => $request->siswa_id,
            'mapel_id' => $request->mapel_id,
            'tanggal' => $request->tanggal,
            'jam_ke' => $request->jam_ke,
        ])->first();

        if (in_array($request->input('status'), ['sakit', 'izin', 'dispensasi']) && ! $existingAny) {
            $rules['bukti'] = 'required|file|mimes:jpg,jpeg,png,webp|max:10240';
        }

        $validated = $request->validate($rules);

        $guru = $request->user()->guru;
        if (! $guru) {
            return back()->with('error', 'Profil Guru tidak ditemukan.');
        }

        $myDispensasi = Absensi::where([
            'siswa_id' => $validated['siswa_id'],
            'mapel_id' => $validated['mapel_id'],
            'tanggal' => $validated['tanggal'],
            'jam_ke' => $validated['jam_ke'],
            'guru_id' => $guru->id,
            'status' => 'dispensasi',
        ])->first();

        $data = [
            'guru_id' => $guru->id,
            'waktu_mulai' => $validated['waktu_mulai'],
            'waktu_selesai' => $validated['waktu_selesai'],
            'status' => $validated['status'],
            'keterangan' => $validated['keterangan'] ?? null,
        ];

        $hasBukti = $request->hasFile('bukti');
        if ($hasBukti) {
            $file = $request->file('bukti');
            $originalName = $file->getClientOriginalName();
            $originalSize = $file->getSize();
            $mimeType = $file->getMimeType();

            if ($originalSize > 2 * 1024 * 1024) {
                $data['bukti'] = $this->compressImage($file, 'bukti');
            } else {
                $data['bukti'] = $file->store('bukti', 'public');
            }
        }

        if ($myDispensasi && $validated['status'] !== 'dispensasi') {
            $myDispensasi->delete();
        }

        $absensi = Absensi::updateOrCreate(
            [
                'siswa_id' => $validated['siswa_id'],
                'mapel_id' => $validated['mapel_id'],
                'tanggal' => $validated['tanggal'],
                'jam_ke' => $validated['jam_ke'],
                'guru_id' => $guru->id,
            ],
            $data
        );

        if ($hasBukti) {
            $file = $request->file('bukti');
            $absensi->photos()->create([
                'file_path' => $data['bukti'],
                'original_name' => $originalName ?? $file->getClientOriginalName(),
                'file_size' => $originalSize ?? $file->getSize(),
                'mime_type' => $mimeType ?? $file->getMimeType(),
                'compressed' => $originalSize > 2 * 1024 * 1024,
                'compressed_size' => $originalSize > 2 * 1024 * 1024 ? Storage::disk('public')->size($data['bukti']) : null,
            ]);
        }

        return back()->with('success', 'Status kehadiran berhasil disimpan.');
    }

    public function bulkStore(Request $request)
    {
        $guru = $request->user()->guru;
        if (! $guru) {
            return back()->with('error', 'Profil Guru tidak ditemukan.');
        }

        $validated = $request->validate([
            'kelas_id' => 'required|exists:kelas,id',
            'mapel_id' => 'required|exists:mata_pelajarans,id',
            'tanggal' => 'required|date',
            'jam_ke' => 'required|string|max:50',
            'waktu_mulai' => 'nullable|string|max:10',
            'waktu_selesai' => 'nullable|string|max:10',
            'absensis' => 'required|array|min:1',
            'absensis.*.siswa_id' => 'required|exists:siswas,id',
            'absensis.*.status' => 'required|in:hadir,sakit,izin,alpha,dispensasi',
            'absensis.*.keterangan' => 'nullable|string|max:255',
            'absensis.*.bukti' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $count = 0;
        foreach ($validated['absensis'] as $idx => $item) {
            $siswaId = $item['siswa_id'];
            $status = $item['status'];
            $keterangan = $item['keterangan'] ?? null;
            $file = $request->file("absensis.$idx.bukti");

            $siswa = Siswa::find($siswaId);
            if (! $siswa) {
                continue;
            }

            $existing = Absensi::where([
                'siswa_id' => $siswaId,
                'mapel_id' => $validated['mapel_id'],
                'tanggal' => $validated['tanggal'],
                'jam_ke' => $validated['jam_ke'],
                'guru_id' => $guru->id,
            ])->first();

            $data = [
                'guru_id' => $guru->id,
                'waktu_mulai' => $validated['waktu_mulai'],
                'waktu_selesai' => $validated['waktu_selesai'],
                'status' => $status,
                'keterangan' => $keterangan,
            ];

            if ($file) {
                $originalName = $file->getClientOriginalName();
                $originalSize = $file->getSize();
                $mimeType = $file->getMimeType();
                if ($originalSize > 2 * 1024 * 1024) {
                    $data['bukti'] = $this->compressImage($file, 'bukti');
                } else {
                    $data['bukti'] = $file->store('bukti', 'public');
                }
            } elseif (in_array($status, ['sakit', 'izin', 'dispensasi'])) {
                if ($existing?->bukti) {
                    $data['bukti'] = $existing->bukti;
                } else {
                    // Validasi oleh guru B/C/D: jika tidak upload bukti baru, pertahankan surat dari guru sebelumnya (jangan hapus)
                    $prevBukti = Absensi::where('siswa_id', $siswaId)
                        ->where('tanggal', $validated['tanggal'])
                        ->whereNotNull('bukti')
                        ->whereIn('status', ['sakit', 'izin', 'dispensasi'])
                        ->orderBy('updated_at', 'desc')
                        ->orderBy('id', 'desc')
                        ->value('bukti');
                    if ($prevBukti) {
                        $data['bukti'] = $prevBukti;
                    }
                }
            }

            // Hapus dispensasi lama jika diganti
            if ($existing && $existing->status === 'dispensasi' && $status !== 'dispensasi') {
                // akan di-overwrite
            }

            $absensi = Absensi::updateOrCreate(
                [
                    'siswa_id' => $siswaId,
                    'mapel_id' => $validated['mapel_id'],
                    'tanggal' => $validated['tanggal'],
                    'jam_ke' => $validated['jam_ke'],
                    'guru_id' => $guru->id,
                ],
                $data
            );

            if (isset($originalName) && isset($data['bukti']) && $file) {
                $absensi->photos()->create([
                    'file_path' => $data['bukti'],
                    'original_name' => $originalName,
                    'file_size' => $originalSize,
                    'mime_type' => $mimeType,
                    'compressed' => $originalSize > 2 * 1024 * 1024,
                    'compressed_size' => $originalSize > 2 * 1024 * 1024 ? Storage::disk('public')->size($data['bukti']) : null,
                ]);
            }

            $count++;
            // reset for next iteration
            unset($originalName, $originalSize, $mimeType);
        }

        return back()->with('success', "Berhasil menyimpan $count data absensi.");
    }

    private function compressImage(UploadedFile $file, string $directory): string
    {
        $sourceImage = match ($file->getClientOriginalExtension()) {
            'jpg', 'jpeg' => @imagecreatefromjpeg($file->getRealPath()),
            'png' => @imagecreatefrompng($file->getRealPath()),
            'webp' => @imagecreatefromwebp($file->getRealPath()),
            default => null,
        };

        if (! $sourceImage) {
            return $file->store($directory, 'public');
        }

        $maxWidth = 1920;
        $origWidth = imagesx($sourceImage);
        $origHeight = imagesy($sourceImage);

        if ($origWidth <= $maxWidth) {
            $compressedPath = $file->store($directory, 'public');

            if (Storage::disk('public')->exists($compressedPath)) {
                $fullPath = Storage::disk('public')->path($compressedPath);
                $this->recompressExisting($fullPath, $file->getClientOriginalExtension());
            }

            imagedestroy($sourceImage);

            return $compressedPath;
        }

        $ratio = $maxWidth / $origWidth;
        $newWidth = $maxWidth;
        $newHeight = (int) round($origHeight * $ratio);

        $resizedImage = imagecreatetruecolor($newWidth, $newHeight);

        if ($file->getClientOriginalExtension() === 'png') {
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
        }

        imagecopyresampled($resizedImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

        $tempPath = tempnam(sys_get_temp_dir(), 'absensi_').'.'.$file->getClientOriginalExtension();

        match ($file->getClientOriginalExtension()) {
            'jpg', 'jpeg' => imagejpeg($resizedImage, $tempPath, 80),
            'png' => imagepng($resizedImage, $tempPath, 8),
            'webp' => imagewebp($resizedImage, $tempPath, 80),
            default => null,
        };

        imagedestroy($sourceImage);
        imagedestroy($resizedImage);

        $uploadedFile = new UploadedFile(
            $tempPath,
            $file->getClientOriginalName(),
            $file->getClientMimeType(),
            UPLOAD_ERR_OK,
            true
        );

        $storedPath = $uploadedFile->store($directory, 'public');

        @unlink($tempPath);

        return $storedPath;
    }

    private function recompressExisting(string $filePath, string $extension): void
    {
        $image = match ($extension) {
            'jpg', 'jpeg' => @imagecreatefromjpeg($filePath),
            'png' => @imagecreatefrompng($filePath),
            'webp' => @imagecreatefromwebp($filePath),
            default => null,
        };

        if (! $image) {
            return;
        }

        match ($extension) {
            'jpg', 'jpeg' => imagejpeg($image, $filePath, 80),
            'png' => imagepng($image, $filePath, 8),
            'webp' => imagewebp($image, $filePath, 80),
            default => null,
        };

        imagedestroy($image);
    }

    public function destroy(string $id)
    {
        $absensi = Absensi::findOrFail($id);

        $user = request()->user();
        if ($user->role !== 'admin' && ($user->guru && $absensi->guru_id !== $user->guru->id)) {
            return back()->with('error', 'Tidak berhak menghapus absensi ini.');
        }

        $absensi->delete();

        return back()->with('success', 'Status kehadiran berhasil direset.');
    }
}
