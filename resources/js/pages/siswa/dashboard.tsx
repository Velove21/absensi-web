import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { dashboard as siswaDashboard } from '@/routes/siswa';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
    ImageUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Absensi {
    id: number;
    tanggal: string;
    status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'dispensasi';
    keterangan: string | null;
    bukti: string | null;
    jam_ke: string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
}

interface Props {
    siswa: {
        id: number;
        nis: string;
        nama: string;
        kelas: {
            tingkat: string | null;
            nama_kelas: string;
            full_nama_kelas?: string;
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
    history: Absensi[];
}

export default function SiswaDashboard({ siswa, stats, history }: Props) {
    const [previewBukti, setPreviewBukti] = useState<string | null>(null);
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
                        {siswa.nama} — {siswa.kelas.full_nama_kelas || [
                            siswa.kelas.tingkat,
                            siswa.kelas.jurusan?.singkatan,
                            siswa.kelas.nama_kelas
                        ].filter(Boolean).join(' ')}
                    </h1>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20">
                        <CardContent className="flex items-center gap-3 p-4 md:p-6">
                            <div className="rounded-full bg-emerald-100 p-2 md:p-3 dark:bg-emerald-900/50">
                                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate">
                                    Hadir
                                </p>
                                <h3 className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                    {stats.hadir}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                        <CardContent className="flex items-center gap-3 p-4 md:p-6">
                            <div className="rounded-full bg-blue-100 p-2 md:p-3 dark:bg-blue-900/50">
                                <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                                    Sakit
                                </p>
                                <h3 className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {stats.sakit}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
                        <CardContent className="flex items-center gap-3 p-4 md:p-6">
                            <div className="rounded-full bg-orange-100 p-2 md:p-3 dark:bg-orange-900/50">
                                <FileWarning className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-medium text-orange-600 dark:text-orange-400 truncate">
                                    Izin
                                </p>
                                <h3 className="text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-300">
                                    {stats.izin}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                        <CardContent className="flex items-center gap-3 p-4 md:p-6">
                            <div className="rounded-full bg-red-100 p-2 md:p-3 dark:bg-red-900/50">
                                <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-medium text-red-600 dark:text-red-400 truncate">
                                    Alfa
                                </p>
                                <h3 className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-300">
                                    {stats.alpha}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20">
                        <CardContent className="flex items-center gap-3 p-4 md:p-6">
                            <div className="rounded-full bg-indigo-100 p-2 md:p-3 dark:bg-indigo-900/50">
                                <Award className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                    Dispensasi
                                </p>
                                <h3 className="text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                                    {stats.dispensasi}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Kehadiran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">
                                            Tanggal
                                        </TableHead>
                                        <TableHead className="w-[100px]">
                                            Jam Ke-
                                        </TableHead>
                                        <TableHead className="w-[120px]">
                                            Status
                                        </TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="w-[80px]">
                                            Bukti
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-24 text-center"
                                            >
                                                Belum ada data riwayat absensi.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        {record.tanggal}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {record.status === 'dispensasi' && record.jam_ke ? (
                                                        <span className="flex flex-col">
                                                            <span>{record.jam_ke}</span>
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
                                                    {getStatusBadge(record.status)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                                    {record.keterangan || '-'}
                                                </TableCell>
                                                <TableCell>
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

SiswaDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: siswaDashboard.url() }],
};
