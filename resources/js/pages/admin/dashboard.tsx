import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Shield, Users, BookOpen, GraduationCap, Activity, PieChart as PieChartIcon, CheckCircle, Clock, FileWarning, XCircle, Award, ImageUp, FileSpreadsheet, Search, ChevronDown } from 'lucide-react';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SearchableSelect from '@/components/ui/searchable-select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Stats {
    total_jurusan: number;
    total_kelas: number;
    total_guru: number;
    total_siswa: number;
}

interface Kelas {
    id: number;
    tingkat: string | null;
    nama_kelas: string;
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
    hadir: { label: 'Hadir', color: 'var(--chart-2)' }, // emerald/green
    sakit: { label: 'Sakit', color: 'var(--chart-4)' }, // yellow/orange
    izin: { label: 'Izin', color: 'var(--chart-1)' }, // blueish
    alpha: { label: 'Alpha', color: 'var(--destructive)' }, // red
    dispensasi: { label: 'Dispensasi', color: 'var(--chart-5)' }, // purple/indigo
} satisfies ChartConfig;

const jurusanConfig = {
    count: { label: 'Jumlah Siswa', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export default function AdminDashboard({ 
    stats, 
    attendanceToday, 
    studentsPerJurusan,
    filters,
    detailedAttendance,
    gurus = [],
}: AdminDashboardProps) {
    const [previewBukti, setPreviewBukti] = useState<string | null>(null);
    const attendanceData = [
        { status: 'hadir', count: attendanceToday.hadir, fill: 'var(--color-hadir)' },
        { status: 'sakit', count: attendanceToday.sakit, fill: 'var(--color-sakit)' },
        { status: 'izin', count: attendanceToday.izin, fill: 'var(--color-izin)' },
        { status: 'alpha', count: attendanceToday.alpha, fill: 'var(--color-alpha)' },
        { status: 'dispensasi', count: attendanceToday.dispensasi, fill: 'var(--color-dispensasi)' },
    ];

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
    };

    const toggleAllMapel = () => {
        if (allMapelSelected) {
            setExportMapelIds([]);
        } else {
            setExportMapelIds(teacherMapels.map(m => m.id.toString()));
        }
    };

    const toggleKelas = (id: string) => {
        setExportKelasIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const toggleAllKelas = () => {
        if (allKelasSelected) {
            setExportKelasIds([]);
        } else {
            setExportKelasIds(teacherKelas.map(k => k.id.toString()));
        }
    };

    const handleExport = () => {
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
        window.open('/admin/export-absensi?' + params.toString(), '_blank');
    };

    // Statistik detail state
    const [statDate, setStatDate] = useState(filters.tanggal);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [statDetail, setStatDetail] = useState<DetailedAttendance[]>([]);
    const [statLoading, setStatLoading] = useState(false);
    const [statDialogOpen, setStatDialogOpen] = useState(false);

    const handleStatDateChange = (newDate: string) => {
        setStatDate(newDate);
        router.get(
            adminDashboard.url(),
            { tanggal: newDate },
            { preserveState: true, preserveScroll: true }
        );
    };

    const fetchStatDetail = (status: string) => {
        setSelectedStatus(status);
        setStatLoading(true);
        const params = new URLSearchParams();
        params.set('tanggal', statDate);
        params.set('status', status);
        router.get(
            adminDashboard.url() + '?' + params.toString(),
            {},
            {
                preserveState: false,
                preserveScroll: true,
                only: ['detailedAttendance'],
                onSuccess: (page) => {
                    const data = (page.props as any).detailedAttendance as DetailedAttendance[];
                    const singlePerDay = data.reduce<DetailedAttendance[]>((acc, curr) => {
                        const exists = acc.find(a => a.siswa.nis === curr.siswa.nis);
                        if (!exists) acc.push(curr);
                        return acc;
                    }, []);
                    setStatDetail(singlePerDay);
                    setStatLoading(false);
                    setStatDialogOpen(true);
                },
                onError: () => {
                    setStatLoading(false);
                }
            }
        );
    };

    const filteredMapels = teacherMapels.filter(m =>
        m.nama_mapel.toLowerCase().includes(exportMapelSearch.toLowerCase())
    );
    const filteredKelas = teacherKelas.filter(k =>
        k.nama_kelas.toLowerCase().includes(exportKelasSearch.toLowerCase())
    );

    const formatKelasName = (k: Kelas) => {
        const parts = [];
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
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Pusat Kendali Admin
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola data master sistem absensi SMKN 2 SURAKARTA.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-4 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Jurusan
                            </p>
                            <h3 className="text-2xl font-bold">{stats.total_jurusan}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                            <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Kelas
                            </p>
                            <h3 className="text-2xl font-bold">{stats.total_kelas}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                            <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Guru
                            </p>
                            <h3 className="text-2xl font-bold">{stats.total_guru}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                            <GraduationCap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Siswa
                            </p>
                            <h3 className="text-2xl font-bold">{stats.total_siswa}</h3>
                        </div>
                    </div>
                </div>



                {/* Export Section */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                    <div className="flex items-center gap-2 mb-4">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold">Export Rekap Absensi</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Pilih Guru - Searchable */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Guru</label>
                            <SearchableSelect
                                value={exportGuruId}
                                onValueChange={(val) => {
                                    setExportGuruId(val);
                                    setExportMapelIds([]);
                                    setExportKelasIds([]);
                                }}
                                placeholder="-- Pilih Guru --"
                                items={gurus.map(g => ({
                                    value: g.id.toString(),
                                    label: `${g.nama} (${g.nip || '-'})`,
                                }))}
                            />
                        </div>

                        {/* Pilih Mapel - Multi-select with search */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Mapel</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    disabled={!exportGuruId}
                                    onClick={() => { setExportMapelOpen(!exportMapelOpen); setExportKelasOpen(false); }}
                                    className="flex h-9 w-[220px] items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                                >
                                    <span className="line-clamp-1 flex-1 text-left">
                                        {exportMapelIds.length === 0
                                            ? '-- Pilih Mapel --'
                                            : allMapelSelected
                                                ? 'Semua Mapel'
                                                : `${exportMapelIds.length} mapel dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {exportMapelOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-[220px] origin-top overflow-hidden rounded-md border shadow-md">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={exportMapelSearch}
                                                onChange={e => setExportMapelSearch(e.target.value)}
                                                placeholder="Cari mapel..."
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                <input
                                                    type="checkbox"
                                                    checked={allMapelSelected}
                                                    onChange={toggleAllMapel}
                                                    className="size-4"
                                                />
                                                <span className="font-medium">Semua Mapel</span>
                                            </label>
                                            {filteredMapels.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredMapels.map(m => (
                                                    <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                        <input
                                                            type="checkbox"
                                                            checked={exportMapelIds.includes(m.id.toString())}
                                                            onChange={() => toggleMapel(m.id.toString())}
                                                            className="size-4"
                                                        />
                                                        <span className="flex-1">{m.nama_mapel}</span>
                                                        <span className="text-xs text-muted-foreground">{m.kategori}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pilih Kelas - Multi-select with search */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Pilih Kelas</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    disabled={!exportGuruId}
                                    onClick={() => { setExportKelasOpen(!exportKelasOpen); setExportMapelOpen(false); }}
                                    className="flex h-9 w-[220px] items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                                >
                                    <span className="line-clamp-1 flex-1 text-left">
                                        {exportKelasIds.length === 0
                                            ? '-- Pilih Kelas --'
                                            : allKelasSelected
                                                ? 'Semua Kelas'
                                                : `${exportKelasIds.length} kelas dipilih`}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                                </button>
                                {exportKelasOpen && (
                                    <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-[220px] origin-top overflow-hidden rounded-md border shadow-md">
                                        <div className="flex items-center gap-2 border-b px-3 py-2">
                                            <Search className="size-4 shrink-0 opacity-50" />
                                            <input
                                                value={exportKelasSearch}
                                                onChange={e => setExportKelasSearch(e.target.value)}
                                                placeholder="Cari kelas..."
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                <input
                                                    type="checkbox"
                                                    checked={allKelasSelected}
                                                    onChange={toggleAllKelas}
                                                    className="size-4"
                                                />
                                                <span className="font-medium">Semua Kelas</span>
                                            </label>
                                            {filteredKelas.length === 0 ? (
                                                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                    Tidak ada hasil
                                                </p>
                                            ) : (
                                                filteredKelas.map(k => (
                                                    <label key={k.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                                                        <input
                                                            type="checkbox"
                                                            checked={exportKelasIds.includes(k.id.toString())}
                                                            onChange={() => toggleKelas(k.id.toString())}
                                                            className="size-4"
                                                        />
                                                        <span className="flex-1">{formatKelasName(k)}</span>
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
                        <Button onClick={handleExport} className="h-9 gap-1.5">
                            <FileSpreadsheet className="h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>



                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-2">
                    {/* Attendance Chart */}
                    <Card className="border-sidebar-border/70 shadow-sm dark:border-sidebar-border flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <CardTitle className="text-lg">Statistik Absensi</CardTitle>
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
                                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5 text-center">
                                        {attendanceData.map((item) => (
                                            <button 
                                                key={item.status} 
                                                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-muted/50 hover:ring-1 hover:ring-border cursor-pointer"
                                                onClick={() => fetchStatDetail(item.status)}
                                                title={`Klik lihat detail ${item.status}`}
                                            >
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div
                                                        className="h-3 w-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                item.status === 'hadir' ? 'var(--chart-2)' :
                                                                item.status === 'sakit' ? 'var(--chart-4)' :
                                                                item.status === 'izin' ? 'var(--chart-1)' :
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
                                    <p>Belum ada data absensi pada tanggal ini.</p>
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

                {/* Statistik Detail Dialog */}
                <Dialog open={statDialogOpen} onOpenChange={(open) => { if (!open) setStatDialogOpen(false); }}>
                    <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="capitalize">Detail Absensi: {selectedStatus}</DialogTitle>
                            <DialogDescription>
                                Tanggal: {statDate} — {statDetail.length} siswa
                            </DialogDescription>
                        </DialogHeader>
                        <div className="overflow-y-auto flex-1 -mx-6 px-6">
                            {statLoading ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground">Memuat data...</div>
                            ) : statDetail.length > 0 ? (
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-2 w-10">#</th>
                                            <th className="px-3 py-2">NIS</th>
                                            <th className="px-3 py-2">Nama</th>
                                            <th className="px-3 py-2">Kelas</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2">Keterangan</th>
                                            <th className="px-3 py-2">Surat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70">
                                        {statDetail.map((record, idx) => (
                                            <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2 font-mono text-xs">{record.siswa.nis}</td>
                                                <td className="px-3 py-2 font-medium">{record.siswa.nama}</td>
                                                <td className="px-3 py-2 text-xs">{record.kelas}</td>
                                                <td className="px-3 py-2"><StatusBadge status={record.status} /></td>
                                                <td className="px-3 py-2 text-xs max-w-[150px] truncate" title={record.keterangan ?? ''}>
                                                    {record.keterangan || '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {record.bukti ? (
                                                        <button onClick={() => setPreviewBukti(`/storage/${record.bukti}`)}
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 underline underline-offset-2">
                                                            <ImageUp className="h-3 w-3" /> Lihat
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex items-center justify-center py-12 text-muted-foreground">
                                    Tidak ada data untuk status ini.
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={previewBukti !== null} onOpenChange={(open) => { if (!open) setPreviewBukti(null); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Bukti Absensi</DialogTitle>
                        <DialogDescription>
                            Foto bukti yang diunggah saat pencatatan absensi.
                        </DialogDescription>
                    </DialogHeader>
                    {previewBukti && (
                        <div className="flex justify-center">
                            <img
                                src={previewBukti}
                                alt="Bukti absensi"
                                className="max-w-full max-h-[60vh] rounded-lg object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Admin Dashboard',
            href: adminDashboard.url(),
        },
    ],
};
