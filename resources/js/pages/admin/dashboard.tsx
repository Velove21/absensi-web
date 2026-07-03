import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Shield, Users, BookOpen, GraduationCap, Activity, PieChart as PieChartIcon, CheckCircle, Clock, FileWarning, XCircle, Award, TableProperties, ImageUp } from 'lucide-react';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        status: string | null;
        kelas_id: string | null;
    };
    detailedAttendance: DetailedAttendance[];
    kelasList: Kelas[];
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
    kelasList
}: AdminDashboardProps) {
    const [previewBukti, setPreviewBukti] = useState<string | null>(null);
    const attendanceData = [
        { status: 'hadir', count: attendanceToday.hadir, fill: 'var(--color-hadir)' },
        { status: 'sakit', count: attendanceToday.sakit, fill: 'var(--color-sakit)' },
        { status: 'izin', count: attendanceToday.izin, fill: 'var(--color-izin)' },
        { status: 'alpha', count: attendanceToday.alpha, fill: 'var(--color-alpha)' },
        { status: 'dispensasi', count: attendanceToday.dispensasi, fill: 'var(--color-dispensasi)' },
    ];

    const handleFilterChange = (key: keyof AdminDashboardProps['filters'], value: string | null) => {
        const newFilters = { ...filters, [key]: value };
        
        router.get(
            adminDashboard.url(),
            newFilters as any,
            { preserveState: true, preserveScroll: true }
        );
    };

    const clearFilters = () => {
        router.get(
            adminDashboard.url(),
            { tanggal: filters.tanggal },
            { preserveState: true, preserveScroll: true }
        );
    };

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

                <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                    <div className="text-sm font-medium text-muted-foreground w-full md:w-auto shrink-0">
                        Filter Analisis Kehadiran:
                    </div>
                    <div className="flex flex-wrap gap-3 w-full">
                        <Input
                            type="date"
                            value={filters.tanggal}
                            onChange={(e) => handleFilterChange('tanggal', e.target.value)}
                            className="w-full md:w-[200px]"
                        />
                        <Select
                            value={filters.kelas_id || undefined}
                            onValueChange={(val) => handleFilterChange('kelas_id', val === 'all' ? null : val)}
                        >
                            <SelectTrigger className="w-full md:w-[220px]">
                                <SelectValue placeholder="Semua Kelas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kelas</SelectItem>
                                {kelasList.map(kelas => (
                                    <SelectItem key={kelas.id} value={kelas.id.toString()}>
                                        {formatKelasName(kelas)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.status || undefined}
                            onValueChange={(val) => handleFilterChange('status', val === 'all' ? null : val)}
                        >
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="hadir">Hadir</SelectItem>
                                <SelectItem value="sakit">Sakit</SelectItem>
                                <SelectItem value="izin">Izin</SelectItem>
                                <SelectItem value="alpha">Alpha</SelectItem>
                                <SelectItem value="dispensasi">Dispensasi</SelectItem>
                            </SelectContent>
                        </Select>
                        {(filters.status || filters.kelas_id) && (
                            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                                Hapus Filter
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-2">
                    {/* Attendance Chart */}
                    <Card className="border-sidebar-border/70 shadow-sm dark:border-sidebar-border flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg">Statistik Absensi: {filters.tanggal}</CardTitle>
                                <CardDescription>Persentase kehadiran (Berdasarkan filter aktif)</CardDescription>
                            </div>
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
                                                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-muted/50 ${filters.status === item.status ? 'bg-muted ring-1 ring-border' : ''}`}
                                                onClick={() => handleFilterChange('status', filters.status === item.status ? null : item.status)}
                                                title="Klik untuk filter data"
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

                    {/* Students per Jurusan Chart or Details Table */}
                    {filters.status || filters.kelas_id ? (
                        <Card className="border-sidebar-border/70 shadow-sm dark:border-sidebar-border flex flex-col lg:col-span-1 h-[500px]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    <TableProperties className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg">Detail Data Absensi</CardTitle>
                                        <CardDescription>Menampilkan daftar spesifik berdasarkan filter.</CardDescription>
                                    </div>
                                </div>
                                <div className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                    {detailedAttendance.length} Entri
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                                <div className="overflow-y-auto flex-1">
                                    {detailedAttendance.length > 0 ? (
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-4 py-3">Siswa</th>
                                                    <th className="px-4 py-3">Kelas</th>
                                                    <th className="px-4 py-3">Jam / Mapel</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3">Bukti</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                                {detailedAttendance.map((record) => (
                                                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">{record.siswa.nama}</div>
                                                            <div className="text-xs text-muted-foreground font-mono">{record.siswa.nis}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">{record.kelas}</td>
                                                        <td className="px-4 py-3 text-xs">
                                                            <div>Jam Ke-{record.jam_ke}</div>
                                                            <div className="text-muted-foreground truncate max-w-[120px]" title={record.mapel}>{record.mapel}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <StatusBadge status={record.status} />
                                                                {record.keterangan && (
                                                                    <span className="text-[10px] text-muted-foreground italic max-w-[120px] truncate" title={record.keterangan}>
                                                                        "{record.keterangan}"
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {record.bukti ? (
                                                                <button
                                                                    onClick={() => setPreviewBukti(`/storage/${record.bukti}`)}
                                                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 underline underline-offset-2"
                                                                >
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
                                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                            Tidak ada data untuk filter ini.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
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
                    )}
                </div>
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
