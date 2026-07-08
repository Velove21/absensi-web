import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import absensi from '@/routes/guru/absensi';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import SearchableSelect from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, FileWarning, Trash2, UserCircle, BookOpen, Clock3, Calendar, Award, ImageUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
    absensi: {
        id: number;
        status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'dispensasi';
        keterangan: string | null;
        bukti: string | null;
        waktu_mulai: string | null;
        waktu_selesai: string | null;
    } | null;
}

interface Schedule {
    id: number;
    waktu_mulai: string;
    waktu_selesai: string;
    urutan: number;
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
}

export default function GuruAbsensiIndex({
    kelasList,
    mataPelajarans = [],
    filters,
    siswas = [],
    schedules = [],
}: Props) {
    const [keterangans, setKeterangans] = useState<Record<number, string>>({});
    const [deletingAbsensiId, setDeletingAbsensiId] = useState<number | null>(null);

    const [showBuktiModal, setShowBuktiModal] = useState(false);
    const [pendingSiswaId, setPendingSiswaId] = useState<number | null>(null);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [buktiFile, setBuktiFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [buktiLoading, setBuktiLoading] = useState(false);

    const [jamKeInput, setJamKeInput] = useState(filters.jam_ke || '');
    const [waktuMulaiInput, setWaktuMulaiInput] = useState(filters.waktu_mulai || '');
    const [waktuSelesaiInput, setWaktuSelesaiInput] = useState(filters.waktu_selesai || '');
    const [recommendations, setRecommendations] = useState<string[]>([]);

    useEffect(() => {
        const initialKeterangans: Record<number, string> = {};
        if (siswas && Array.isArray(siswas)) {
            siswas.forEach((s) => {
                if (s.absensi?.keterangan) {
                    initialKeterangans[s.id] = s.absensi.keterangan;
                }
            });
        }
        setKeterangans(initialKeterangans);
    }, [siswas]);

    useEffect(() => {
        setJamKeInput(filters.jam_ke || '');
        setWaktuMulaiInput(filters.waktu_mulai || '');
        setWaktuSelesaiInput(filters.waktu_selesai || '');
    }, [filters.jam_ke, filters.waktu_mulai, filters.waktu_selesai]);

    useEffect(() => {
        if (!jamKeInput || !filters.tanggal || !schedules.length) return;

        const jamParts = jamKeInput.match(/\d+/g);
        if (!jamParts || jamParts.length === 0) return;

        const jams = jamParts.map(Number);
        const minJam = Math.min(...jams);
        const maxJam = Math.max(...jams);

        const startSchedule = schedules.find(s => s.urutan === minJam);
        const endSchedule = schedules.find(s => s.urutan === maxJam);

        if (startSchedule) {
            setWaktuMulaiInput(startSchedule.waktu_mulai);
        }

        if (endSchedule) {
            setWaktuSelesaiInput(endSchedule.waktu_selesai);
        }
    }, [jamKeInput, filters.tanggal, schedules]);

    useEffect(() => {
        if (!jamKeInput || !filters.tanggal || !schedules.length) {
            setRecommendations([]);
            return;
        }

        const trimmed = jamKeInput.trim();
        const maxUrutan = Math.max(...schedules.map(s => s.urutan));

        if (/^\d+$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);
            if (num >= 1 && num < maxUrutan) {
                const recs: string[] = [];
                for (let i = num + 1; i <= maxUrutan; i++) {
                    recs.push(`${num}-${i}`);
                }
                setRecommendations(recs);
            } else {
                setRecommendations([]);
            }
        } else {
            setRecommendations([]);
        }
    }, [jamKeInput, filters.tanggal, schedules]);

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

    const handleKeteranganChange = (siswaId: number, val: string) => {
        setKeterangans(prev => ({ ...prev, [siswaId]: val }));
    };

    const handleStatusClick = (siswaId: number, status: string) => {
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

        if (['sakit', 'izin', 'dispensasi'].includes(status)) {
            setPendingSiswaId(siswaId);
            setPendingStatus(status);
            setBuktiFile(null);
            setPreviewUrl(null);
            setShowBuktiModal(true);
            return;
        }

        submitAbsensi(siswaId, status);
    };

    const handleBuktiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setBuktiFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleBuktiSubmit = () => {
        if (!pendingSiswaId || !pendingStatus) return;
        if (!buktiFile) {
            toast.error('Silakan pilih foto bukti terlebih dahulu.');
            return;
        }
        setBuktiLoading(true);

        const formData = new FormData();
        formData.append('siswa_id', pendingSiswaId.toString());
        formData.append('mapel_id', filters.mapel_id!);
        formData.append('tanggal', filters.tanggal);
        formData.append('jam_ke', filters.jam_ke || '');
        formData.append('waktu_mulai', filters.waktu_mulai || '');
        formData.append('waktu_selesai', filters.waktu_selesai || '');
        formData.append('status', pendingStatus);
        formData.append('keterangan', keterangans[pendingSiswaId] || '');
        formData.append('bukti', buktiFile);

        router.post(absensi.store.url(), formData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Status kehadiran berhasil disimpan.');
                setShowBuktiModal(false);
                setPendingSiswaId(null);
                setPendingStatus(null);
                setBuktiFile(null);
                setPreviewUrl(null);
                setBuktiLoading(false);
            },
            onError: () => {
                setBuktiLoading(false);
            },
        });
    };

    const handleBuktiCancel = () => {
        setShowBuktiModal(false);
        setPendingSiswaId(null);
        setPendingStatus(null);
        setBuktiFile(null);
        setPreviewUrl(null);
    };

    const submitAbsensi = (siswaId: number, status: string) => {
        router.post(
            absensi.store.url(),
            {
                siswa_id: siswaId,
                mapel_id: filters.mapel_id,
                tanggal: filters.tanggal,
                jam_ke: filters.jam_ke,
                waktu_mulai: filters.waktu_mulai,
                waktu_selesai: filters.waktu_selesai,
                status: status,
                keterangan: keterangans[siswaId] || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Status kehadiran berhasil disimpan.');
                },
            },
        );
    };

    const submitKeterangan = (siswaId: number, status: string) => {
        router.post(
            absensi.store.url(),
            {
                siswa_id: siswaId,
                mapel_id: filters.mapel_id,
                tanggal: filters.tanggal,
                jam_ke: filters.jam_ke,
                waktu_mulai: filters.waktu_mulai,
                waktu_selesai: filters.waktu_selesai,
                status: status,
                keterangan: keterangans[siswaId] || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Keterangan berhasil diperbarui.');
                },
            },
        );
    };

    const executeReset = () => {
        if (!deletingAbsensiId) return;
        router.delete(
            absensi.destroy.url({ absensi: deletingAbsensiId }),
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Status kehadiran berhasil direset.');
                    setDeletingAbsensiId(null);
                },
                onError: () => setDeletingAbsensiId(null),
            },
        );
    };

    const formatKelasName = (k: Kelas) => {
        if (k.full_nama_kelas) return k.full_nama_kelas;

        const parts: string[] = [];
        if (k.tingkat) parts.push(k.tingkat);
        if (k.jurusan?.singkatan) parts.push(k.jurusan.singkatan);
        parts.push(k.nama_kelas);
        return parts.join(' ');
    };

    return (
        <>
            <Head title="Pencatatan Kehadiran" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Pencatatan Kehadiran Siswa
                    </h1>
                    <p className="text-muted-foreground">
                        Pilih kelas, mata pelajaran, dan waktu belajar untuk merekam kehadiran siswa.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="col-span-1 space-y-6">
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" /> Presensi
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
                                        <Select
                                            value={filters.mapel_id || ''}
                                            onValueChange={(val) =>
                                                handleFilterChange('mapel_id', val)
                                            }
                                        >
                                            <SelectTrigger className="bg-muted/30">
                                                <SelectValue placeholder="Pilih Mata Pelajaran..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mataPelajarans.map((mapel) => (
                                                    <SelectItem
                                                        key={mapel.id}
                                                        value={mapel.id.toString()}
                                                    >
                                                        {mapel.nama_mapel} ({mapel.kategori})
                                                    </SelectItem>
                                                ))}
                                                {mataPelajarans.length === 0 && (
                                                    <SelectItem value="none" disabled>
                                                        Belum ada mapel relevan
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tanggal</label>
                                    <Input
                                        type="date"
                                        value={filters.tanggal}
                                        className="bg-muted/30"
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'tanggal',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        {schedules.length > 0
                                            ? `Jadwal aktif: ${schedules.map(s => 'Jam ' + s.urutan).join(', ')}`
                                            : 'Tidak ada jadwal untuk tanggal ini.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {filters.kelas_id && filters.mapel_id && (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border animate-in fade-in duration-200">
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Clock3 className="h-4 w-4 text-primary" /> Jam Pembelajaran
                                    </h2>
                                    <p className="text-xs text-muted-foreground">Pilih jam pelajaran sesuai jadwal yang aktif.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Jam Pembelajaran</label>
                                        <Input
                                            value={jamKeInput}
                                            onChange={(e) => setJamKeInput(e.target.value)}
                                            placeholder="Ketik angka (contoh: 2)"
                                            className="bg-muted/30"
                                        />
                                        {recommendations.length > 0 && (
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

                                    <Button
                                        onClick={applyTeachingDetails}
                                        className="w-full mt-2"
                                    >
                                        Terapkan dan Buka Absen
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                        {filters.kelas_id && filters.mapel_id && filters.jam_ke ? (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border overflow-hidden flex flex-col animate-in fade-in duration-200">
                                <div className="p-6 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            Daftar Siswa
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Klik status untuk menandai kehadiran.
                                        </p>
                                    </div>
                                    <div className="flex flex-col text-xs text-muted-foreground md:text-right font-medium shrink-0 gap-1 bg-muted/40 p-3 rounded-lg border border-sidebar-border/70">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-primary" /> {filters.tanggal}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock3 className="h-3.5 w-3.5 text-primary" /> Jam {filters.jam_ke}
                                            {filters.waktu_mulai && ` (${filters.waktu_mulai} - ${filters.waktu_selesai || 'Selesai'})`}
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 w-12 text-center">No</th>
                                                <th className="px-6 py-4 w-24">NIS</th>
                                                <th className="px-6 py-4 min-w-[180px]">Nama Siswa</th>
                                                <th className="px-6 py-4 min-w-[320px]">Status Kehadiran</th>
                                                <th className="px-6 py-4 min-w-[200px]">Keterangan</th>
                                                <th className="px-6 py-4 text-right w-16">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                            {siswas.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-6 py-12 text-center text-muted-foreground"
                                                    >
                                                        <div className="flex flex-col items-center gap-2">
                                                            <UserCircle className="h-8 w-8 opacity-20" />
                                                            <p>Tidak ada siswa di kelas ini.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                siswas.map((siswa, index) => (
                                                    <tr key={siswa.id} className={`group transition-colors hover:bg-muted/30 ${siswa.absensi ? 'bg-primary/5' : ''}`}>
                                                        <td className="px-6 py-4 text-center text-muted-foreground">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs font-medium">
                                                            {siswa.nis}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-foreground">
                                                            {siswa.nama}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                <Button
                                                                    size="sm"
                                                                    variant={siswa.absensi?.status === 'hadir' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'hadir' ? 'bg-emerald-600 hover:bg-emerald-700 h-8 text-[11px] px-2.5' : 'hover:border-emerald-600 hover:text-emerald-600 bg-background/50 h-8 text-[11px] px-2.5'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'hadir')}
                                                                >
                                                                    <CheckCircle className="mr-1 h-3.5 w-3.5" /> Hadir
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={siswa.absensi?.status === 'sakit' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'sakit' ? 'bg-blue-600 hover:bg-blue-700 h-8 text-[11px] px-2.5' : 'hover:border-blue-600 hover:text-blue-600 bg-background/50 h-8 text-[11px] px-2.5'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'sakit')}
                                                                >
                                                                    <Clock className="mr-1 h-3.5 w-3.5" /> Sakit{siswa.absensi?.bukti && siswa.absensi?.status === 'sakit' && <ImageUp className="ml-1 h-3 w-3" />}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={siswa.absensi?.status === 'izin' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'izin' ? 'bg-orange-600 hover:bg-orange-700 h-8 text-[11px] px-2.5' : 'hover:border-orange-600 hover:text-orange-600 bg-background/50 h-8 text-[11px] px-2.5'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'izin')}
                                                                >
                                                                    <FileWarning className="mr-1 h-3.5 w-3.5" /> Izin{siswa.absensi?.bukti && siswa.absensi?.status === 'izin' && <ImageUp className="ml-1 h-3 w-3" />}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={siswa.absensi?.status === 'alpha' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'alpha' ? 'bg-red-600 hover:bg-red-700 h-8 text-[11px] px-2.5' : 'hover:border-red-600 hover:text-red-600 bg-background/50 h-8 text-[11px] px-2.5'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'alpha')}
                                                                >
                                                                    <XCircle className="mr-1 h-3.5 w-3.5" /> Alfa
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={siswa.absensi?.status === 'dispensasi' ? 'default' : 'outline'}
                                                                    className={siswa.absensi?.status === 'dispensasi' ? 'bg-indigo-600 hover:bg-indigo-700 h-8 text-[11px] px-2.5' : 'hover:border-indigo-600 hover:text-indigo-600 bg-background/50 h-8 text-[11px] px-2.5'}
                                                                    onClick={() => handleStatusClick(siswa.id, 'dispensasi')}
                                                                >
                                                                    <Award className="mr-1 h-3.5 w-3.5" /> Dispensasi{siswa.absensi?.bukti && siswa.absensi?.status === 'dispensasi' && <ImageUp className="ml-1 h-3 w-3" />}
                                                                </Button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Input
                                                                placeholder="Alasan..."
                                                                value={keterangans[siswa.id] || ''}
                                                                onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                                                                className="h-8 bg-muted/30"
                                                                disabled={!siswa.absensi || siswa.absensi.status === 'hadir'}
                                                                onBlur={() => {
                                                                    if (siswa.absensi && siswa.absensi.keterangan !== keterangans[siswa.id] && siswa.absensi.status !== 'hadir') {
                                                                        submitKeterangan(siswa.id, siswa.absensi.status);
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {siswa.absensi && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => setDeletingAbsensiId(siswa.absensi!.id)}
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                    title="Hapus / Reset"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center border border-dashed border-sidebar-border/70 bg-card rounded-xl p-12 text-center h-[400px]">
                                <Clock3 className="h-12 w-12 text-primary opacity-25 mb-4 animate-pulse" />
                                <h3 className="text-lg font-semibold">Menunggu Pilihan Pembelajaran</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    Pilih Kelas, Mata Pelajaran, dan tetapkan Jam Pembelajaran di panel sebelah kiri untuk membuka pencatatan kehadiran siswa.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingAbsensiId !== null} onOpenChange={(open) => !open && setDeletingAbsensiId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Reset</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus/meriset catatan absensi siswa ini pada jam pelajaran ini?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeReset}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showBuktiModal} onOpenChange={(open) => { if (!open) handleBuktiCancel(); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Bukti Foto</DialogTitle>
                        <DialogDescription>
                            Silakan unggah foto bukti untuk status <strong>{pendingStatus}</strong>.
                            Foto ini akan disertakan sebagai lampiran pada rekap absensi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col items-center gap-3">
                            {previewUrl ? (
                                <div className="relative w-full max-h-48 overflow-hidden rounded-lg border border-sidebar-border/70">
                                    <img
                                        src={previewUrl}
                                        alt="Preview bukti"
                                        className="w-full h-48 object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                                        onClick={() => {
                                            setBuktiFile(null);
                                            setPreviewUrl(null);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-sidebar-border/70 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                                    <ImageUp className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">
                                        Klik untuk pilih foto
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-1">
                                        JPG, JPEG, PNG, WebP (max. 2MB)
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleBuktiFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
