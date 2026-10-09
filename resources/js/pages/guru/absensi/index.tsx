import { Head, router } from '@inertiajs/react';
import { CheckCircle, XCircle, Clock, FileWarning, Trash2, UserCircle, BookOpen, Clock3, Calendar, Award, ImageUp, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/ui/searchable-select';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import absensi from '@/routes/guru/absensi';

interface Jurusan {
    id: number;
    nama_jurusan: string;
    singkatan: string;
}

interface Kelas {
    id: number;
    tingkat?: string | null;
    nama_kelas: string;
    full_nama_kelas?: string;
    jurusan: Jurusan | null;
}

interface MataPelajaran {
    id: number;
    nama_mapel: string;
    kategori: 'MPU' | 'KK';
}

interface Siswa {
    id: number;
    nis: string;
    nama: string;
    foto_url?: string | null;
    absensi: {
        id: number | null;
        status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'dispensasi';
        keterangan: string | null;
        bukti: string | null;
        waktu_mulai: string | null;
        waktu_selesai: string | null;
        is_copy?: boolean;
        source_guru_id?: number | null;
        source_mapel_id?: number | null;
        source_jam_ke?: string | null;
    } | null;
}

interface Schedule {
    id: number;
    waktu_mulai: string;
    waktu_selesai: string;
    jam_ke: number;
}

interface Props {
    kelasList: Kelas[];
    mataPelajarans: MataPelajaran[];
    filters: {
        kelas_id: string | null;
        mapel_id: string | null;
        jam_ke: string | null;
        waktu_mulai: string | null;
        waktu_selesai: string | null;
        tanggal: string;
    };
    siswas: Siswa[];
    schedules: Schedule[];
    meta?: {
        is_first_guru: boolean;
        has_submitted: boolean;
    };
    activeYear?: { tahun_awal: string; tahun_akhir: string; start: string; end: string } | null;
    isOutOfYear?: boolean;
}

function getInitialKeterangans(siswasList: Siswa[]): Record<number, string> {
    const initialKeterangans: Record<number, string> = {};

    if (siswasList && Array.isArray(siswasList)) {
        siswasList.forEach((s) => {
            if (s.absensi?.keterangan) {
                initialKeterangans[s.id] = s.absensi.keterangan;
            }
        });
    }

    return initialKeterangans;
}

export default function GuruAbsensiIndex({
    kelasList,
    mataPelajarans = [],
    filters,
    siswas = [],
    schedules = [],
    meta,
    activeYear,
    isOutOfYear,
}: Props) {
    const isFirstGuru = meta?.is_first_guru ?? true;
    const hasSubmitted = meta?.has_submitted ?? false;
    const [localSiswas, setLocalSiswas] = useState<Siswa[]>(siswas);
    const [keterangans, setKeterangans] = useState<Record<number, string>>(() =>
        getInitialKeterangans(siswas)
    );
    const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
    const [buktiFiles, setBuktiFiles] = useState<Record<number, File>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasDirty, setHasDirty] = useState(false);
    const [highlightMissingId, setHighlightMissingId] = useState<number | null>(null);
    const showKeterangan = localSiswas.some(s => s.absensi?.status === 'alpha');

    // Helper: scroll ke baris siswa yang belum lengkap (seperti edit di admin)
    const scrollToSiswa = (siswaId: number, options?: { focusKeterangan?: boolean }) => {
        // highlight baris
        setHighlightMissingId(siswaId);
        // scroll smooth ke tengah viewport
        requestAnimationFrame(() => {
            setTimeout(() => {
                const el = document.getElementById(`absensi-row-${siswaId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // flash ring biar jelas (pakai tailwind ring)
                    el.classList.add('ring-2', 'ring-destructive', 'ring-offset-1');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-destructive', 'ring-offset-1'), 2500);
                }
                if (options?.focusKeterangan) {
                    const input = document.getElementById(`keterangan-${siswaId}`) as HTMLInputElement | null;
                    input?.focus();
                }
            }, 80);
        });
        // auto clear highlight setelah 3 detik biar tidak permanen
        setTimeout(() => setHighlightMissingId((prev) => (prev === siswaId ? null : prev)), 3500);
    };
    const copiedCount = localSiswas.filter(s => s.absensi?.is_copy).length;

    // Sync dari server props -> local state (optimistic base) — jangan overwrite jika sedang dirty/bulk edit
    useEffect(() => {
        if (!hasDirty) {
            setLocalSiswas(siswas);
            setKeterangans(getInitialKeterangans(siswas));
            setBuktiFiles({});
        }
    }, [siswas, hasDirty]);

    const [showBuktiModal, setShowBuktiModal] = useState(false);
    const [pendingSiswaId, setPendingSiswaId] = useState<number | null>(null);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [buktiFile, setBuktiFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [buktiLoading, setBuktiLoading] = useState(false);
    const buktiInputRef = React.useRef<HTMLInputElement>(null);

    const [jamKeInput, setJamKeInput] = useState(filters.jam_ke || '');
    useEffect(() => {
        setJamKeInput(filters.jam_ke || '');
    }, [filters.jam_ke]);

    const isJamLocked = Boolean(filters.jam_ke && hasSubmitted);
    // 1 guru 1 hari: jika kelas & mapel sama seperti sebelumnya, jam otomatis ngikutin yang sebelumnya
    useEffect(() => {
        if (filters.kelas_id && filters.mapel_id && !filters.jam_ke && !jamKeInput) {
            const key = `lastJam:${filters.kelas_id}:${filters.mapel_id}:${filters.tanggal}`;
            try {
                const saved = localStorage.getItem(key);
                if (saved) {
                    setJamKeInput(saved);
                }
            } catch {}
        }
    }, [filters.kelas_id, filters.mapel_id, filters.tanggal, filters.jam_ke, jamKeInput]);

    const jamParts = jamKeInput.match(/\d+/g);
    const jams = jamParts ? jamParts.map(Number) : [];
    const minJam = jams.length > 0 ? Math.min(...jams) : null;
    const maxJam = jams.length > 0 ? Math.max(...jams) : null;

    const startSchedule = minJam !== null ? schedules.find((s) => s.jam_ke === minJam) : null;
    const endSchedule = maxJam !== null ? schedules.find((s) => s.jam_ke === maxJam) : null;

    const waktuMulaiInput = startSchedule?.waktu_mulai || filters.waktu_mulai || '';
    const waktuSelesaiInput = endSchedule?.waktu_selesai || filters.waktu_selesai || '';

    // Live-sync: guru 2 langsung lihat hasil guru 1, dan setelah Kirim/Update tetap tampil terbaru.
    // Pause hanya saat draft mengambang / modal bukti / sedang submit agar tidak overwrite input.
    const canPoll = !isOutOfYear && !hasDirty && !isSubmitting && !showBuktiModal && savingIds.size === 0 && Boolean(filters.kelas_id && filters.mapel_id && filters.jam_ke);
    useAutoRefresh(canPoll, 5000, ['siswas', 'meta', 'schedules']);

    // Langsung buka file chooser saat modal bukti muncul (tanpa perlu klik lagi di dalam modal)
    useEffect(() => {
        if (showBuktiModal && buktiInputRef.current && !previewUrl && !buktiFile) {
            const t = setTimeout(() => buktiInputRef.current?.click(), 150);
            return () => clearTimeout(t);
        }
    }, [showBuktiModal, previewUrl, buktiFile]);

    const recommendations = (() => {
        if (!jamKeInput || !filters.tanggal || !schedules.length) {
            return [];
        }

        const trimmed = jamKeInput.trim();
        const maxUrutan = Math.max(...schedules.map((s) => s.jam_ke));

        if (/^\d+$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);

            if (num >= 1 && num < maxUrutan) {
                const recs: string[] = [];

                for (let i = num + 1; i <= maxUrutan; i++) {
                    recs.push(`${num}-${i}`);
                }

                return recs;
            }
        }

        return [];
    })();

    const handleFilterChange = (key: keyof Props['filters'], value: string) => {
        const newFilters = { ...filters, [key]: value };

        if (key === 'kelas_id') {
            newFilters.mapel_id = '';
            newFilters.jam_ke = '';
        }

        router.get(
            absensi.index.url(),
            newFilters,
            { preserveState: true, preserveScroll: true },
        );
    };

    const applyTeachingDetails = () => {
        if (!filters.kelas_id || !filters.mapel_id) {
            toast.error('Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu.');

            return;
        }

        if (!jamKeInput.trim()) {
            toast.error('Silakan isi Jam Pembelajaran (contoh: 1-2).');

            return;
        }

        router.get(
            absensi.index.url(),
            {
                ...filters,
                jam_ke: jamKeInput,
                waktu_mulai: waktuMulaiInput,
                waktu_selesai: waktuSelesaiInput,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Auto-buka absen saat jam dipilih (tanpa tombol Terapkan)
    useEffect(() => {
        if (!filters.kelas_id || !filters.mapel_id) return;
        const trimmed = jamKeInput.trim();
        if (!trimmed) return;
        if (trimmed === (filters.jam_ke || '')) return;
        // Validasi minimal: harus ada angka
        if (!/\d/.test(trimmed)) return;
        const t = setTimeout(() => {
            router.get(
                absensi.index.url(),
                {
                    ...filters,
                    jam_ke: trimmed,
                    waktu_mulai: waktuMulaiInput,
                    waktu_selesai: waktuSelesaiInput,
                },
                { preserveState: true, preserveScroll: true }
            );
        }, 400);
        return () => clearTimeout(t);
    }, [jamKeInput, waktuMulaiInput, waktuSelesaiInput, filters.kelas_id, filters.mapel_id]);

    const isTransitionAllowedUI = (prev: string | null | undefined, next: string): boolean => {
        if (isFirstGuru) return true;
        if (!prev || prev === next) return true;
        if (prev === 'hadir' && ['sakit', 'izin', 'alpha', 'dispensasi'].includes(next)) return true;
        if (prev === 'alpha') return true; // ponytail: alpha bebas ke hadir/sakit/izin/dispen; sakit/izin/dispen terkunci
        return false;
    };

    const optimisticSetStatus = (siswaId: number, status: NonNullable<Siswa['absensi']>['status']) => {
        if (highlightMissingId === siswaId) {
            setHighlightMissingId(null);
        }
        setLocalSiswas((prev) =>
            prev.map((s) =>
                s.id === siswaId
                    ? {
                          ...s,
                          absensi: {
                              id: s.absensi?.id ?? null,
                              bukti: s.absensi?.bukti ?? null,
                              waktu_mulai: filters.waktu_mulai ?? s.absensi?.waktu_mulai ?? null,
                              waktu_selesai: filters.waktu_selesai ?? s.absensi?.waktu_selesai ?? null,
                              keterangan: keterangans[siswaId] ?? s.absensi?.keterangan ?? null,
                              status,
                              is_copy: false,
                              source_guru_id: s.absensi?.source_guru_id ?? null,
                              source_mapel_id: s.absensi?.source_mapel_id ?? null,
                              source_jam_ke: s.absensi?.source_jam_ke ?? null,
                          },
                      }
                    : s
            )
        );
        setHasDirty(true);
    };

    const applyDraftStatus = (siswaId: number, status: string) => {
        // Validasi mutasi di frontend untuk UX awal (backend tetap final)
        const siswa = localSiswas.find(s => s.id === siswaId);
        const prev = siswa?.absensi?.status;
        if (!isTransitionAllowedUI(prev, status)) {
            toast.error(`Perubahan ${prev} → ${status} tidak diizinkan untuk guru validasi.`);
            return;
        }
        optimisticSetStatus(siswaId, status as never);
    };

    const handleKeteranganChange = (siswaId: number, val: string) => {
        if (highlightMissingId === siswaId) {
            setHighlightMissingId(null);
        }
        setKeterangans(prev => ({ ...prev, [siswaId]: val }));
        setHasDirty(true);
    };

    const handleStatusClick = (siswaId: number, status: string) => {
        if (savingIds.has(siswaId) || isSubmitting) {
            return;
        }

        if (!filters.tanggal) {
            toast.error('Silakan pilih tanggal terlebih dahulu.');

            return;
        }

        if (!filters.mapel_id) {
            toast.error('Silakan pilih Mata Pelajaran.');

            return;
        }

        if (!filters.jam_ke) {
            toast.error('Silakan terapkan Jam Pembelajaran.');

            return;
        }

        // Validasi silang: cek aturan mutasi sebelum buka modal
        const siswa = localSiswas.find(s => s.id === siswaId);
        const prev = siswa?.absensi?.status;
        if (!isTransitionAllowedUI(prev, status)) {
            toast.error(`Status ${prev ? `'${prev}'` : 'kosong'} tidak dapat diubah menjadi '${status}' (aturan validasi silang).`);
            return;
        }

        if (['sakit', 'izin', 'dispensasi'].includes(status)) {
            setPendingSiswaId(siswaId);
            setPendingStatus(status);
            setBuktiFile(null);
            setPreviewUrl(null);
            setShowBuktiModal(true);

            return;
        }

        applyDraftStatus(siswaId, status);
    };

    const handleBuktiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file && !['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            toast.error('Format harus PNG atau JPG. Silakan pilih file .png/.jpg');
            e.target.value = '';
            setBuktiFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            return;
        }
        setBuktiFile(file);

        if (file) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
        }
    };

    const handleBuktiSubmit = () => {
        if (!pendingSiswaId || !pendingStatus) {
            return;
        }

        if (!buktiFile) {
            toast.error('Silakan pilih foto bukti terlebih dahulu.');

            return;
        }

        const siswaId = pendingSiswaId;
        const status = pendingStatus;
        // Simpan sebagai draft lokal, bukan langsung POST. Bukti disimpan di map untuk bulk submit
        setBuktiFiles(prev => ({ ...prev, [siswaId]: buktiFile }));
        optimisticSetStatus(siswaId, status as never);
        // Update bukti preview di localSiswas sudah via optimisticSet, tapi simpan file terpisah
        toast.success('Bukti ditambahkan (draft). Klik Kirim untuk menyimpan permanen.');
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        if (buktiInputRef.current) {
            buktiInputRef.current.value = '';
        }
        setShowBuktiModal(false);
        setPendingSiswaId(null);
        setPendingStatus(null);
        setBuktiFile(null);
        setPreviewUrl(null);
    };

    const handleBuktiCancel = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        // Jika batal setelah pilih foto untuk status yang butuh surat, pastikan tidak ada status/keterangan yang tertampil tanpa surat
        if (pendingSiswaId !== null && pendingStatus !== null) {
            const siswa = localSiswas.find((s) => s.id === pendingSiswaId);
            const currentStatus = siswa?.absensi?.status;
            const hasOldBukti = Boolean(siswa?.absensi?.bukti);
            const hasNewBukti = Boolean(buktiFiles[pendingSiswaId]);
            // Kasus 1: status sudah terlanjur optimistik (pernah Simpan sebelumnya atau bug) tapi tanpa bukti -> kosongkan
            if (currentStatus === pendingStatus && !hasOldBukti && !hasNewBukti) {
                setLocalSiswas((prev) => prev.map((s) => (s.id === pendingSiswaId ? { ...s, absensi: null } : s)));
                setKeterangans((prev) => {
                    const next = { ...prev };
                    delete next[pendingSiswaId];
                    return next;
                });
                setBuktiFiles((prev) => {
                    const next = { ...prev };
                    delete next[pendingSiswaId];
                    return next;
                });
            } else if (!currentStatus || currentStatus !== pendingStatus) {
                // Kasus 2: belum optimistik (modal baru dibuka) -> pastikan keterangan kosong agar tidak tertampil tanpa surat
                setKeterangans((prev) => {
                    const next = { ...prev };
                    if (siswa && !siswa.absensi?.keterangan) {
                        delete next[pendingSiswaId];
                    }
                    return next;
                });
            }
        }
        // reset file input value agar pilih ulang bisa trigger change
        if (buktiInputRef.current) {
            buktiInputRef.current.value = '';
        }
        setShowBuktiModal(false);
        setPendingSiswaId(null);
        setPendingStatus(null);
        setBuktiFile(null);
        setPreviewUrl(null);
    };

    // Legacy langsung POST dipertahankan untuk kompatibilitas, tapi utama pakai draft + bulk submit
    const submitAbsensi = (siswaId: number, status: string) => {
        applyDraftStatus(siswaId, status);
        toast.info('Status diubah (draft). Klik Kirim di pojok kanan bawah untuk menyimpan permanen.');
    };

    const submitKeterangan = (siswaId: number, status: string) => {
        // keterangan hanya draft sampai bulk submit
        setHasDirty(true);
        optimisticSetStatus(siswaId, status as never);
    };

    const handleBulkSubmit = () => {
        if (isOutOfYear) {
            toast.error(`Data tanggal ini telah diarsipkan ke Tahun Ajaran ${activeYear?.tahun_awal}/${activeYear?.tahun_akhir}.`);
            return;
        }
        if (!filters.kelas_id || !filters.mapel_id || !filters.tanggal || !filters.jam_ke) {
            toast.error('Lengkapi Kelas, Mapel, Tanggal dan Jam terlebih dahulu.');
            return;
        }
        if (localSiswas.length === 0) {
            toast.error('Tidak ada siswa untuk disimpan.');
            return;
        }

        // Sebelum submit data tidak akan tersimpan — validasi semua wajib terisi, lalu auto-gulir ke yang kosong (kaya edit di admin)
        const missingStatus = localSiswas.filter(s => !s.absensi?.status);
        if (missingStatus.length > 0) {
            const first = missingStatus[0];
            const idx = localSiswas.findIndex(s => s.id === first.id) + 1;
            toast.error(`Masih ada ${missingStatus.length} siswa belum diisi - ${first.nama} (No ${idx}).`);
            scrollToSiswa(first.id);
            return;
        }

        // Validasi bukti sebelum submit (jika invalid, jangan simpan, gulir ke baris terkait) — alpha keterangan opsional
        for (const s of localSiswas) {
            const status = s.absensi!.status;
            if (['sakit', 'izin', 'dispensasi'].includes(status)) {
                const hasOldBukti = Boolean(s.absensi?.bukti);
                const hasNewBukti = Boolean(buktiFiles[s.id]);
                if (!hasOldBukti && !hasNewBukti) {
                    toast.error(`Siswa ${s.nama} status ${status} wajib bukti PNG/JPG. Silakan unggah bukti.`);
                    scrollToSiswa(s.id);
                    return;
                }
            }
            // alpha: keterangan boleh diisi boleh tidak (opsional), tidak ada validasi wajib
        }

        const payload = localSiswas.map((s) => ({
            siswa_id: s.id,
            status: s.absensi!.status as string,
            keterangan: keterangans[s.id] ?? s.absensi?.keterangan ?? '',
            file: buktiFiles[s.id] ?? null,
        })) as Array<{siswa_id:number,status:string,keterangan:string,file:File|null}>;

        if (payload.length === 0) {
            toast.error('Belum ada status yang dipilih. Silakan tentukan kehadiran minimal satu siswa.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('kelas_id', filters.kelas_id);
        formData.append('mapel_id', filters.mapel_id);
        formData.append('tanggal', filters.tanggal);
        formData.append('jam_ke', filters.jam_ke);
        formData.append('waktu_mulai', filters.waktu_mulai || '');
        formData.append('waktu_selesai', filters.waktu_selesai || '');
        payload.forEach((p, idx) => {
            formData.append(`absensis[${idx}][siswa_id]`, String(p.siswa_id));
            formData.append(`absensis[${idx}][status]`, p.status);
            formData.append(`absensis[${idx}][keterangan]`, p.keterangan || '');
            if (p.file) {
                formData.append(`absensis[${idx}][bukti]`, p.file);
            }
        });

        router.post('/guru/absensi/bulk', formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Validasi kehadiran berhasil disimpan permanen ('+payload.length+' siswa).');
                setHasDirty(false);
                setHighlightMissingId(null);
                setBuktiFiles({});
                try {
                    const key = `lastJam:${filters.kelas_id}:${filters.mapel_id}:${filters.tanggal}`;
                    localStorage.setItem(key, filters.jam_ke);
                } catch {}
                // Reload untuk dapatkan data persistensi terbaru per guru
                (router.reload as unknown as (opts: Record<string, unknown>) => void)({ only: ['siswas', 'meta'], preserveScroll: true });
            },
            onError: (errors) => {
                const msg = Object.values(errors).flat().join('\n') || 'Gagal menyimpan validasi.';
                toast.error(msg);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDirectReset = (siswa: Siswa) => {
        if (!siswa.absensi) return;
        // Draft / copy (id null) -> reset lokal langsung tanpa konfirmasi
        if (siswa.absensi.is_copy || siswa.absensi.id === null) {
            setLocalSiswas((prev) => prev.map((s) => (s.id === siswa.id ? { ...s, absensi: null } : s)));
            setBuktiFiles((prev) => {
                const n = { ...prev };
                delete n[siswa.id];
                return n;
            });
            setKeterangans((prev) => {
                const n = { ...prev };
                delete n[siswa.id];
                return n;
            });
            setHasDirty(true);
            toast.success('Status berhasil dihapus.');
            return;
        }
        const absensiId = siswa.absensi.id as number;
        setSavingIds((prev) => new Set(prev).add(siswa.id));
        setLocalSiswas((prev) => prev.map((s) => (s.absensi?.id === absensiId ? { ...s, absensi: null } : s)));
        router.delete(absensi.destroy.url({ absensi: absensiId }), {
            preserveScroll: true,
            async: true,
            onSuccess: () => {
                toast.success('Status kehadiran berhasil direset.');
                setHasDirty(true);
            },
            onError: () => {
                (router.reload as unknown as (opts: Record<string, unknown>) => void)({ only: ['siswas', 'meta'], preserveScroll: true });
            },
            onFinish: () => {
                setSavingIds((prev) => {
                    const n = new Set(prev);
                    n.delete(siswa.id);
                    return n;
                });
                (router.reload as unknown as (opts: Record<string, unknown>) => void)({ only: ['siswas', 'meta'], preserveScroll: true, async: true });
            },
        });
    };

    const formatKelasName = (k: Kelas) => {
        if (k.full_nama_kelas) {
            return k.full_nama_kelas;
        }

        const parts: string[] = [];

        if (k.tingkat) {
            parts.push(k.tingkat);
        }

        if (k.jurusan?.singkatan) {
            parts.push(k.jurusan.singkatan);
        }

        parts.push(k.nama_kelas);

        return parts.join(' ');
    };

    return (
        <>
            <Head title="Pencatatan Kehadiran" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Pencatatan Kehadiran Siswa
                        </h1>
                        <p className="text-muted-foreground">
                            pilih kelas, mata pelajaran, dan jam pembelajaran untuk merekam kehadiran siswa
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
                    <div className="col-span-1 flex flex-col gap-6">
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border min-h-[260px] flex flex-col"><div className="mb-4"><h2 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Presensi
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Kelas</label>
                                    <SearchableSelect
                                        value={filters.kelas_id || ''}
                                        onValueChange={(val) =>
                                            handleFilterChange('kelas_id', val)
                                        }
                                        placeholder="Pilih Kelas..."
                                        items={kelasList.map(k => ({
                                            value: k.id.toString(),
                                            label: formatKelasName(k),
                                        }))}
                                    />
                                </div>

                                {filters.kelas_id && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <label className="text-sm font-medium">Mata Pelajaran</label>
                                        <SearchableSelect
                                            value={filters.mapel_id || ''}
                                            onValueChange={(val) =>
                                                handleFilterChange('mapel_id', val)
                                            }
                                            placeholder="Pilih Mata Pelajaran..."
                                            items={mataPelajarans.map((mapel) => ({
                                                value: mapel.id.toString(),
                                                label: `${mapel.nama_mapel} (${mapel.kategori})`,
                                            }))}
                                            className="w-full"
                                        />
                                        {mataPelajarans.length === 0 && (
                                            <p className="text-[11px] text-muted-foreground">Belum ada mapel relevan</p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tanggal</label>
                                    <Input
                                        type="date"
                                        value={filters.tanggal}
                                        className="bg-muted/30"
                                        min={activeYear?.start}
                                        max={activeYear?.end}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'tanggal',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {filters.kelas_id && filters.mapel_id && (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border min-h-[260px] flex flex-col animate-in fade-in duration-200">
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Clock3 className="h-4 w-4 text-primary" /> Jam Pembelajaran
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Jam Pembelajaran {isJamLocked && <span className="text-[11px] font-normal text-muted-foreground">(terkunci)</span>}</label>
                                        <Input
                                            value={jamKeInput}
                                            onChange={(e) => setJamKeInput(e.target.value)}
                                            placeholder="Ketik angka (contoh: 2)"
                                            className="bg-muted/30"
                                            readOnly={isJamLocked}
                                            disabled={isJamLocked}
                                        />
                                        {!isJamLocked && recommendations.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {recommendations.map((rec) => (
                                                    <Button
                                                        key={rec}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-[10px] px-2 py-0"
                                                        onClick={() => setJamKeInput(rec)}
                                                    >
                                                        {rec}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}

                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Waktu Mulai</label>
                                            <Input
                                                type="time"
                                                value={waktuMulaiInput}
                                                readOnly
                                                className="bg-muted/30 cursor-not-allowed opacity-80"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Waktu Selesai</label>
                                            <Input
                                                type="time"
                                                value={waktuSelesaiInput}
                                                readOnly
                                                className="bg-muted/30 cursor-not-allowed opacity-80"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
                        {filters.kelas_id && filters.mapel_id && filters.jam_ke ? (
                            <>
                            {isOutOfYear && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Data tanggal ini telah diarsipkan ke Tahun Ajaran {activeYear?.tahun_awal}/{activeYear?.tahun_akhir}. Lihat arsip di menu Arsip admin.</div>
                            )}
                            <div className="rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border overflow-hidden flex flex-col animate-in fade-in duration-200">
                                <div className="p-6 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col gap-3">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                                Daftar Siswa
                                                {hasSubmitted && <span className="ml-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">Tersimpan</span>}
                                            </h2>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {isFirstGuru ? 'Guru pertama — silakan absen. Klik status lalu Kirim.' : 'Data awal disalin dari guru sebelumnya.'} {hasDirty && <span className="text-amber-600 font-medium">• Perubahan belum disimpan</span>}
                                            </p>
                                        </div>
                                        <div className="flex flex-col text-xs text-muted-foreground md:text-right font-medium shrink-0 gap-1 bg-muted/40 p-3 rounded-lg border border-sidebar-border/70">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-primary" /> {filters.tanggal}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock3 className="h-3.5 w-3.5 text-primary" /> Jam Ke- {filters.jam_ke}
                                                {filters.waktu_mulai && ` (${filters.waktu_mulai} - ${filters.waktu_selesai || 'Selesai'})`}
                                            </div>
                                        </div>
                                    </div>
                                    {copiedCount > 0 && (
                                        <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 ring-1 ring-blue-600/20 flex items-center gap-2">
                                            <FileWarning className="h-3.5 w-3.5" />
                                            {copiedCount} siswa disalin dari guru sebelumnya. Silahkan validasi dan ubah jika perlu, lalu kirim
                                        </div>
                                    )}
                                    {!isFirstGuru && (
                                        <div className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-600/20">
                                            Aturan: Sakit/Izin/Dispensasi berlaku seharian dan tidak boleh diubah sembarangan (membutuhkan surat). Pengisian keterangan status Alfa bersifat opsional.
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            <tr>
                                                <th className="px-3 py-3 w-12 text-center">No</th>
                                                <th className="px-2 py-3 w-[72px] text-center whitespace-nowrap">NIS</th>
                                                <th className="px-6 py-4 min-w-[180px]">Nama Siswa</th>
                                                <th className={`px-6 py-4 ${showKeterangan ? 'min-w-[320px]' : 'min-w-[380px]'}`}>Status Kehadiran</th>
                                                {showKeterangan && <th className="px-6 py-4 min-w-[200px]">Keterangan</th>}
                                                <th className="px-6 py-4 text-right w-16">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                            {localSiswas.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={showKeterangan ? 6 : 5}
                                                        className="px-6 py-12 text-center text-muted-foreground"
                                                    >
                                                        <div className="flex flex-col items-center gap-2">
                                                            <UserCircle className="h-8 w-8 opacity-20" />
                                                            <p>Tidak ada siswa di kelas ini.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                localSiswas.map((siswa, index) => {
                                                    const isSaving = savingIds.has(siswa.id);
                                                    const isHighlighted = highlightMissingId === siswa.id;
                                                    return (
                                                    <tr key={siswa.id} id={`absensi-row-${siswa.id}`} className={`group transition-colors hover:bg-muted/30 scroll-mt-24 ${siswa.absensi ? 'bg-primary/5' : ''} ${isSaving ? 'opacity-60' : ''} ${isHighlighted ? '!bg-red-50 dark:!bg-red-950/30 ring-2 ring-destructive ring-inset' : ''} ${!siswa.absensi?.status && isHighlighted ? 'animate-pulse' : ''}`}>
                                                        <td className="px-3 py-3 text-center text-muted-foreground text-xs">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-2 py-3 font-mono text-[11px] font-medium whitespace-nowrap tracking-tight text-center">
                                                            {siswa.nis}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-foreground">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-sidebar-border/50">
                                                                    <AvatarImage src={siswa.foto_url ?? undefined} alt={siswa.nama} />
                                                                    <AvatarFallback className="bg-neutral-100 text-xs font-semibold text-neutral-600">
                                                                        {siswa.nama.slice(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    {siswa.nama}
                                                                    {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                <Button
                                                                    size="sm"
                                                                    disabled={isSaving || isSubmitting || !isTransitionAllowedUI(siswa.absensi?.status, 'hadir')}
                                                                    variant={siswa.absensi?.status === 'hadir' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'hadir' ? 'bg-emerald-600 hover:bg-emerald-700 h-8 text-[11px] px-2.5' : 'hover:border-emerald-600 hover:text-emerald-600 bg-background/50 h-8 text-[11px] px-2.5 disabled:opacity-40'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'hadir')}
                                                                >
                                                                    <CheckCircle className="mr-1 h-3.5 w-3.5" /> Hadir
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={isSaving || isSubmitting || !isTransitionAllowedUI(siswa.absensi?.status, 'sakit')}
                                                                    variant={siswa.absensi?.status === 'sakit' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'sakit' ? 'bg-blue-600 hover:bg-blue-700 h-8 text-[11px] px-2.5' : 'hover:border-blue-600 hover:text-blue-600 bg-background/50 h-8 text-[11px] px-2.5 disabled:opacity-40'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'sakit')}
                                                                >
                                                                    <Clock className="mr-1 h-3.5 w-3.5" /> Sakit{siswa.absensi?.bukti && siswa.absensi?.status === 'sakit' && <ImageUp className="ml-1 h-3 w-3" />}{buktiFiles[siswa.id] && siswa.absensi?.status === 'sakit' && <span className="ml-1 text-[9px]">•</span>}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={isSaving || isSubmitting || !isTransitionAllowedUI(siswa.absensi?.status, 'izin')}
                                                                    variant={siswa.absensi?.status === 'izin' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'izin' ? 'bg-orange-600 hover:bg-orange-700 h-8 text-[11px] px-2.5' : 'hover:border-orange-600 hover:text-orange-600 bg-background/50 h-8 text-[11px] px-2.5 disabled:opacity-40'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'izin')}
                                                                >
                                                                    <FileWarning className="mr-1 h-3.5 w-3.5" /> Izin{siswa.absensi?.bukti && siswa.absensi?.status === 'izin' && <ImageUp className="ml-1 h-3 w-3" />}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={isSaving || isSubmitting || !isTransitionAllowedUI(siswa.absensi?.status, 'dispensasi')}
                                                                    variant={siswa.absensi?.status === 'dispensasi' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'dispensasi' ? 'bg-indigo-600 hover:bg-indigo-700 h-8 text-[11px] px-2.5' : 'hover:border-indigo-600 hover:text-indigo-600 bg-background/50 h-8 text-[11px] px-2.5 disabled:opacity-40'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'dispensasi')}
                                                                >
                                                                    <Award className="mr-1 h-3.5 w-3.5" /> Dispensasi{siswa.absensi?.bukti && siswa.absensi?.status === 'dispensasi' && <ImageUp className="ml-1 h-3 w-3" />}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={isSaving || isSubmitting || !isTransitionAllowedUI(siswa.absensi?.status, 'alpha')}
                                                                    variant={siswa.absensi?.status === 'alpha' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'alpha' ? 'bg-red-600 hover:bg-red-700 h-8 text-[11px] px-2.5' : 'hover:border-red-600 hover:text-red-600 bg-background/50 h-8 text-[11px] px-2.5 disabled:opacity-40'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'alpha')}
                                                                >
                                                                    <XCircle className="mr-1 h-3.5 w-3.5" /> Alfa
                                                                </Button>
                                                            </div>
                                                        </td>
                                                        {showKeterangan && (
                                                            <td className="px-6 py-4">
                                                                {siswa.absensi?.status === 'alpha' ? (
                                                                    <Input
                                                                        id={`keterangan-${siswa.id}`}
                                                                        placeholder="keterangan..."
                                                                        value={keterangans[siswa.id] || ''}
                                                                        onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                                                                        className="h-8 bg-muted/30"
                                                                        disabled={isSaving}
                                                                        onBlur={() => {
                                                                            if (siswa.absensi && siswa.absensi.keterangan !== keterangans[siswa.id]) {
                                                                                submitKeterangan(siswa.id, 'alpha');
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">-</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 text-right">
                                                            {siswa.absensi && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={isSaving}
                                                                    onClick={() => handleDirectReset(siswa)}
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                    title="Hapus / Reset"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                    <Button
                                        onClick={handleBulkSubmit}
                                        disabled={isSubmitting || localSiswas.length === 0}
                                        className="gap-2 rounded-xl bg-card px-6 h-9 text-sm font-medium text-foreground border border-sidebar-border/70 shadow-sm hover:bg-accent hover:text-accent-foreground"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                        {isSubmitting ? 'Menyimpan...' : hasSubmitted ? 'Perbarui' : 'Kirim'}
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            <Dialog open={showBuktiModal} onOpenChange={(open) => {
  if (!open) {
handleBuktiCancel();
}
}}>
                <DialogContent className="sm:max-w-[380px] w-[92vw] max-h-[85vh] bg-transparent border-none shadow-none p-2 [&>button]:hidden">
                    <div className="bg-card rounded-xl px-2 py-3 shadow-2xl flex flex-col gap-3 relative max-w-full">
                        <DialogHeader className="sm:text-center p-0">
                            <DialogTitle className="w-full text-center">Upload Bukti Foto</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-3">
                            {previewUrl ? (
                                <div className="flex w-auto max-w-[320px] justify-center rounded-lg border border-sidebar-border/70 bg-muted/10 p-1.5 mx-auto">
                                    <img
                                        src={previewUrl}
                                        alt="Preview bukti"
                                        className="max-h-60 max-w-full object-contain rounded"
                                    />
                                </div>
                            ) : (
                                <label className="flex w-auto min-w-[200px] max-w-[280px] h-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-sidebar-border/70 bg-muted/20 px-6 mx-auto cursor-pointer hover:bg-muted/40 transition-colors">
                                    <ImageUp className="h-5 w-5 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">Format PNG/JPG.</span>

                                    <input
                                        ref={buktiInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        className="hidden"
                                        onChange={handleBuktiFileChange}
                                    />
                                </label>
                            )}
                        </div>
                        <div className="flex justify-center gap-2 pt-1">
                            <Button variant="outline" onClick={handleBuktiCancel} disabled={buktiLoading}>
                                Batal
                            </Button>
                            <Button onClick={handleBuktiSubmit} disabled={!buktiFile || buktiLoading}>
                                {buktiLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                                    </>
                                ) : (
                                    'Simpan'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

GuruAbsensiIndex.layout = {
    breadcrumbs: [
        { title: 'Guru', href: absensi.index.url() },
        { title: 'Input Presensi', href: absensi.index.url() },
    ],
};
