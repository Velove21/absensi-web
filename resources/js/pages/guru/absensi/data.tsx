import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import absensiData from '@/routes/guru/data-absensi';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BookOpen, Calendar, Users, TableProperties, CheckCircle, Clock, FileWarning, XCircle, Award, ImageUp } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

interface AbsensiRecord {
    id: number;
    siswa_id: number;
    mapel_id: number;
    tanggal: string;
    jam_ke: string;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'dispensasi';
    keterangan: string | null;
    bukti: string | null;
    siswa: {
        id: number;
        nis: string;
        nama: string;
    };
}

interface Props {
    kelasList: Kelas[];
    mataPelajarans: MataPelajaran[];
    filters: {
        kelas_id: string | null;
        mapel_id: string | null;
        tanggal: string;
    };
    absensis: AbsensiRecord[];
}

export default function GuruDataAbsensi({
    kelasList,
    mataPelajarans = [],
    filters,
    absensis = [],
}: Props) {
    const [previewBukti, setPreviewBukti] = useState<string | null>(null);
    const handleFilterChange = (key: keyof Props['filters'], value: string) => {
        const newFilters = { ...filters, [key]: value };
        
        // If changing kelas, reset mapel
        if (key === 'kelas_id') {
            newFilters.mapel_id = '';
        }

        router.get(
            absensiData.index.url(),
            newFilters,
            { preserveState: true, preserveScroll: true },
        );
    };

    const formatKelasName = (k: Kelas) => {
        if (k.full_nama_kelas) return k.full_nama_kelas;
        
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
            <Head title="Lihat Data Absensi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Laporan Kehadiran Siswa
                    </h1>
                    <p className="text-muted-foreground">
                        Tinjau riwayat absensi berdasarkan kelas, mata pelajaran, dan tanggal.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Filter Panel */}
                    <div className="col-span-1 space-y-6">
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border sticky top-6">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" /> Filter Data
                                </h2>
                            </div>

                            <div className="space-y-4">
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
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Kelas</label>
                                    <Select
                                        value={filters.kelas_id || undefined}
                                        onValueChange={(val) =>
                                            handleFilterChange('kelas_id', val)
                                        }
                                    >
                                        <SelectTrigger className="bg-muted/30">
                                            <SelectValue placeholder="Pilih Kelas..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kelasList.map((kelas) => (
                                                <SelectItem
                                                    key={kelas.id}
                                                    value={kelas.id.toString()}
                                                >
                                                    {formatKelasName(kelas)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filters.kelas_id && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <label className="text-sm font-medium">Mata Pelajaran</label>
                                        <Select
                                            value={filters.mapel_id || undefined}
                                            onValueChange={(val) =>
                                                handleFilterChange('mapel_id', val)
                                            }
                                        >
                                            <SelectTrigger className="bg-muted/30">
                                                <SelectValue placeholder="Pilih Mapel..." />
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
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="col-span-1 lg:col-span-3">
                        {filters.kelas_id && filters.mapel_id ? (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border overflow-hidden flex flex-col animate-in fade-in duration-200">
                                <div className="p-6 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            Rekap Absensi
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Menampilkan absensi yang dicatat pada {filters.tanggal}.
                                        </p>
                                    </div>
                                    <div className="flex flex-col text-xs text-muted-foreground md:text-right font-medium shrink-0 gap-1 bg-muted/40 p-3 rounded-lg border border-sidebar-border/70">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-primary" /> {filters.tanggal}
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 w-12 text-center">No</th>
                                                <th className="px-6 py-4 w-24">Jam Ke</th>
                                                <th className="px-6 py-4">Waktu</th>
                                                <th className="px-6 py-4">NIS</th>
                                                <th className="px-6 py-4">Nama Siswa</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Keterangan</th>
                                                <th className="px-6 py-4">Bukti</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                            {absensis.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={8}
                                                        className="px-6 py-12 text-center text-muted-foreground"
                                                    >
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Users className="h-8 w-8 opacity-20" />
                                                            <p>Tidak ada data absensi untuk filter ini.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                absensis.map((record, index) => (
                                                    <tr key={record.id} className="group transition-colors hover:bg-muted/30">
                                                        <td className="px-6 py-4 text-center text-muted-foreground">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium">
                                                            {record.jam_ke}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                                            {record.waktu_mulai && record.waktu_selesai 
                                                                ? `${record.waktu_mulai} - ${record.waktu_selesai}` 
                                                                : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs font-medium">
                                                            {record.siswa.nis}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-foreground">
                                                            {record.siswa.nama}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={record.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-muted-foreground truncate max-w-[200px]" title={record.keterangan || ''}>
                                                            {record.keterangan || '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
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
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center border border-dashed border-sidebar-border/70 bg-card rounded-xl p-12 text-center h-[400px]">
                                <TableProperties className="h-12 w-12 text-primary opacity-25 mb-4 animate-pulse" />
                                <h3 className="text-lg font-semibold">Data Belum Ditampilkan</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    Silakan pilih Kelas dan Mata Pelajaran di panel sebelah kiri untuk melihat laporan data absensi.
                                </p>
                            </div>
                        )}
                    </div>
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
