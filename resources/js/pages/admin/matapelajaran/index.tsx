import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import adminMataPelajaran from '@/routes/admin/matapelajaran';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, Trash2, X, Plus, Save, BookOpen, GraduationCap, AlertCircle } from 'lucide-react';
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

interface KategoriPembelajaran {
    id: number;
    nama_kategori: string;
    kode: string;
}

interface MataPelajaran {
    id: number;
    nama_mapel: string;
    kategori_pembelajaran_id: number;
    jurusan_id: number | null;
    jurusan?: Jurusan;
    kategori_pembelajaran?: KategoriPembelajaran;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function MataPelajaranIndex({
    matapelajarans,
    jurusans,
    kategoriPembelajarans,
}: {
    matapelajarans: PaginatedData<MataPelajaran>;
    jurusans: Jurusan[];
    kategoriPembelajarans: KategoriPembelajaran[];
}) {
    const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
    const [deletingMapelId, setDeletingMapelId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_mapel: '',
        kategori_pembelajaran_id: '',
        jurusan_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMapel) {
            put(adminMataPelajaran.update.url({ matapelajaran: editingMapel.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Mata Pelajaran berhasil diperbarui');
                },
            });
        } else {
            post(adminMataPelajaran.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Mata Pelajaran berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (m: MataPelajaran) => {
        setEditingMapel(m);
        clearErrors();
        setData({
            nama_mapel: m.nama_mapel,
            kategori_pembelajaran_id: m.kategori_pembelajaran_id.toString(),
            jurusan_id: m.jurusan_id ? m.jurusan_id.toString() : '',
        });
    };

    const handleCancel = () => {
        setEditingMapel(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingMapelId) return;
        router.delete(adminMataPelajaran.destroy.url({ matapelajaran: deletingMapelId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Mata Pelajaran berhasil dihapus');
                setDeletingMapelId(null);
            },
            onError: () => setDeletingMapelId(null),
        });
    };

    const isKkSelected = () => {
        if (!data.kategori_pembelajaran_id) return false;
        const selectedKategori = kategoriPembelajarans.find(
            (k) => k.id.toString() === data.kategori_pembelajaran_id
        );
        return selectedKategori?.kode === 'KK';
    };

    return (
        <>
            <Head title="Manajemen Mata Pelajaran" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Manajemen Mata Pelajaran
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola kurikulum, mata pelajaran, dan kategorinya.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Input */}
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingMapel ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Mapel</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Mapel</>
                                    )}
                                </h2>
                                {editingMapel && (
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
                                    <Label htmlFor="nama_mapel">Nama Mata Pelajaran</Label>
                                    <Input
                                        id="nama_mapel"
                                        value={data.nama_mapel}
                                        onChange={(e) =>
                                            setData('nama_mapel', e.target.value)
                                        }
                                        placeholder="Contoh: Matematika, Pemrograman Web"
                                        className="bg-muted/30"
                                        required
                                    />
                                    {errors.nama_mapel && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama_mapel}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kategori_pembelajaran_id">Kategori</Label>
                                    <select
                                        id="kategori_pembelajaran_id"
                                        className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        value={data.kategori_pembelajaran_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setData((prev) => ({
                                                ...prev,
                                                kategori_pembelajaran_id: val,
                                                jurusan_id: val === '' ? prev.jurusan_id : (kategoriPembelajarans.find(k => k.id.toString() === val)?.kode === 'KK' ? prev.jurusan_id : '')
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {kategoriPembelajarans.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.nama_kategori} ({k.kode})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.kategori_pembelajaran_id && (
                                        <p className="text-xs text-destructive">
                                            {errors.kategori_pembelajaran_id}
                                        </p>
                                    )}
                                </div>

                                {isKkSelected() && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <Label htmlFor="jurusan_id" className="flex items-center gap-1">
                                            Spesialisasi Jurusan <span className="text-destructive">*</span>
                                        </Label>
                                        <select
                                            id="jurusan_id"
                                            className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none border-primary/50 focus:border-primary"
                                            value={data.jurusan_id}
                                            onChange={(e) =>
                                                setData('jurusan_id', e.target.value)
                                            }
                                        >
                                            <option value="">Pilih Jurusan Terkait</option>
                                            {jurusans.map((j) => (
                                                <option key={j.id} value={j.id}>
                                                    {j.nama_jurusan} ({j.singkatan})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3 text-primary" /> Mapel ini hanya akan muncul untuk jurusan ini.
                                        </p>
                                        {errors.jurusan_id && (
                                            <p className="text-xs text-destructive">
                                                {errors.jurusan_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    {editingMapel && (
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
                                        ) : editingMapel ? (
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
                                            <th scope="col" className="px-6 py-4">Mata Pelajaran</th>
                                            <th scope="col" className="px-6 py-4">Kategori</th>
                                            <th scope="col" className="px-6 py-4">Spesialisasi Jurusan</th>
                                            <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {matapelajarans.data.map((m) => (
                                            <tr
                                                key={m.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingMapel?.id === m.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {m.nama_mapel}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                        m.kategori_pembelajaran?.kode === 'MPU' 
                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' 
                                                            : 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20'
                                                    }`}>
                                                        {m.kategori_pembelajaran?.nama_kategori}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {m.jurusan ? (
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            <GraduationCap className="h-4 w-4 text-primary" /> {m.jurusan.nama_jurusan} ({m.jurusan.singkatan})
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground opacity-60">- (Semua Jurusan)</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(m)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingMapelId(m.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {matapelajarans.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <BookOpen className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data mata pelajaran.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={matapelajarans.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingMapelId !== null} onOpenChange={(open) => !open && setDeletingMapelId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus mata pelajaran ini? Semua data riwayat absensi yang terikat pada mapel ini juga akan terhapus.
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

MataPelajaranIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Mata Pelajaran', href: adminMataPelajaran.index.url() },
    ],
};
