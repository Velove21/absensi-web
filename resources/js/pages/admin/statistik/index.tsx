import { Head, router, Link } from '@inertiajs/react';
import { CheckCircle, XCircle, Clock, FileWarning, Award, Calendar, ImageUp, ArrowLeft, Users, GraduationCap, BookOpen, Download, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard, statistik } from '@/routes/admin';
import { toast } from 'sonner';

interface RecordItem {
    id: number;
    tanggal: string;
    jam_ke: string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    status: string;
    keterangan: string | null;
    bukti: string | null;
    updated_at?: string;
    siswa: { id: number; nis: string; nama: string; foto_url?: string | null } | null;
    kelas: { id: number; nama_kelas: string; full_nama_kelas: string; tingkat: string | null; jurusan_singkatan: string | null } | null;
    mapel: { id: number; nama_mapel: string } | null;
    guru: { id: number; nama: string } | null;
}

interface KelasRecord {
    id: number;
    nama_kelas: string;
    full_nama_kelas: string;
    jurusan_singkatan: string | null;
    tingkat: string | null;
    stats: { hadir: number; sakit: number; izin: number; alpha: number; dispensasi: number };
    total_diabsen: number;
}

interface Props {
    tanggal: string;
    status: string;
    records: RecordItem[] | KelasRecord[];
    total: number;
    totalKelas?: number;
    kelasSudahAbsen: number;
    isKelas: boolean;
    activeYear?: { tahun_awal: string; tahun_akhir: string; start: string; end: string } | null;
    isOutOfYear?: boolean;
}

export default function StatistikIndex({ 
    tanggal, 
    status, 
    records, 
    total, 
    totalKelas, 
    kelasSudahAbsen, 
    isKelas,
    activeYear = null,
    isOutOfYear = false
}: Props) {
    const [previewBukti, setPreviewBukti] = useState<{ url: string; id: number; nama?: string; status?: string; tanggal?: string; kelasNama?: string } | null>(null);
    const [filterTanggal, setFilterTanggal] = useState(tanggal);
    const [searchQuery, setSearchQuery] = useState('');

    // Auto-refresh tiap 5 detik agar jam update & data terbaru sinkron dengan guru
    useAutoRefresh(!isOutOfYear, 5000, ['records', 'total', 'kelasSudahAbsen']);

    const getStatusBadge = (s: string) => {
        switch (s) {
            case 'hadir':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Hadir</Badge>;
            case 'sakit':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Sakit</Badge>;
            case 'izin':
                return <Badge className="bg-orange-500 hover:bg-orange-600">Izin</Badge>;
            case 'alpha':
                return <Badge variant="destructive">Alpha</Badge>;
            case 'dispensasi':
                return <Badge className="bg-indigo-500 hover:bg-indigo-600">Dispensasi</Badge>;
            case 'kelas':
                return <Badge className="bg-violet-500 hover:bg-violet-600">Kelas</Badge>;
            default:
                return <Badge variant="secondary">{s}</Badge>;
        }
    };

    const handleTanggalChange = (newDate: string) => {
        if (activeYear && (newDate < activeYear.start || newDate > activeYear.end)) {
            toast.error('Tanggal di luar tahun ajaran aktif — hanya tersedia di Arsip');
            return;
        }
        setFilterTanggal(newDate);
        router.get(
            statistik.url({ status }, { query: { tanggal: newDate } }),
            {},
            { preserveState: false, preserveScroll: true },
        );
    };

    const isKelasView = isKelas;
    const kelasRecordsRaw = isKelasView ? (records as KelasRecord[]) : [];
    const rawSiswaRecords = !isKelasView ? (records as RecordItem[]) : [];
    // Urutkan dari absen (NIS) bukan dari keterangan, tetap urut
    const siswaRecordsSorted = [...rawSiswaRecords].sort((a, b) => {
        const nisA = a.siswa?.nis ?? '';
        const nisB = b.siswa?.nis ?? '';
        if (nisA && nisB && !isNaN(Number(nisA)) && !isNaN(Number(nisB))) return Number(nisA) - Number(nisB);
        return nisA.localeCompare(nisB);
    });

    // Palette warna: tiap kelas berbeda warna, tiap mata pelajaran berbeda warna (terpisah)
    const kelasPalette = [
        'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300',
        'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
        'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300',
        'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300',
        'bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-900/20 dark:text-pink-300',
        'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300',
        'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
        'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/20 dark:text-teal-300',
    ];
    const mapelPalette = [
        'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-300',
        'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300',
        'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300',
        'bg-lime-50 text-lime-700 ring-lime-200 dark:bg-lime-900/20 dark:text-lime-300',
        'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
        'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300',
        'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300',
        'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300',
    ];
    const kelasColorMap = useMemo(() => {
        const map = new Map<number, string>();
        let idx = 0;
        for (const r of siswaRecordsSorted) {
            const id = r.kelas?.id ?? 0;
            if (!map.has(id)) {
                map.set(id, kelasPalette[idx % kelasPalette.length]);
                idx++;
            }
        }
        return map;
    }, [siswaRecordsSorted]);
    const mapelColorMap = useMemo(() => {
        const map = new Map<number, string>();
        let idx = 0;
        for (const r of siswaRecordsSorted) {
            const id = r.mapel?.id ?? 0;
            if (!map.has(id)) {
                map.set(id, mapelPalette[idx % mapelPalette.length]);
                idx++;
            }
        }
        return map;
    }, [siswaRecordsSorted]);

    const getKelasBadgeClass = (kelasId?: number | null) => {
        return kelasColorMap.get(kelasId ?? 0) ?? kelasPalette[0];
    };
    const getMapelBadgeClass = (mapelId?: number | null) => {
        return mapelColorMap.get(mapelId ?? 0) ?? mapelPalette[0];
    };

    // Search filter untuk siswa records (nama, kelas, mata pelajaran, guru, nis, status, keterangan, jam_ke)
    const filteredSiswaRecords = useMemo(() => {
        if (!searchQuery.trim()) return siswaRecordsSorted;
        const q = searchQuery.toLowerCase();
        return siswaRecordsSorted.filter((r) => {
            const haystack = [
                r.siswa?.nis ?? '',
                r.siswa?.nama ?? '',
                r.kelas?.full_nama_kelas ?? '',
                r.kelas?.nama_kelas ?? '',
                r.mapel?.nama_mapel ?? '',
                r.guru?.nama ?? '',
                r.status ?? '',
                r.keterangan ?? '',
                r.jam_ke ?? '',
                r.updated_at ?? '',
                r.tanggal ?? '',
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [siswaRecordsSorted, searchQuery]);

    // Search filter untuk kelas view (nama kelas, tingkat, jurusan)
    const filteredKelasRecords = useMemo(() => {
        if (!searchQuery.trim()) return kelasRecordsRaw;
        const q = searchQuery.toLowerCase();
        return kelasRecordsRaw.filter((k) => {
            const haystack = [
                k.full_nama_kelas ?? '',
                k.nama_kelas ?? '',
                k.tingkat ?? '',
                k.jurusan_singkatan ?? '',
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [kelasRecordsRaw, searchQuery]);

    const showKeterangan = status === 'alpha';
    const showBukti = !isKelasView && status !== 'hadir' && status !== 'alpha';

    // Samain persis dengan lihat absensi (guru/data.tsx) — waktu update = jam guru terakhir submit (WIB)
    const formatJam = (iso?: string | null) => {
        if (!iso) return '-';
        try {
            const d = new Date(iso.replace(' ', 'T'));
            if (isNaN(d.getTime())) return iso.slice(11, 16) || '-';
            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace('.', ':');
        } catch {
            return iso.slice(11, 16) || '-';
        }
    };

    const getSuratLabel = (s: string, nama?: string, kelasNama?: string, tgl?: string) => {
        const jenis = s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Surat';
        const nm = nama ? nama.toUpperCase().replace(/\s+/g, ' ').trim() : 'SISWA';
        const kls = kelasNama ?? '-';
        const t = tgl ?? tanggal;
        return `${jenis}-${nm}-${kls}-${t}`;
    };

    return (
        <>
            <Head title={`Statistik ${status} - ${tanggal}`} />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="text-foreground hover:bg-accent">
                            <Link href={adminDashboard.url({ query: { tanggal } })}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {isKelasView ? 'Rekap Presensi Kelas' : `Siswa ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                            </h1>
                        </div>
                    </div>
                    {isOutOfYear && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Tanggal di luar tahun ajaran aktif {activeYear?.tahun_awal}/{activeYear?.tahun_akhir} — data telah diarsipkan dan hanya tersedia di menu Arsip. Silakan akses admin/arsip.
                        </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={filterTanggal}
                            onChange={(e) => handleTanggalChange(e.target.value)}
                            className="h-7 w-[160px] border-0 p-0 text-sm focus-visible:ring-0"
                            min={activeYear?.start}
                            max={activeYear?.end}
                        />
                    </div>
                </div>

                {/* Ringkasan kecil */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Card className="border-sidebar-border/60">
                        <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground">Tanggal</p>
                            <p className="font-mono text-sm font-bold">{tanggal}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-sidebar-border/60">
                        <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground">Total {isKelasView ? 'Kelas' : 'Siswa'}</p>
                            <p className="text-sm font-bold">{total} {isKelasView ? 'kelas' : 'siswa'}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-sidebar-border/60">
                        <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground">Kelas Sudah Diabsen</p>
                            <p className="text-sm font-bold">{kelasSudahAbsen} kelas</p>
                        </CardContent>
                    </Card>
                    <Card className="border-sidebar-border/60">
                        <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <div className="mt-1">{getStatusBadge(status)}</div>
                        </CardContent>
                    </Card>
                </div>

                {isKelasView ? (
                    <Card>
                        <CardHeader className="space-y-3">
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-violet-600" /> Rekap Presensi Kelas
                            </CardTitle>
                            <div className="relative max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari kelas, tingkat, jurusan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[55px] text-center">No.</TableHead>
                                            <TableHead className="min-w-[180px]">Kelas</TableHead>
                                            <TableHead className="w-[110px] text-center">Total Diabsen</TableHead>
                                            <TableHead className="w-[90px] text-center">Hadir</TableHead>
                                            <TableHead className="w-[90px] text-center">Sakit</TableHead>
                                            <TableHead className="w-[90px] text-center">Izin</TableHead>
                                            <TableHead className="w-[90px] text-center">Alpha</TableHead>
                                            <TableHead className="w-[110px] text-center">Dispensasi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredKelasRecords.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                    {searchQuery ? `Tidak ada kelas yang cocok dengan "${searchQuery}"` : isOutOfYear ? `Data tanggal ini telah diarsipkan. Lihat menu Arsip untuk tahun ajaran {activeYear?.tahun_awal}/{activeYear?.tahun_akhir}.` : 'Belum ada kelas yang diabsen pada tanggal ini.'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredKelasRecords.map((k, idx) => (
                                                <TableRow key={k.id} className="hover:bg-muted/40">
                                                    <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                                    <TableCell className="font-medium">{k.full_nama_kelas}</TableCell>
                                                    <TableCell className="text-center font-bold">{k.total_diabsen}</TableCell>
                                                    <TableCell className="text-center text-emerald-600 font-medium">{k.stats.hadir}</TableCell>
                                                    <TableCell className="text-center text-blue-600 font-medium">{k.stats.sakit}</TableCell>
                                                    <TableCell className="text-center text-orange-600 font-medium">{k.stats.izin}</TableCell>
                                                    <TableCell className="text-center text-red-600 font-medium">{k.stats.alpha}</TableCell>
                                                    <TableCell className="text-center text-indigo-600 font-medium">{k.stats.dispensasi}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader className="space-y-3">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> {`Siswa ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                            </CardTitle>
                            <div className="relative max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari NIS, nama, kelas, mata pelajaran, guru"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center">No.</TableHead>
                                            <TableHead className="min-w-[140px] w-[160px]">NIS</TableHead>
                                            <TableHead className="min-w-[200px]">Nama Siswa</TableHead>
                                            <TableHead className="min-w-[150px]">Kelas</TableHead>
                                            <TableHead className="min-w-[150px]">Mata Pelajaran</TableHead>
                                            <TableHead className="w-[110px] text-center">Status</TableHead>
                                            <TableHead className="min-w-[140px]">Guru</TableHead>
                                            {showKeterangan && <TableHead className="min-w-[180px]">Keterangan</TableHead>}
                                            {showBukti && <TableHead className="w-[80px] text-center">Bukti</TableHead>}
                                            <TableHead className="w-[110px] text-center">Jam Ke-</TableHead>
                                            <TableHead className="w-[110px] text-center">Jam Update</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
{filteredSiswaRecords.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={showKeterangan && showBukti ? 12 : showKeterangan || showBukti ? 11 : 10} className="h-24 text-center text-muted-foreground">
                                                        {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : isOutOfYear ? `Data tanggal ini telah diarsipkan. Lihat menu Arsip untuk tahun ajaran {activeYear?.tahun_awal}/{activeYear?.tahun_akhir}.` : `Belum ada siswa dengan status ${status} pada tanggal ini.`}
                                                    </TableCell>
                                                </TableRow>
                                        ) : (
                                            filteredSiswaRecords.map((r, idx) => {
                                                const kelasBadge = getKelasBadgeClass(r.kelas?.id);
                                                const mapelBadge = getMapelBadgeClass(r.mapel?.id);
                                                return (
                                                <TableRow key={r.id} className="hover:bg-muted/40">
                                                    <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="size-8 shrink-0 overflow-hidden rounded-full">
                                                                <AvatarImage src={r.siswa?.foto_url ?? undefined} alt={r.siswa?.nama ?? ''} />
                                                                <AvatarFallback className="bg-muted text-xs">{r.siswa?.nama?.slice(0, 2).toUpperCase() ?? '-'}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-mono text-xs font-medium">{r.siswa?.nis ?? '-'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium whitespace-nowrap max-w-[220px] truncate" title={r.siswa?.nama ?? ''}>{r.siswa?.nama ?? '-'}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ring-1 ${kelasBadge}`}>
                                                            <GraduationCap className="h-3 w-3 shrink-0" /> <span className="truncate max-w-[120px]">{r.kelas?.full_nama_kelas ?? '-'}</span>
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ring-1 ${mapelBadge}`}>
                                                            <BookOpen className="h-3 w-3 shrink-0" /> <span className="truncate max-w-[120px]">{r.mapel?.nama_mapel ?? '-'}</span>
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">{getStatusBadge(r.status)}</TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap">{r.guru?.nama ?? '-'}</TableCell>
                                                    {showKeterangan && (
                                                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={r.keterangan ?? ''}>
                                                            {r.keterangan || '-'}
                                                        </TableCell>
                                                    )}
                                                    {showBukti && (
                                                        <TableCell className="text-center">
                                                            {r.bukti ? (
                                                                <button
                                                                    onClick={() => setPreviewBukti({ url: `/storage/${r.bukti}`, id: r.id, nama: r.siswa?.nama ?? '', status: r.status, tanggal: r.tanggal, kelasNama: r.kelas?.full_nama_kelas ?? '' })}
                                                                    className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted/20 shadow-sm hover:ring-2 hover:ring-primary/20 transition-all mx-auto"
                                                                    title="Lihat surat"
                                                                >
                                                                    <img src={`/storage/${r.bukti}`} alt={`Bukti ${r.status}`} className="h-full w-full object-cover" loading="lazy" decoding="async" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
                                                                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10"><ImageUp className="h-3 w-3 text-white opacity-0 group-hover:opacity-100" /></span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="font-mono text-xs text-center">
                                                        {r.jam_ke ?? '-'}
                                                        {r.waktu_mulai && <div className="text-[10px] text-muted-foreground whitespace-nowrap">{r.waktu_mulai} - {r.waktu_selesai ?? ''}</div>}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-center whitespace-nowrap">{formatJam(r.updated_at)}</TableCell>
                                                </TableRow>
                                            );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {searchQuery && filteredSiswaRecords.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">Menampilkan {filteredSiswaRecords.length} dari {siswaRecordsSorted.length} data</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={previewBukti !== null} onOpenChange={(o) => !o && setPreviewBukti(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-transparent border-none shadow-none p-4 [&>button]:hidden">
                    {previewBukti && (
                        <div className="bg-card rounded-xl p-5 shadow-2xl flex flex-col gap-4 relative max-w-full">
                            <button onClick={() => setPreviewBukti(null)} className="absolute left-3 top-3 h-8 w-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center" aria-label="Kembali">
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="text-center pt-2">
                                <h3 className="text-base font-semibold">Surat {previewBukti.status ? previewBukti.status.charAt(0).toUpperCase()+previewBukti.status.slice(1) : 'Presensi'}</h3>
                                <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{getSuratLabel(previewBukti.status ?? 'surat', previewBukti.nama, previewBukti.kelasNama, previewBukti.tanggal)}.</p>
                            </div>
                            <div className="flex justify-center">
                                <img src={previewBukti.url} alt={`Surat ${previewBukti.status}`} className="max-w-full max-h-[50vh] rounded-lg object-contain" loading="eager" decoding="async" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
                            </div>
                            <div className="flex justify-center">
                                <a href={previewBukti.url} download={getSuratLabel(previewBukti.status ?? 'surat', previewBukti.nama, previewBukti.kelasNama, previewBukti.tanggal)+'.png'} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-lg">
                                    <Download className="h-4 w-4" /> unduh
                                </a>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

StatistikIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Statistik', href: '#' },
    ],
};
