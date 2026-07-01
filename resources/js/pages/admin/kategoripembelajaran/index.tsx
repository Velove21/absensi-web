import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import adminKategoriPembelajaran from '@/routes/admin/kategori-pembelajaran';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, Trash2, X, Plus, Save, Library } from 'lucide-react';
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

interface KategoriPembelajaran {
    id: number;
    nama_kategori: string;
    kode: string;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function KategoriPembelajaranIndex({
    kategoriPembelajaran,
}: {
    kategoriPembelajaran: PaginatedData<KategoriPembelajaran>;
}) {
    const [editingKategori, setEditingKategori] = useState<KategoriPembelajaran | null>(null);
    const [deletingKategoriId, setDeletingKategoriId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_kategori: '',
        kode: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingKategori) {
            put(adminKategoriPembelajaran.update.url({ kategori_pembelajaran: editingKategori.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Kategori berhasil diperbarui');
                },
            });
        } else {
            post(adminKategoriPembelajaran.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Kategori berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (kategori: KategoriPembelajaran) => {
        setEditingKategori(kategori);
        clearErrors();
        setData({ 
            nama_kategori: kategori.nama_kategori,
            kode: kategori.kode,
        });
    };

    const handleCancel = () => {
        setEditingKategori(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingKategoriId) return;
        router.delete(adminKategoriPembelajaran.destroy.url({ kategori_pembelajaran: deletingKategoriId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kategori berhasil dihapus');
                setDeletingKategoriId(null);
            },
            onError: () => setDeletingKategoriId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Kategori Pembelajaran" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Kategori Pembelajaran
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola kategori mata pelajaran (contoh: MPU, KK).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Input */}
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingKategori ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Kategori</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Kategori</>
                                    )}
                                </h2>
                                {editingKategori && (
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
                                    <Label htmlFor="nama_kategori">Nama Kategori</Label>
                                    <Input
                                        id="nama_kategori"
                                        value={data.nama_kategori}
                                        onChange={(e) =>
                                            setData('nama_kategori', e.target.value)
                                        }
                                        placeholder="Contoh: Mata Pelajaran Umum"
                                        className="bg-muted/30"
                                        maxLength={255}
                                    />
                                    {errors.nama_kategori && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama_kategori}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kode">Kode</Label>
                                    <Input
                                        id="kode"
                                        value={data.kode}
                                        onChange={(e) =>
                                            setData('kode', e.target.value)
                                        }
                                        placeholder="Contoh: MPU"
                                        className="bg-muted/30"
                                        maxLength={20}
                                    />
                                    {errors.kode && (
                                        <p className="text-xs text-destructive">
                                            {errors.kode}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingKategori && (
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
                                        ) : editingKategori ? (
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
                                            <th scope="col" className="px-6 py-4 w-16">
                                                No
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Nama Kategori
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Kode
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
                                        {kategoriPembelajaran.data.map((kategori, index) => (
                                            <tr
                                                key={kategori.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingKategori?.id === kategori.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {kategori.nama_kategori}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {kategori.kode}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(kategori)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingKategoriId(kategori.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {kategoriPembelajaran.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Library className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data kategori pembelajaran.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={kategoriPembelajaran.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingKategoriId !== null} onOpenChange={(open) => !open && setDeletingKategoriId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kategori pembelajaran ini? 
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

KategoriPembelajaranIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Kategori Pembelajaran', href: adminKategoriPembelajaran.index.url() },
    ],
};
