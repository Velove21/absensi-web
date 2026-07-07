import { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import adminGuru from '@/routes/admin/guru';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit2, Trash2, X, Plus, Save, Users, BookOpen, KeyRound, Search } from 'lucide-react';
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

interface Kelas {
    id: number;
    nama_kelas: string;
    full_nama_kelas: string;
    jurusan?: {
        singkatan: string;
    };
}

interface MataPelajaran {
    id: number;
    nama_mapel: string;
    kategori: string;
}

interface Guru {
    id: number;
    nip: string;
    nama: string;
    user?: {
        email: string;
        password_default: boolean;
    };
    kelas?: Kelas[];
    mataPelajarans?: MataPelajaran[];
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function GuruIndex({ 
    gurus,
    kelas,
    mataPelajarans
}: { 
    gurus: PaginatedData<Guru>;
    kelas: Kelas[];
    mataPelajarans: MataPelajaran[];
}) {
    const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
    const [deletingGuruId, setDeletingGuruId] = useState<number | null>(null);
    const [resettingPasswordGuruId, setResettingPasswordGuruId] = useState<number | null>(null);

    const [search, setSearch] = useState('');
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nip: '',
        nama: '',
        password: '',
        kelas_ids: [] as number[],
        mata_pelajaran_ids: [] as number[],
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setSearch(params.get('search') || '');
    }, []);

    const handleSearch = (value: string) => {
        setSearch(value);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(adminGuru.index.url(), { search: value || undefined }, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 400);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.nip.length !== 18) {
            toast.error('NIP harus terdiri dari 18 karakter');
            return;
        }

        if (editingGuru) {
            put(adminGuru.update.url({ guru: editingGuru.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Data guru berhasil diperbarui');
                },
            });
        } else {
            post(adminGuru.store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    toast.success('Guru berhasil ditambahkan', {
                        description: 'Akun guru telah dibuat dan siap digunakan.',
                    });
                },
            });
        }
    };

    const handleEdit = (guru: Guru) => {
        setEditingGuru(guru);
        clearErrors();
        setData({
            nip: guru.nip,
            nama: guru.nama,
            password: '',
            kelas_ids: guru.kelas ? guru.kelas.map(k => k.id) : [],
            mata_pelajaran_ids: guru.mataPelajarans ? guru.mataPelajarans.map(m => m.id) : [],
        });
    };

    const handleCancel = () => {
        setEditingGuru(null);
        reset();
        clearErrors();
    };

    const handleKelasToggle = (kelasId: number) => {
        const isSelected = data.kelas_ids.includes(kelasId);
        if (isSelected) {
            setData('kelas_ids', data.kelas_ids.filter(id => id !== kelasId));
        } else {
            setData('kelas_ids', [...data.kelas_ids, kelasId]);
        }
    };

    const handleMataPelajaranToggle = (mapelId: number) => {
        const isSelected = data.mata_pelajaran_ids.includes(mapelId);
        if (isSelected) {
            setData('mata_pelajaran_ids', data.mata_pelajaran_ids.filter(id => id !== mapelId));
        } else {
            setData('mata_pelajaran_ids', [...data.mata_pelajaran_ids, mapelId]);
        }
    };

    const executeDelete = () => {
        if (!deletingGuruId) return;
        router.delete(adminGuru.destroy.url({ guru: deletingGuruId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Guru berhasil dihapus');
                setDeletingGuruId(null);
            },
            onError: () => setDeletingGuruId(null),
        });
    };

    const executeResetPassword = () => {
        if (!resettingPasswordGuruId) return;
        router.post(adminGuru.resetPassword.url({ guru: resettingPasswordGuruId }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Password guru berhasil direset ke default (password)');
                setResettingPasswordGuruId(null);
            },
            onError: () => setResettingPasswordGuruId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Guru" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Guru
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola data, NIP, akun, dan penempatan guru.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Input */}
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingGuru ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Guru</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Guru</>
                                    )}
                                </h2>
                                {editingGuru && (
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
                                    <Label htmlFor="nip">NIP (Tepat 18 Karakter)</Label>
                                    <Input
                                        id="nip"
                                        value={data.nip}
                                        onChange={(e) => {
                                            // only allow digits if desired, but here just standard input limit
                                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 18);
                                            setData('nip', val);
                                        }}
                                        placeholder="Contoh: 198001012010011001"
                                        className={`bg-muted/30 ${data.nip.length > 0 && data.nip.length !== 18 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                        maxLength={18}
                                    />
                                    {data.nip.length > 0 && data.nip.length !== 18 && (
                                        <p className="text-[11px] text-destructive">
                                            Panjang NIP: {data.nip.length} (Kurang {18 - data.nip.length} karakter)
                                        </p>
                                    )}
                                    {errors.nip && (
                                        <p className="text-xs text-destructive">
                                            {errors.nip}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nama">Nama Lengkap</Label>
                                    <Input
                                        id="nama"
                                        value={data.nama}
                                        onChange={(e) =>
                                            setData('nama', e.target.value)
                                        }
                                        placeholder="Contoh: Budi Santoso, S.Pd"
                                        className="bg-muted/30"
                                    />
                                    {errors.nama && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3 pt-2 border-t border-sidebar-border/50">
                                    <Label className="flex items-center gap-1">
                                        <Users className="h-4 w-4" /> Mengampu di Kelas
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-1 border border-sidebar-border/30 rounded-md">
                                        {kelas.map(k => (
                                            <div key={k.id} className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md border border-sidebar-border/50">
                                                <input
                                                    type="checkbox"
                                                    id={`kelas-${k.id}`}
                                                    className="rounded border-input text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                    checked={data.kelas_ids.includes(k.id)}
                                                    onChange={() => handleKelasToggle(k.id)}
                                                />
                                                <Label htmlFor={`kelas-${k.id}`} className="text-xs cursor-pointer font-normal font-mono">
                                                    {k.full_nama_kelas}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Pilih satu atau lebih kelas tempat guru ini mengajar.
                                    </p>
                                    {errors.kelas_ids && (
                                        <p className="text-xs text-destructive">
                                            {errors.kelas_ids}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3 pt-2 border-t border-sidebar-border/50">
                                    <Label className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" /> Mata Pelajaran Diampu
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto p-1 border border-sidebar-border/30 rounded-md">
                                        {mataPelajarans.map(mapel => (
                                            <div key={mapel.id} className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md border border-sidebar-border/50">
                                                <input
                                                    type="checkbox"
                                                    id={`mapel-${mapel.id}`}
                                                    className="rounded border-input text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                    checked={data.mata_pelajaran_ids.includes(mapel.id)}
                                                    onChange={() => handleMataPelajaranToggle(mapel.id)}
                                                />
                                                <Label htmlFor={`mapel-${mapel.id}`} className="text-xs cursor-pointer font-normal">
                                                    {mapel.nama_mapel} ({mapel.kategori})
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Pilih mata pelajaran yang diampu oleh guru ini.
                                    </p>
                                    {errors.mata_pelajaran_ids && (
                                        <p className="text-xs text-destructive">
                                            {errors.mata_pelajaran_ids}
                                        </p>
                                    )}
                                </div>

                                {editingGuru && (
                                    <div className="space-y-2 pt-2 border-t border-sidebar-border mt-4">
                                        <Label htmlFor="password">
                                            Password Baru (Opsional)
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData('password', e.target.value)
                                            }
                                            placeholder="Minimal 8 karakter, kosongkan jika tidak diubah"
                                            className="bg-muted/30"
                                        />
                                        {errors.password && (
                                            <p className="text-xs text-destructive">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    {editingGuru && (
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
                                        disabled={processing || (data.nip.length > 0 && data.nip.length !== 18)}
                                        className="flex-1"
                                    >
                                        {processing ? (
                                            'Proses...'
                                        ) : editingGuru ? (
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
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, NIP, kelas, atau mata pelajaran..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9 bg-muted/30"
                            />
                        </div>
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">
                                                NIP
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Nama Guru
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Kelas Diampu
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Mata Pelajaran
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Status Sandi
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
                                        {gurus.data.map((guru) => (
                                            <tr
                                                key={guru.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingGuru?.id === guru.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-mono text-xs font-medium">
                                                    {guru.nip}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {guru.nama}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {guru.kelas && guru.kelas.length > 0 ? (
                                                            guru.kelas.map(k => (
                                                                <span key={k.id} className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 ring-1 ring-inset ring-green-500/20 dark:text-green-400">
                                                                    {k.full_nama_kelas}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {guru.mataPelajarans && guru.mataPelajarans.length > 0 ? (
                                                            guru.mataPelajarans.map(m => (
                                                                <span key={m.id} className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400">
                                                                    {m.nama_mapel}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {guru.user?.password_default ? (
                                                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            Default
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            Sudah Diubah
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setResettingPasswordGuruId(guru.id)}
                                                            title="Reset Password"
                                                            className="h-8 w-8 text-muted-foreground hover:text-yellow-600"
                                                        >
                                                            <KeyRound className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(guru)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingGuruId(guru.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {gurus.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Users className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data guru.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={gurus.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingGuruId !== null} onOpenChange={(open) => !open && setDeletingGuruId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data guru ini? Semua data absensi terkait juga akan terhapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={resettingPasswordGuruId !== null} onOpenChange={(open) => !open && setResettingPasswordGuruId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Reset Password</AlertDialogTitle>
                        <AlertDialogDescription>
                            Password guru ini akan direset ke <strong>password</strong>. Guru wajib mengganti password setelah login berikutnya.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeResetPassword} className="bg-yellow-600 hover:bg-yellow-700">
                            Reset Password
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

GuruIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Guru', href: adminGuru.index.url() },
    ],
};
