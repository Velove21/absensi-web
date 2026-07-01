import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import adminJurusan from '@/routes/admin/jurusan';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, Trash2, X, Plus, Save, School } from 'lucide-react';
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

interface Jurusan {
    id: number;
    nama_jurusan: string;
    singkatan: string;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function JurusanIndex({ jurusans }: { jurusans: PaginatedData<Jurusan> }) {
    const [editingJurusan, setEditingJurusan] = useState<Jurusan | null>(null);
    const [deletingJurusanId, setDeletingJurusanId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_jurusan: '',
        singkatan: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingJurusan) {
            put(adminJurusan.update.url({ jurusan: editingJurusan.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Jurusan berhasil diperbarui');
                },
            });
        } else {
            post(adminJurusan.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Jurusan berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (jurusan: Jurusan) => {
        setEditingJurusan(jurusan);
        clearErrors();
        setData({
            nama_jurusan: jurusan.nama_jurusan,
            singkatan: jurusan.singkatan || '',
        });
    };

    const handleCancel = () => {
        setEditingJurusan(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingJurusanId) return;
        router.delete(adminJurusan.destroy.url({ jurusan: deletingJurusanId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Jurusan berhasil dihapus');
                setDeletingJurusanId(null);
            },
            onError: () => setDeletingJurusanId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Jurusan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Manajemen Jurusan
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola data program studi/jurusan sekolah.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Input */}
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingJurusan ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Jurusan</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Jurusan</>
                                    )}
                                </h2>
                                {editingJurusan && (
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
                                    <Label htmlFor="nama_jurusan">Nama Jurusan</Label>
                                    <Input
                                        id="nama_jurusan"
                                        value={data.nama_jurusan}
                                        onChange={(e) =>
                                            setData('nama_jurusan', e.target.value)
                                        }
                                        placeholder="Contoh: Rekayasa Perangkat Lunak"
                                        className="bg-muted/30"
                                    />
                                    {errors.nama_jurusan && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama_jurusan}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="singkatan">Singkatan</Label>
                                    <Input
                                        id="singkatan"
                                        value={data.singkatan}
                                        onChange={(e) =>
                                            setData('singkatan', e.target.value)
                                        }
                                        placeholder="Contoh: RPL"
                                        className="bg-muted/30"
                                    />
                                    {errors.singkatan && (
                                        <p className="text-xs text-destructive">
                                            {errors.singkatan}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingJurusan && (
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
                                        ) : editingJurusan ? (
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
                                            <th scope="col" className="px-6 py-4">Nama Jurusan</th>
                                            <th scope="col" className="px-6 py-4">Singkatan</th>
                                            <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {jurusans.data.map((jurusan) => (
                                            <tr
                                                key={jurusan.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingJurusan?.id === jurusan.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {jurusan.nama_jurusan}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">
                                                    {jurusan.singkatan || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(jurusan)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingJurusanId(jurusan.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {jurusans.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <School className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data jurusan.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={jurusans.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingJurusanId !== null} onOpenChange={(open) => !open && setDeletingJurusanId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jurusan ini? Semua data kelas dan siswa terkait akan terhapus.
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

JurusanIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Jurusan', href: adminJurusan.index.url() },
    ],
};
