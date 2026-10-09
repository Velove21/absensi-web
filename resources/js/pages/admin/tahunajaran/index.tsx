import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Edit2, Trash2, X, Plus, Save, CheckCircle2, ArrowUp, Archive } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Pagination from '@/components/pagination';
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
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CsvImport from '@/components/csv-import';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminTahunAjaran from '@/routes/admin/tahun-ajaran';

interface TahunAjaran {
    id: number;
    tahun_awal: string;
    tahun_akhir: string;
    is_active: boolean;
    arsip_presensis_count: number;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function TahunAjaranIndex({
    tahunAjarans,
    isNaikKelasAvailable,
}: {
    tahunAjarans: PaginatedData<TahunAjaran>;
    isNaikKelasAvailable: boolean;
}) {
    const [editingTahun, setEditingTahun] = useState<TahunAjaran | null>(null);
    const [deletingTahunId, setDeletingTahunId] = useState<number | null>(null);
    const [naikKelasOpen, setNaikKelasOpen] = useState(false);

    useAutoRefresh(true, 5000);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        tahun_awal: '',
        tahun_akhir: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTahun) {
            put(adminTahunAjaran.update.url({ tahun_ajaran: editingTahun.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Tahun ajaran berhasil diperbarui');
                    router.reload({ only: ['tahunAjarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminTahunAjaran.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Tahun ajaran berhasil ditambahkan');
                    router.reload({ only: ['tahunAjarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        }
    };

    const handleEdit = (tahun: TahunAjaran) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setEditingTahun(tahun);
        clearErrors();
        setData({
            tahun_awal: tahun.tahun_awal,
            tahun_akhir: tahun.tahun_akhir,
        });
    };

    const handleCancel = () => {
        setEditingTahun(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingTahunId) {
return;
}

        router.delete(adminTahunAjaran.destroy.url({ tahun_ajaran: deletingTahunId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Tahun ajaran berhasil dihapus');
                setDeletingTahunId(null);
                router.reload({ only: ['tahunAjarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: (errors) => {
                if (errors.active) {
toast.error(errors.active);
}

                setDeletingTahunId(null);
            },
        });
    };

    const handleActivate = (id: number) => {
        router.post(adminTahunAjaran.activate.url({ tahun_ajaran: id }), undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Tahun ajaran aktif berubah');
                router.reload({ only: ['tahunAjarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
        });
    };

    const handleNaikKelas = () => {
        router.post(adminTahunAjaran.naikKelas.url(), undefined, {
            preserveScroll: true,
            onSuccess: () => {
                setNaikKelasOpen(false);
                toast.success('Naik kelas berhasil');
                router.reload({ only: ['tahunAjarans'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: (errors) => {
                setNaikKelasOpen(false);

                if (errors.naik_kelas) {
toast.error(errors.naik_kelas);
}
            },
        });
    };

    return (
        <>
            <Head title="Manajemen Tahun Ajaran" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Tahun Ajaran
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola data tahun ajaran, proses kenaikan kelas, dan akses arsip presensi tahun sebelumnya.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <CsvImport entity="tahun-ajaran" title="Impor Tahun Ajaran" description="Header: tahun_awal, tahun_akhir" />
                        {isNaikKelasAvailable && (
                            <Dialog open={naikKelasOpen} onOpenChange={setNaikKelasOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="default">
                                        <ArrowUp className="mr-2 h-4 w-4" /> Naik Kelas
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Konfirmasi Naik Kelas</DialogTitle>
                                        <DialogDescription>
                                            Semua siswa akan dipindahkan ke kelas di jenjang berikutnya.
                                            Siswa di jenjang tertinggi akan ditandai sebagai lulus.
                                            Tindakan ini tidak dapat dibatalkan.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setNaikKelasOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button onClick={handleNaikKelas} disabled={processing}>
                                            {processing ? 'Proses...' : 'Ya, Naikkan Kelas'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
                    {/* Form Input */}
                    <div className="col-span-1 flex flex-col gap-6"><div className="sticky top-8 min-h-[260px] flex flex-col rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingTahun ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Tahun Ajaran</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Tahun Ajaran</>
                                    )}
                                </h2>
                                {editingTahun && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCancel}
                                        className="h-8 w-8 rounded-full"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tahun_awal">Tahun Awal</Label>
                                    <Input
                                        id="tahun_awal"
                                        value={data.tahun_awal}
                                        onChange={(e) =>
                                            setData('tahun_awal', e.target.value)
                                        }
                                        placeholder="Contoh: 2026"
                                        className="bg-muted/30"
                                        maxLength={4}
                                    />
                                    {errors.tahun_awal && (
                                        <p className="text-xs text-destructive">
                                            {errors.tahun_awal}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tahun_akhir">Tahun Akhir</Label>
                                    <Input
                                        id="tahun_akhir"
                                        value={data.tahun_akhir}
                                        onChange={(e) =>
                                            setData('tahun_akhir', e.target.value)
                                        }
                                        placeholder="Contoh: 2027"
                                        className="bg-muted/30"
                                        maxLength={4}
                                    />
                                    {errors.tahun_akhir && (
                                        <p className="text-xs text-destructive">
                                            {errors.tahun_akhir}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingTahun && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="flex-1"
                                        >
                                            Batal
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        {processing ? (
                                            'Proses...'
                                        ) : editingTahun ? (
                                            <><Save className="mr-2 h-4 w-4" /> Update</>
                                        ) : (
                                            <><Plus className="mr-2 h-4 w-4" /> Simpan</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Tahun Ajaran</th>
                                            <th scope="col" className="px-6 py-4">Status</th>
                                            <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {tahunAjarans.data.map((tahun) => (
                                            <tr
                                                key={tahun.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingTahun?.id === tahun.id ? 'bg-primary/5' : ''} ${tahun.is_active ? 'bg-green-50/30 dark:bg-green-950/10' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {tahun.tahun_awal}/{tahun.tahun_akhir}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {tahun.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Tidak Aktif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {!tahun.is_active && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleActivate(tahun.id)}
                                                                className="h-8 w-8 text-muted-foreground hover:text-green-600"
                                                                title="Aktifkan"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(tahun)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        {!tahun.is_active && tahun.arsip_presensis_count > 0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => router.visit(`/admin/tahun-ajaran/${tahun.id}/arsip`)}
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                title="Lihat Arsip"
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {!tahun.is_active && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeletingTahunId(tahun.id)}
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {tahunAjarans.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Calendar className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data tahun ajaran.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={tahunAjarans.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingTahunId !== null} onOpenChange={(open) => !open && setDeletingTahunId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus tahun ajaran ini?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

TahunAjaranIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Tahun Ajaran', href: adminTahunAjaran.index.url() },
    ],
};
