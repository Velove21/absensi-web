import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import adminDurasiPembelajaran from '@/routes/admin/durasi-pembelajaran';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, Trash2, X, Plus, Save, Clock } from 'lucide-react';
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
import Pagination from '@/components/pagination';

interface DurasiPembelajaran {
    id: number;
    hari: string;
    jam_ke: number;
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
}: {
    durasiPembelajaran: PaginatedData<DurasiPembelajaran>;
}) {
    const [editingDurasi, setEditingDurasi] = useState<DurasiPembelajaran | null>(null);
    const [deletingDurasiId, setDeletingDurasiId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        hari: 'Senin',
        jam_ke: 1,
        waktu_mulai: '07:00',
        waktu_selesai: '07:45',
    });

    const formatTime = (timeString: string) => {
        // timeString is like "07:00:00", we want "07:00"
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
                },
            });
        } else {
            post(adminDurasiPembelajaran.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    // keep hari, increment jam_ke, calculate new start/end
                    setData(prev => ({
                        ...prev,
                        jam_ke: Number(prev.jam_ke) + 1,
                        waktu_mulai: prev.waktu_selesai, // new start = old end
                    }));
                    toast.success('Durasi pembelajaran berhasil ditambahkan');
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
    };

    const handleCancel = () => {
        setEditingDurasi(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingDurasiId) return;
        router.delete(adminDurasiPembelajaran.destroy.url({ durasi_pembelajaran: deletingDurasiId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Durasi pembelajaran berhasil dihapus');
                setDeletingDurasiId(null);
            },
            onError: () => setDeletingDurasiId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Durasi Pembelajaran" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Durasi Pembelajaran
                        </h1>
                        <p className="text-muted-foreground">
                            Atur jadwal dan durasi jam pelajaran setiap harinya.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Input */}
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingDurasi ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Durasi</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Durasi</>
                                    )}
                                </h2>
                                {editingDurasi && (
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
                                    <Label htmlFor="hari">Hari</Label>
                                    <select
                                        id="hari"
                                        className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        value={data.hari}
                                        onChange={(e) =>
                                            setData('hari', e.target.value)
                                        }
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
                                    {errors.hari && (
                                        <p className="text-xs text-destructive">
                                            {errors.hari}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="jam_ke">Jam Ke-</Label>
                                    <Input
                                        id="jam_ke"
                                        type="number"
                                        min="1"
                                        value={data.jam_ke}
                                        onChange={(e) =>
                                            setData('jam_ke', parseInt(e.target.value) || 1)
                                        }
                                        className="bg-muted/30"
                                    />
                                    {errors.jam_ke && (
                                        <p className="text-xs text-destructive">
                                            {errors.jam_ke}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="waktu_mulai">Waktu Mulai</Label>
                                        <Input
                                            id="waktu_mulai"
                                            type="time"
                                            value={data.waktu_mulai}
                                            onChange={(e) =>
                                                setData('waktu_mulai', e.target.value)
                                            }
                                            className="bg-muted/30"
                                        />
                                        {errors.waktu_mulai && (
                                            <p className="text-xs text-destructive">
                                                {errors.waktu_mulai}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="waktu_selesai">Waktu Selesai</Label>
                                        <Input
                                            id="waktu_selesai"
                                            type="time"
                                            value={data.waktu_selesai}
                                            onChange={(e) =>
                                                setData('waktu_selesai', e.target.value)
                                            }
                                            className="bg-muted/30"
                                        />
                                        {errors.waktu_selesai && (
                                            <p className="text-xs text-destructive">
                                                {errors.waktu_selesai}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingDurasi && (
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
                                        ) : editingDurasi ? (
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
                    <div className="col-span-1 lg:col-span-2 space-y-4">
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">
                                                Hari
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Jam Ke-
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Waktu Mulai
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Waktu Selesai
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-4 text-right"
                                            >
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {durasiPembelajaran.data.map((durasi) => (
                                            <tr
                                                key={durasi.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingDurasi?.id === durasi.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {durasi.hari}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    Jam ke-{durasi.jam_ke}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {formatTime(durasi.waktu_mulai)}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {formatTime(durasi.waktu_selesai)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(durasi)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingDurasiId(durasi.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {durasiPembelajaran.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Clock className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data durasi pembelajaran.</p>
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
            </div>

            <AlertDialog open={deletingDurasiId !== null} onOpenChange={(open) => !open && setDeletingDurasiId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jadwal durasi ini?
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

DurasiPembelajaranIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Durasi Pembelajaran', href: adminDurasiPembelajaran.index.url() },
    ],
};
