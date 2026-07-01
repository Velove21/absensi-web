import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import adminKelas from '@/routes/admin/kelas';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, Trash2, X, Plus, Save, Layers } from 'lucide-react';
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

interface JenjangKelas {
    id: number;
    nama_jenjang: string;
}

interface Kelas {
    id: number;
    jurusan_id: number;
    jenjang_kelas_id: number | null;
    nama_kelas: string;
    full_nama_kelas: string;
    jurusan?: Jurusan;
    jenjang_kelas?: JenjangKelas;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function KelasIndex({
    kelas,
    jurusans,
    jenjangKelasList,
}: {
    kelas: PaginatedData<Kelas>;
    jurusans: Jurusan[];
    jenjangKelasList: JenjangKelas[];
}) {
    const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
    const [deletingKelasId, setDeletingKelasId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        jurusan_id: '',
        jenjang_kelas_id: '',
        nama_kelas: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingKelas) {
            put(adminKelas.update.url({ kela: editingKelas.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Kelas berhasil diperbarui');
                },
            });
        } else {
            post(adminKelas.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Kelas berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (k: Kelas) => {
        setEditingKelas(k);
        clearErrors();
        setData({
            jurusan_id: k.jurusan_id ? k.jurusan_id.toString() : '',
            jenjang_kelas_id: k.jenjang_kelas_id ? k.jenjang_kelas_id.toString() : '',
            nama_kelas: k.nama_kelas,
        });
    };

    const handleCancel = () => {
        setEditingKelas(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingKelasId) return;
        router.delete(adminKelas.destroy.url({ kela: deletingKelasId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kelas berhasil dihapus');
                setDeletingKelasId(null);
            },
            onError: () => setDeletingKelasId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Kelas" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Manajemen Kelas
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola data tingkat dan pembagian kelas siswa.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Input */}
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingKelas ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Kelas</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Kelas</>
                                    )}
                                </h2>
                                {editingKelas && (
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
                                    <Label htmlFor="jenjang_kelas_id">Jenjang / Tingkat (Opsional)</Label>
                                    <select
                                        id="jenjang_kelas_id"
                                        className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        value={data.jenjang_kelas_id}
                                        onChange={(e) =>
                                            setData('jenjang_kelas_id', e.target.value)
                                        }
                                    >
                                        <option value="">Tanpa Tingkat / Jenjang</option>
                                        {jenjangKelasList.map((j) => (
                                            <option key={j.id} value={j.id}>
                                                {j.nama_jenjang}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.jenjang_kelas_id && (
                                        <p className="text-xs text-destructive">
                                            {errors.jenjang_kelas_id}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jurusan_id">Jurusan (Opsional)</Label>
                                    <select
                                        id="jurusan_id"
                                        className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        value={data.jurusan_id}
                                        onChange={(e) =>
                                            setData('jurusan_id', e.target.value)
                                        }
                                    >
                                        <option value="">Pilih Jurusan (Kosongkan jika bukan SMK)</option>
                                        {jurusans.map((j) => (
                                            <option key={j.id} value={j.id}>
                                                {j.nama_jurusan}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.jurusan_id && (
                                        <p className="text-xs text-destructive">
                                            {errors.jurusan_id}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nama_kelas">Nama Kelas</Label>
                                    <Input
                                        id="nama_kelas"
                                        value={data.nama_kelas}
                                        onChange={(e) =>
                                            setData('nama_kelas', e.target.value)
                                        }
                                        placeholder="Contoh: A, B, 1, RPL 1"
                                        className="bg-muted/30"
                                    />
                                    {errors.nama_kelas && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama_kelas}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingKelas && (
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
                                        ) : editingKelas ? (
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
                                            <th scope="col" className="px-6 py-4">Nama Kelas</th>
                                            <th scope="col" className="px-6 py-4">Jurusan</th>
                                            <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {kelas.data.map((k) => (
                                            <tr
                                                key={k.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingKelas?.id === k.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {k.full_nama_kelas}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {k.jurusan?.nama_jurusan}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(k)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingKelasId(k.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {kelas.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Layers className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data kelas.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={kelas.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingKelasId !== null} onOpenChange={(open) => !open && setDeletingKelasId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kelas ini? Semua data siswa terkait akan terhapus.
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

KelasIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Kelas', href: adminKelas.index.url() },
    ],
};
