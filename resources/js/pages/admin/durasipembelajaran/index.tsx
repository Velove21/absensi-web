import { Head, useForm, router } from '@inertiajs/react';
import { Clock, Edit2, Plus, Save, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CsvImport from '@/components/csv-import';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminDurasiPembelajaran from '@/routes/admin/durasi-pembelajaran';

interface DurasiPembelajaran {
    id: number;
    hari: string;
    jam_ke: number;
    nama: string | null;
    waktu_mulai: string;
    waktu_selesai: string;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function DurasiPembelajaranIndex({
    durasiPembelajaran,
    filters,
}: {
    durasiPembelajaran: PaginatedData<DurasiPembelajaran>;
    filters: { hari: string | null };
}) {
    const [editingDurasi, setEditingDurasi] = useState<DurasiPembelajaran | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [searchHari, setSearchHari] = useState(filters?.hari ?? '');
    const [showForm, setShowForm] = useState(false);

    useAutoRefresh(true, 5000);

    const handleHariFilter = (value: string) => {
        setSearchHari(value);
        router.get(
            adminDurasiPembelajaran.index.url(),
            { hari: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        hari: 'Senin',
        jam_ke: 1,
        waktu_mulai: '07:00',
        waktu_selesai: '07:45',
    });

    const formatTime = (timeString: string) => {
        return timeString.substring(0, 5);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingDurasi) {
            put(adminDurasiPembelajaran.update.url({ durasi_pembelajaran: editingDurasi.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Durasi pembelajaran berhasil diperbarui');
                    router.reload({ only: ['durasiPembelajaran'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminDurasiPembelajaran.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    setData((prev) => ({
                        ...prev,
                        jam_ke: Number(prev.jam_ke) + 1,
                        waktu_mulai: prev.waktu_selesai,
                    }));
                    setShowForm(false);
                    toast.success('Durasi pembelajaran berhasil ditambahkan');
                    router.reload({ only: ['durasiPembelajaran'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        }
    };

    const handleEdit = (durasi: DurasiPembelajaran) => {
        setEditingDurasi(durasi);
        clearErrors();
        setData({
            hari: durasi.hari,
            jam_ke: durasi.jam_ke,
            waktu_mulai: formatTime(durasi.waktu_mulai),
            waktu_selesai: formatTime(durasi.waktu_selesai),
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setEditingDurasi(null);
        setShowForm(false);
        reset();
        clearErrors();
    };

    const handleOpenCreate = () => {
        setEditingDurasi(null);
        reset();
        clearErrors();
        setShowForm(true);
    };

    const executeDelete = () => {
        if (!deletingId) return;
        router.delete(adminDurasiPembelajaran.destroy.url({ durasi_pembelajaran: deletingId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Jam pembelajaran berhasil dihapus');
                setDeletingId(null);
                if (editingDurasi?.id === deletingId) handleCancel();
                router.reload({ only: ['durasiPembelajaran'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: () => setDeletingId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Durasi Pembelajaran" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Durasi Pembelajaran</h1>
                        <p className="text-muted-foreground">Atur jadwal dan durasi jam pelajaran setiap harinya.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleOpenCreate} className="bg-white text-black border border-zinc-200 shadow-xs hover:bg-zinc-50 dark:bg-white dark:text-black dark:border-zinc-200 dark:hover:bg-zinc-100">
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <CsvImport entity="durasi-pembelajaran" title="Impor Durasi" description="Header: hari, jam_ke, waktu_mulai, waktu_selesai" />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Cari Hari:</label>
                        <select
                            value={searchHari}
                            onChange={(e) => handleHariFilter(e.target.value)}
                            className="h-9 rounded-md border border-input bg-white px-3 py-1 text-xs text-black sm:text-sm [&>option]:bg-white [&>option]:text-black"
                        >
                            <option value="">Semua Hari (Senin-Minggu)</option>
                            <option value="Senin">Senin</option>
                            <option value="Selasa">Selasa</option>
                            <option value="Rabu">Rabu</option>
                            <option value="Kamis">Kamis</option>
                            <option value="Jumat">Jumat</option>
                            <option value="Sabtu">Sabtu</option>
                            <option value="Minggu">Minggu</option>
                        </select>
                        <span className="text-xs text-muted-foreground">Menampilkan: {durasiPembelajaran.data.length} data</span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th scope="col" className="px-3 py-2">
                                            Hari
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                            Jam Ke-
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                            Waktu Mulai
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                            Waktu Selesai
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {durasiPembelajaran.data.map((durasi) => (
                                        <tr
                                            key={durasi.id}
                                            className={`group text-xs transition-colors hover:bg-muted/30 ${editingDurasi?.id === durasi.id ? 'bg-primary/5' : ''}`}
                                        >
                                            <td className="px-3 py-2.5 font-medium text-foreground">{durasi.hari}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{durasi.jam_ke === 0 ? '-' : durasi.jam_ke}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{formatTime(durasi.waktu_mulai)}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{formatTime(durasi.waktu_selesai)}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(durasi)}
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeletingId(durasi.id)}
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        title="Hapus jam pembelajaran"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {durasiPembelajaran.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Clock className="h-8 w-8 opacity-20" />
                                                    <p className="text-sm">Belum ada data durasi pembelajaran.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination links={durasiPembelajaran.links} />
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingDurasi ? (
                                <>
                                    <Edit2 className="h-4 w-4 text-primary" /> Edit Durasi
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 text-primary" /> Tambah Durasi
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hari">Hari</Label>
                            <select
                                id="hari"
                                className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-xs shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:text-sm"
                                value={data.hari}
                                onChange={(e) => setData('hari', e.target.value)}
                                disabled={!!editingDurasi}
                            >
                                <option value="Senin">Senin</option>
                                <option value="Selasa">Selasa</option>
                                <option value="Rabu">Rabu</option>
                                <option value="Kamis">Kamis</option>
                                <option value="Jumat">Jumat</option>
                                <option value="Sabtu">Sabtu</option>
                                <option value="Minggu">Minggu</option>
                            </select>
                            {errors.hari && <p className="text-xs text-destructive">{errors.hari}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jam_ke">Jam Ke-</Label>
                            <Input
                                id="jam_ke"
                                type="number"
                                min="0"
                                value={data.jam_ke}
                                onChange={(e) => setData('jam_ke', parseInt(e.target.value) || 0)}
                                className="bg-muted/30"
                            />
                            {errors.jam_ke && <p className="text-xs text-destructive">{errors.jam_ke}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="waktu_mulai">Waktu Mulai</Label>
                                <Input
                                    id="waktu_mulai"
                                    type="time"
                                    value={data.waktu_mulai}
                                    onChange={(e) => setData('waktu_mulai', e.target.value)}
                                    className="bg-muted/30"
                                />
                                {errors.waktu_mulai && <p className="text-xs text-destructive">{errors.waktu_mulai}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="waktu_selesai">Waktu Selesai</Label>
                                <Input
                                    id="waktu_selesai"
                                    type="time"
                                    value={data.waktu_selesai}
                                    onChange={(e) => setData('waktu_selesai', e.target.value)}
                                    className="bg-muted/30"
                                />
                                {errors.waktu_selesai && <p className="text-xs text-destructive">{errors.waktu_selesai}</p>}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="flex-1">
                                {processing ? (
                                    'Proses...'
                                ) : editingDurasi ? (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Update
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" /> Simpan
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jam pembelajaran ini? Data yang sudah dihapus tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

DurasiPembelajaranIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Durasi Pembelajaran', href: adminDurasiPembelajaran.index.url() },
    ],
};
