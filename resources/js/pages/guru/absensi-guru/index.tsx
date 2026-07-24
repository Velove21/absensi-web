import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileWarning, UserCircle, Calendar } from 'lucide-react';
import absensiGuru from '@/routes/guru/absensi-guru';

interface TeacherAbsensi {
    id: number;
    status: 'hadir' | 'izin' | 'sakit';
    keterangan: string | null;
}

interface Props {
    todayAbsensi: TeacherAbsensi | null;
    tanggal: string;
}

export default function GuruAbsensiGuruIndex({ todayAbsensi, tanggal }: Props) {
    const [keterangan, setKeterangan] = useState(todayAbsensi?.keterangan || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (status: string) => {
        if (['izin', 'sakit'].includes(status) && !keterangan.trim()) {
            toast.error('Silakan isi alasan terlebih dahulu.');
            return;
        }

        setLoading(true);

        router.post(
            absensiGuru.store.url(),
            {
                status,
                keterangan: ['izin', 'sakit'].includes(status) ? keterangan.trim() : null,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kehadiran berhasil dicatat.');
                    setLoading(false);
                },
                onError: () => {
                    setLoading(false);
                },
            }
        );
    };

    const statusLabel = (s: string) => {
        switch (s) {
            case 'hadir': return 'Hadir';
            case 'izin': return 'Izin';
            case 'sakit': return 'Sakit';
            default: return s;
        }
    };

    return (
        <>
            <Head title="Absensi Guru" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Absensi Guru
                    </h1>
                    <p className="text-muted-foreground">
                        Catat kehadiran Anda hari ini.
                    </p>
                </div>

                <div className="max-w-lg mx-auto w-full">
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-8 shadow-sm dark:border-sidebar-border">
                        <div className="flex flex-col items-center gap-6">
                            <div className="rounded-full bg-primary/10 p-4">
                                <UserCircle className="h-12 w-12 text-primary" />
                            </div>

                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {tanggal}
                                </p>
                            </div>

                            {todayAbsensi ? (
                                <div className="text-center space-y-4 w-full">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="font-semibold">Sudah absen: {statusLabel(todayAbsensi.status)}</span>
                                    </div>
                                    {todayAbsensi.keterangan && (
                                        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                                            <span className="font-medium">Alasan:</span> {todayAbsensi.keterangan}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Status sudah tercatat untuk hari ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6 w-full">
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Silakan pilih status kehadiran Anda hari ini.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            disabled={loading}
                                            className="h-14 text-base font-semibold border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                                            onClick={() => handleSubmit('hadir')}
                                        >
                                            <CheckCircle className="mr-2 h-5 w-5" /> Hadir
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            disabled={loading}
                                            className="h-14 text-base font-semibold border-orange-500 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                                            onClick={() => handleSubmit('izin')}
                                        >
                                            <FileWarning className="mr-2 h-5 w-5" /> Izin
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            disabled={loading}
                                            className="h-14 text-base font-semibold border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                                            onClick={() => handleSubmit('sakit')}
                                        >
                                            <Clock className="mr-2 h-5 w-5" /> Sakit
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Alasan <span className="text-muted-foreground font-normal">(wajib untuk Izin/Sakit)</span>
                                        </label>
                                        <textarea
                                            placeholder="Tuliskan alasan izin/sakit..."
                                            value={keterangan}
                                            onChange={(e) => setKeterangan(e.target.value)}
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
