import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { dashboard as siswaDashboard } from '@/routes/siswa';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CheckCircle,
    XCircle,
    Clock,
    FileWarning,
    Calendar,
    Award,
    BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Absensi {
    id: number;
    tanggal: string;
    status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'dispensasi';
    keterangan: string | null;
    jam_ke: string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    mapel?: {
        nama_mapel: string;
    } | null;
}

interface Props {
    siswa: {
        id: number;
        nis: string;
        nama: string;
        kelas: {
            tingkat: string | null;
            nama_kelas: string;
            jurusan: {
                singkatan: string;
            } | null;
        };
    };
    stats: {
        hadir: number;
        sakit: number;
        izin: number;
        alpha: number;
        dispensasi: number;
    };
    groupedHistory: {
        Senin: Absensi[];
        Selasa: Absensi[];
        Rabu: Absensi[];
        Kamis: Absensi[];
        Jumat: Absensi[];
    };
}

export default function SiswaDashboard({ siswa, stats, groupedHistory }: Props) {
    const [activeTab, setActiveTab] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'>('Senin');
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'hadir':
                return (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">
                        Hadir
                    </Badge>
                );
            case 'sakit':
                return (
                    <Badge className="bg-blue-500 hover:bg-blue-600">
                        Sakit
                    </Badge>
                );
            case 'izin':
                return (
                    <Badge className="bg-orange-500 hover:bg-orange-600">
                        Izin
                    </Badge>
                );
            case 'alpha':
                return <Badge variant="destructive">Alpha</Badge>;
            case 'dispensasi':
                return (
                    <Badge className="bg-indigo-500 hover:bg-indigo-600">
                        Dispensasi
                    </Badge>
                );
            default:
                return <Badge variant="secondary">Tidak Diketahui</Badge>;
        }
    };

    return (
        <>
            <Head title="Dashboard Siswa" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Dashboard Siswa
                    </h1>
                    <p className="text-muted-foreground">
                        Selamat datang, {siswa.nama} ({siswa.nis}) -{' '}
                        {[
                            siswa.kelas.tingkat,
                            siswa.kelas.jurusan?.singkatan,
                            siswa.kelas.nama_kelas
                        ].filter(Boolean).join(' ')}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/50">
                                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    Total Hadir
                                </p>
                                <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                    {stats.hadir}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/50">
                                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    Total Sakit
                                </p>
                                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {stats.sakit}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/50">
                                <FileWarning className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                    Total Izin
                                </p>
                                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                    {stats.izin}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/50">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                    Total Alfa
                                </p>
                                <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {stats.alpha}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20 col-span-2 md:col-span-1">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/50">
                                <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                    Total Dispensasi
                                </p>
                                <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                                    {stats.dispensasi}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Kehadiran</CardTitle>
                        <CardDescription>
                            Log data absensi Anda dari waktu ke waktu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex overflow-x-auto border-b mb-4 pb-[1px] gap-4">
                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((day) => (
                                <button
                                    key={day}
                                    onClick={() => setActiveTab(day as any)}
                                    className={`whitespace-nowrap pb-2 text-sm font-medium transition-all ${
                                        activeTab === day
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'border-b-2 border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">
                                            Tanggal
                                        </TableHead>
                                        <TableHead className="min-w-[150px]">
                                            Mata Pelajaran
                                        </TableHead>
                                        <TableHead className="w-[120px]">
                                            Jam Ke-
                                        </TableHead>
                                        <TableHead className="w-[120px]">
                                            Status
                                        </TableHead>
                                        <TableHead>Keterangan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedHistory[activeTab].length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-24 text-center"
                                            >
                                                Belum ada data riwayat absensi untuk hari {activeTab}.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedHistory[activeTab].map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {record.tanggal}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold text-foreground">
                                                    {record.mapel?.nama_mapel || <span className="text-muted-foreground opacity-50 font-normal">-</span>}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {record.jam_ke ? (
                                                        <span className="flex flex-col">
                                                            <span>Jam {record.jam_ke}</span>
                                                            {record.waktu_mulai && (
                                                                <span className="text-[10px] text-muted-foreground font-sans">
                                                                    {record.waktu_mulai} - {record.waktu_selesai || 'Selesai'}
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(
                                                        record.status,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {record.keterangan || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SiswaDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: siswaDashboard.url() }],
};
