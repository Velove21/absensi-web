import { Head, router } from '@inertiajs/react';
import { Shield, ShieldCheck, Users, BookOpen, GraduationCap, Library, Activity, PieChart as PieChartIcon, CheckCircle, Clock, FileWarning, XCircle, Award, FileSpreadsheet, Search, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/ui/searchable-select';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard, exportAbsensi as adminExportAbsensi } from '@/routes/admin';

interface Stats {
    total_admin: number;
    total_siswa: number;
    total_guru: number;
    total_kelas: number;
    total_jurusan: number;
    total_mata_pelajaran: number;
}

interface Kelas {
    id: number;
    tingkat: string | null;
    nama_kelas: string;
    full_nama_kelas?: string;
    jurusan: {
        singkatan: string;
    } | null;
}

interface DetailedAttendance {
    id: number;
    jam_ke: string;
    status: string;
    keterangan: string | null;
    bukti: string | null;
    siswa: {
        nis: string;
        nama: string;
    };
    kelas: string;
    mapel: string;
    guru: string;
}

interface MapelItem {
    id: number;
    nama_mapel: string;
    kategori: string;
}

interface KelasItem {
    id: number;
    nama_kelas: string;
    full_nama_kelas?: string;
    tingkat: string | null;
    jurusan: { singkatan: string } | null;
}

interface GuruExport {
    id: number;
    nama: string;
    nip: string | null;
    mapels: MapelItem[];
    kelasList: KelasItem[];
}

interface AdminDashboardProps {
    stats: Stats;
    attendanceToday: {
        hadir: number;
        sakit: number;
        izin: number;
        alpha: number;
        dispensasi: number;
        kelas: number;
    };
    studentsPerJurusan: {
        singkatan: string;
        count: number;
    }[];
    filters: {
        tanggal: string;
    };
    detailedAttendance: DetailedAttendance[];
    gurus: GuruExport[];
}

const attendanceConfig = {
    hadir: { label: 'Hadir', color: 'var(--chart-2)' },
    sakit: { label: 'Sakit', color: 'var(--chart-4)' },
    izin: { label: 'Izin', color: 'var(--chart-1)' },
    alpha: { label: 'Alpha', color: 'var(--destructive)' },
    dispensasi: { label: 'Dispensasi', color: 'var(--chart-5)' },
    kelas: { label: 'Kelas', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const jurusanConfig = {
    count: { label: 'Jumlah Siswa', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export default function AdminDashboard({ 
    stats, 
    attendanceToday, 
    studentsPerJurusan,
    filters,
    gurus = [],
}: AdminDashboardProps) {
    const attendanceData = [
        { status: 'hadir', count: attendanceToday.hadir, fill: 'var(--color-hadir)' },
        { status: 'sakit', count: attendanceToday.sakit, fill: 'var(--color-sakit)' },
        { status: 'izin', count: attendanceToday.izin, fill: 'var(--color-izin)' },
        { status: 'alpha', count: attendanceToday.alpha, fill: 'var(--color-alpha)' },
        { status: 'dispensasi', count: attendanceToday.dispensasi, fill: 'var(--color-dispensasi)' },
    ];
    const kelasSudahAbsen = (attendanceToday as unknown as { kelas: number }).kelas ?? 0;
    const gridData = [...attendanceData, { status: 'kelas', count: kelasSudahAbsen, fill: 'var(--color-kelas)' }];
    useAutoRefresh(true, 5000);

    // Export state
    const [exportGuruId, setExportGuruId] = useState('');
    const [exportMapelIds, setExportMapelIds] = useState<string[]>([]);
    const [exportKelasIds, setExportKelasIds] = useState<string[]>([]);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exportMapelSearch, setExportMapelSearch] = useState('');
    const [exportKelasSearch, setExportKelasSearch] = useState('');
    const [exportMapelOpen, setExportMapelOpen] = useState(false);
    const [exportKelasOpen, setExportKelasOpen] = useState(false);

    const selectedGuru = gurus.find(g => g.id.toString() === exportGuruId);
    const teacherMapels = selectedGuru?.mapels ?? [];
    const teacherKelas = selectedGuru?.kelasList ?? [];

    const allMapelSelected = exportMapelIds.length === teacherMapels.length && teacherMapels.length > 0;
    const allKelasSelected = exportKelasIds.length === teacherKelas.length && teacherKelas.length > 0;

    const toggleMapel = (id: string) => {
        setExportMapelIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
        setExportMapelOpen(false);
    };

    const toggleAllMapel = () => {
        if (allMapelSelected) {
            setExportMapelIds([]);
        } else {
            setExportMapelIds(teacherMapels.map(m => m.id.toString()));
        }
        setExportMapelOpen(false);
    };

    const toggleKelas = (id: string) => {
        setExportKelasIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
        setExportKelasOpen(false);
    };

    const toggleAllKelas = () => {
        if (allKelasSelected) {
            setExportKelasIds([]);
        } else {
            setExportKelasIds(teacherKelas.map(k => k.id.toString()));
        }
        setExportKelasOpen(false);
    };

    const mapelDropdownRef = useRef<HTMLDivElement>(null);
    const kelasDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (mapelDropdownRef.current && !mapelDropdownRef.current.contains(e.target as Node)) {
                setExportMapelOpen(false);
            }
            if (kelasDropdownRef.current && !kelasDropdownRef.current.contains(e.target as Node)) {
                setExportKelasOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!exportGuruId) {
            toast.error('Silakan pilih Guru.');
            return;
        }
        if (exportMapelIds.length === 0) {
            toast.error('Silakan pilih Mata Pelajaran.');
            return;
        }
        const params = new URLSearchParams();
        params.set('guru_id', exportGuruId);
        exportMapelIds.forEach(id => params.append('mapel_ids[]', id));
        exportKelasIds.forEach(id => params.append('kelas_ids[]', id));
        if (exportStartDate) params.set('start_date', exportStartDate);
        if (exportEndDate) params.set('end_date', exportEndDate);

        setExporting(true);
        try {
            const response = await fetch(adminExportAbsensi.url() + '?' + params.toString(), {
                headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/json, text/html, */*' },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                let msg = 'Gagal export: periksa filter guru/mapel/kelas';
                try {
                    const ct = response.headers.get('Content-Type') || '';
                    if (ct.includes('application/json')) {
                        const j = await response.json();
                        msg = j.message || j.error || msg;
                    } else {
                        const text = await response.text();
                        // Coba extract pesan JSON di dalam text
                        try {
                            const j2 = JSON.parse(text);
                            msg = j2.message || j2.error || msg;
                        } catch {
                            if (text.includes('error') || text.includes('Error')) {
                                // tetap pakai msg generic biar tidak spill HTML panjang
                            } else if (text.trim().length > 0 && text.trim().length < 300) {
                                msg = text.trim().slice(0, 200);
                            }
                        }
                    }
                } catch {}
                toast.error(msg);
                return;
            }
            const contentType = response.headers.get('Content-Type') || '';
            // Jika response adalah HTML redirect (bukan file), berarti error — XLSX asli: application/vnd.openxmlformats...
            if (contentType.includes('text/html') && !contentType.includes('application/vnd.openxmlformats') && !contentType.includes('application/vnd.ms-excel')) {
                const text = await response.text();
                if (text.length < 5000 && text.includes('error')) {
                    toast.error('Gagal export: ' + text.slice(0, 200));
                    return;
                }
            }
            const blob = await response.blob();
            if (blob.size < 100) {
                toast.error('Data kosong untuk filter ini. Pastikan guru telah mengabsen di beberapa kelas/hari.');
                return;
            }
            const disposition = response.headers.get('Content-Disposition') || '';
            const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
            const filename = filenameMatch ? filenameMatch[1] : `rekap-presensi-${exportGuruId}.xlsx`;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            toast.success('File export berhasil diunduh. Semua sesi absen per kelas & hari disertakan.');
        } catch {
            toast.error('Terjadi kesalahan saat export. Coba lagi.');
        } finally {
            setExporting(false);
        }
    };

    const [statDate, setStatDate] = useState(filters.tanggal);

    const handleStatDateChange = (newDate: string) => {
        setStatDate(newDate);
        router.get(
            adminDashboard.url(),
            { tanggal: newDate },
            { preserveState: true, preserveScroll: true }
        );
    };

    const openStatistik = (status: string) => {
        // Buka halaman baru yang menampilkan data terbaru per siswa (seperti history siswa versi sekolah)
        router.get(`/admin/statistik/${status}`, { tanggal: statDate }, { preserveState: false });
    };

    const filteredMapels = teacherMapels.filter(m =>
        m.nama_mapel.toLowerCase().includes(exportMapelSearch.toLowerCase())
    );
    const filteredKelas = teacherKelas.filter(k =>
        (k.full_nama_kelas ?? k.nama_kelas).toLowerCase().includes(exportKelasSearch.toLowerCase())
    );

    const formatKelasName = (k: Kelas | KelasItem) => {
        if ((k as unknown as { full_nama_kelas?: string }).full_nama_kelas) {
            return (k as unknown as { full_nama_kelas: string }).full_nama_kelas;
        }
        const parts: string[] = [];
        if (k.tingkat) parts.push(k.tingkat);
        if (k.jurusan?.singkatan) parts.push(k.jurusan.singkatan);
        parts.push(k.nama_kelas);
        return parts.join(' ');
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'hadir':
                return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"><CheckCircle className="h-3 w-3" /> Hadir</span>;
            case 'sakit':
                return <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20"><Clock className="h-3 w-3" /> Sakit</span>;
            case 'izin':
                return <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20"><FileWarning className="h-3 w-3" /> Izin</span>;
            case 'alpha':
                return <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"><XCircle className="h-3 w-3" /> Alfa</span>;
            case 'dispensasi':
                return <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"><Award className="h-3 w-3" /> Dispensasi</span>;
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Pusat Kendali Admin
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola data master sistem presensi KlikHadir.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Baris 1: Admin - Siswa - Guru */}
                    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-slate-100 p-2.5 dark:bg-slate-800">
                            <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Total Admin
                            </p>
                            <h3 className="text-xl font-bold">{stats.total_admin}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-orange-100 p-2.5 dark:bg-orange-900/30">
                            <GraduationCap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Total Siswa
                            </p>
                            <h3 className="text-xl font-bold">{stats.total_siswa}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-emerald-100 p-2.5 dark:bg-emerald-900/30">
                            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Total Guru
                            </p>
                            <h3 className="text-xl font-bold">{stats.total_guru}</h3>
                        </div>
                    </div>

                    {/* Baris 2: Kelas - Jurusan - Mata Pelajaran */}
                    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-purple-100 p-2.5 dark:bg-purple-900/30">
                            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Total Kelas
                            </p>
                            <h3 className="text-xl font-bold">{stats.total_kelas}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-blue-100 p-2.5 dark:bg-blue-900/30">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Total Jurusan
                            </p>
                            <h3 className="text-xl font-bold">{stats.total_jurusan}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-indigo-100 p-2.5 dark:bg-indigo-900/30">
                            <Library className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Total Mata Pelajaran
                            </p>
                            <h3 className="text-xl font-bold">{stats.total_mata_pelajaran}</h3>
                        </div>
                    </div>
                </div>



                {/* Export Section */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                    <div className="flex items-center gap-2 mb-4">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold">Ekspor Rekap Presensi</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Pilih Guru - Searchable */}
                        <div className="space-y-1.5 w-full sm:w-[260px]">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Guru</label>
                            <SearchableSelect
                                value={exportGuruId}
                                onValueChange={(val) => {
                                    setExportGuruId(val);
                                    setExportMapelIds([]);
                                    setExportKelasIds([]);
                                }}
                                placeholder="Pilih Guru"
                                items={gurus.map(g => ({
                                    value: g.id.toString(),
                                    label: `${g.nama} (${g.nip || '-'})`,
                                }))}
                                className="w-full"
                            />
                        </div>

                        {/* Pilih Mapel - Multi-select with search */}
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Mapel</label>
                            <div ref={mapelDropdownRef} className="relative">
                                <button
                                    type="button"
                                    disabled={!exportGuruId}
                                    onClick={() => {
 setExportMapelOpen(!exportMapelOpen); setExportKelasOpen(false); 
}}
                                    className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-xs leading-tight shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 sm:w-[220px] sm:text-sm"
                                >
                                    <span className="min-w-0 flex-1 truncate text-left text-xs leading-tight sm:text-sm">
                                        {exportMapelIds.length === 0
                                            ? 'Pilih Mapel'
                                            : allMapelSelected
                                                ? 'Semua Mapel'
                                                : `${exportMapelIds.length} mapel dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {exportMapelOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full origin-top overflow-hidden rounded-md border shadow-md sm:w-[220px]">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={exportMapelSearch}
                                                onChange={e => setExportMapelSearch(e.target.value)}
                                                placeholder="Cari mapel..."
                                                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:text-sm"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={allMapelSelected}
                                                    onChange={toggleAllMapel}
                                                    className="size-4 shrink-0"
                                                />
                                                <span className="font-medium">Semua Mapel</span>
                                            </label>
                                            {filteredMapels.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredMapels.map(m => (
                                                    <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={exportMapelIds.includes(m.id.toString())}
                                                            onChange={() => toggleMapel(m.id.toString())}
                                                            className="size-4 shrink-0"
                                                        />
                                                        <span className="flex-1 break-words whitespace-normal leading-snug">{m.nama_mapel}</span>
                                                        <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">{m.kategori}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pilih Kelas - Multi-select with search */}
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Kelas</label>
                            <div ref={kelasDropdownRef} className="relative">
                                <button
                                    type="button"
                                    disabled={!exportGuruId}
                                    onClick={() => {
 setExportKelasOpen(!exportKelasOpen); setExportMapelOpen(false); 
}}
                                    className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-xs leading-tight shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 sm:w-[220px] sm:text-sm"
                                >
                                    <span className="min-w-0 flex-1 truncate text-left text-xs leading-tight sm:text-sm">
                                        {exportKelasIds.length === 0
                                            ? 'Pilih Kelas'
                                            : allKelasSelected
                                                ? 'Semua Kelas'
                                                : `${exportKelasIds.length} kelas dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {exportKelasOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full origin-top overflow-hidden rounded-md border shadow-md sm:w-[220px]">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={exportKelasSearch}
                                                onChange={e => setExportKelasSearch(e.target.value)}
                                                placeholder="Cari kelas..."
                                                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:text-sm"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={allKelasSelected}
                                                    onChange={toggleAllKelas}
                                                    className="size-4 shrink-0"
                                                />
                                                <span className="font-medium">Semua Kelas</span>
                                            </label>
                                            {filteredKelas.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredKelas.map(k => (
                                                    <label key={k.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent sm:text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={exportKelasIds.includes(k.id.toString())}
                                                            onChange={() => toggleKelas(k.id.toString())}
                                                            className="size-4 shrink-0"
                                                        />
                                                        <span className="flex-1 break-words whitespace-normal leading-snug">{formatKelasName(k)}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tanggal Mulai</label>
                            <Input
                                type="date"
                                value={exportStartDate}
                                onChange={e => setExportStartDate(e.target.value)}
                                className="w-[170px] bg-muted/30 h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tanggal Selesai</label>
                            <Input
                                type="date"
                                value={exportEndDate}
                                onChange={e => setExportEndDate(e.target.value)}
                                className="w-[170px] bg-muted/30 h-9"
                            />
                        </div>
                        <Button onClick={handleExport} disabled={exporting} className="h-9 gap-1.5">
                            {exporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengunduh...</> : <><FileSpreadsheet className="h-4 w-4" /> Ekspor</>}
                        </Button>
                    </div>
                </div>



                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-2">
                    {/* Attendance Chart */}
                    <Card className="border-sidebar-border/70 shadow-sm dark:border-sidebar-border flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <CardTitle className="text-lg">Statistik Presensi</CardTitle>
                                <CardDescription>Klik status untuk melihat detail siswa</CardDescription>
                            </div>
                            <Input
                                type="date"
                                value={statDate}
                                onChange={e => handleStatDateChange(e.target.value)}
                                className="w-[170px] h-8 text-xs"
                            />
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center">
                            {attendanceData.reduce((sum, item) => sum + item.count, 0) > 0 ? (
                                <>
                                    <ChartContainer config={attendanceConfig} className="mx-auto aspect-square max-h-[300px]">
                                        <PieChart>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                            <Pie
                                                data={attendanceData}
                                                dataKey="count"
                                                nameKey="status"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                strokeWidth={2}
                                            >
                                                {attendanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-center">
                                        {gridData.map((item) => (
                                            <button 
                                                key={item.status} 
                                                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-muted/50 hover:ring-1 hover:ring-border cursor-pointer"
                                                onClick={() => openStatistik(item.status)}
                                                title={`Klik buka halaman ${item.status} — terbaru per siswa`}
                                            >
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div
                                                        className="h-3 w-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                item.status === 'hadir' ? 'var(--chart-2)' :
                                                                item.status === 'sakit' ? 'var(--chart-4)' :
                                                                item.status === 'izin' ? 'var(--chart-1)' :
                                                                item.status === 'kelas' ? 'var(--chart-3)' :
                                                                item.status === 'dispensasi' ? 'var(--chart-5)' :
                                                                'var(--destructive)',
                                                        }}
                                                    />
                                                    <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <span className="text-xl font-bold">{item.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                    <PieChartIcon className="h-12 w-12 opacity-20 mb-3" />
                                    <p>Belum ada data presensi pada tanggal ini.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Students per Jurusan Chart */}
                    <Card className="border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg">Distribusi Siswa</CardTitle>
                                <CardDescription>Jumlah siswa per jurusan</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={jurusanConfig} className="mt-4 aspect-auto h-[350px] w-full">
                                <BarChart data={studentsPerJurusan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="singkatan"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        fontSize={12}
                                    />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: adminDashboard.url(),
        },
        {
            title: 'Dashboard',
            href: adminDashboard.url(),
        },
    ],
};
