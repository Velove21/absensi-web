import { Head, useForm, router } from '@inertiajs/react';
import { Edit2, Trash2, Plus, Save, Library } from 'lucide-react';
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
import adminKategoriPembelajaran from '@/routes/admin/kategori-pembelajaran';

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
    const [showForm, setShowForm] = useState(false);

    useAutoRefresh(true, 5000);

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
                    router.reload({ only: ['kategoriPembelajaran'], preserveScroll: true, preserveUrl: true } as unknown as never);
                },
            });
        } else {
            post(adminKategoriPembelajaran.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Kategori berhasil ditambahkan');
                    router.reload({ only: ['kategoriPembelajaran'], preserveScroll: true, preserveUrl: true } as unknown as never);
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
        setShowForm(true);
    };

    const handleCancel = () => {
        setEditingKategori(null);
        setShowForm(false);
        reset();
        clearErrors();
    };

    const handleOpenCreate = () => {
        setEditingKategori(null);
        reset();
        clearErrors();
        setShowForm(true);
    };

    const executeDelete = () => {
        if (!deletingKategoriId) {
            return;
        }

        router.delete(adminKategoriPembelajaran.destroy.url({ kategori_pembelajaran: deletingKategoriId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kategori berhasil dihapus');
                setDeletingKategoriId(null);
                router.reload({ only: ['kategoriPembelajaran'], preserveScroll: true, preserveUrl: true } as unknown as never);
            },
            onError: () => setDeletingKategoriId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Kategori Pelajaran" />
            <div className="flex h-full w-full flex-1 flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Kategori Pelajaran</h1>
                        <p className="text-muted-foreground">
                            Kelola kategori pelajaran untuk sekolah yang memiliki pengelompokan pelajaran (contoh: MPU, KK).
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <CsvImport entity="kategori-pembelajaran" title="Impor Kategori" description="Header: nama_kategori, kode" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    <th scope="col" className="px-3 py-2 w-16">No</th>
                                    <th scope="col" className="px-3 py-2">Nama Kategori</th>
                                    <th scope="col" className="px-3 py-2">Kode</th>
                                    <th scope="col" className="px-3 py-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {kategoriPembelajaran.data.map((kategori, index) => (
                                    <tr
                                        key={kategori.id}
                                        className={`group text-xs transition-colors hover:bg-muted/30 ${editingKategori?.id === kategori.id ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-3 py-2.5 text-muted-foreground">{index + 1}</td>
                                        <td className="px-3 py-2.5 font-medium text-foreground">{kategori.nama_kategori}</td>
                                        <td className="px-3 py-2.5 text-muted-foreground">{kategori.kode}</td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(kategori)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingKategoriId(kategori.id)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {kategoriPembelajaran.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Library className="h-8 w-8 opacity-20" />
                                                <p className="text-sm">Belum ada data kategori pelajaran.</p>
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

            <Dialog open={showForm} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingKategori ? (
                                <>
                                    <Edit2 className="h-4 w-4 text-primary" /> Edit Kategori
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 text-primary" /> Tambah Kategori
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nama_kategori">Nama Kategori</Label>
                            <Input
                                id="nama_kategori"
                                value={data.nama_kategori}
                                onChange={(e) => setData('nama_kategori', e.target.value)}
                                placeholder="Contoh: Mata Pelajaran Umum"
                                className="bg-muted/30"
                                maxLength={255}
                            />
                            {errors.nama_kategori && <p className="text-xs text-destructive">{errors.nama_kategori}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kode">Kode</Label>
                            <Input
                                id="kode"
                                value={data.kode}
                                onChange={(e) => setData('kode', e.target.value)}
                                placeholder="Contoh: MPU"
                                className="bg-muted/30"
                                maxLength={20}
                            />
                            {errors.kode && <p className="text-xs text-destructive">{errors.kode}</p>}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="flex-1">
                                {processing ? 'Proses...' : editingKategori ? <><Save className="mr-2 h-4 w-4" /> Update</> : <><Plus className="mr-2 h-4 w-4" /> Simpan</>}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deletingKategoriId !== null} onOpenChange={(open) => !open && setDeletingKategoriId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>Apakah Anda yakin ingin menghapus kategori pelajaran ini?</AlertDialogDescription>
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
        { title: 'Admin', href: adminDashboard.url() },
        { title: 'Kategori Pelajaran', href: adminKategoriPembelajaran.index.url() },
    ],
};
