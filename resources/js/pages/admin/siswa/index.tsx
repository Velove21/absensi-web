import { Head, useForm, router, Link } from '@inertiajs/react';
import { Edit2, Trash2, X, Plus, Save, UserCircle, KeyRound, Search, Eye } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import Pagination from '@/components/pagination';
import { PhotoUpload } from '@/components/photo-upload';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard as adminDashboard } from '@/routes/admin';
import adminSiswa from '@/routes/admin/siswa';

interface Kelas {
    id: number;
    nama_kelas: string;
    full_nama_kelas: string;
    jurusan?: {
        singkatan: string;
    };
}

interface Siswa {
    id: number;
    nis: string;
    nama: string;
    jenis_kelamin?: 'laki-laki' | 'perempuan' | null;
    foto_url?: string | null;
    kelas_id: number;
    kelas?: Kelas;
    user?: {
        password_default: boolean;
    };
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function SiswaIndex({
    siswas,
    kelasList,
}: {
    siswas: PaginatedData<Siswa>;
    kelasList: Kelas[];
}) {
    const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
    const [deletingSiswaId, setDeletingSiswaId] = useState<number | null>(null);
    const [resettingPasswordSiswaId, setResettingPasswordSiswaId] = useState<number | null>(null);
    const [search, setSearch] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);

            return params.get('search') || '';
        }

        return '';
    });
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nis: '',
        nama: '',
        jenis_kelamin: '',
        kelas_id: '',
        password: '',
        foto: null as string | File | null,
        remove_foto: false,
    });

    const handleFotoChange = (file: File | null) => {
        setData('foto', file);
        setData('remove_foto', file === null);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(adminSiswa.index.url(), { search: value || undefined }, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 400);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSiswa) {
            put(adminSiswa.update.url({ siswa: editingSiswa.id }), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    handleCancel();
                    toast.success('Data siswa berhasil diperbarui');
                },
            });
        } else {
            post(adminSiswa.store.url(), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    toast.success('Siswa berhasil ditambahkan', {
                        description: 'Akun siswa telah dibuat.',
                    });
                },
            });
        }
    };

    const handleEdit = (siswa: Siswa) => {
        setEditingSiswa(siswa);
        clearErrors();
        setData({
            nis: siswa.nis,
            nama: siswa.nama,
            jenis_kelamin: siswa.jenis_kelamin ?? '',
            kelas_id: siswa.kelas_id.toString(),
            password: '',
            foto: siswa.foto_url ?? null,
            remove_foto: false,
        });
    };

    const handleCancel = () => {
        setEditingSiswa(null);
        reset();
        clearErrors();
    };

    const executeDelete = () => {
        if (!deletingSiswaId) {
return;
}

        router.delete(adminSiswa.destroy.url({ siswa: deletingSiswaId }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Siswa berhasil dihapus');
                setDeletingSiswaId(null);
            },
            onError: () => setDeletingSiswaId(null),
        });
    };

    const executeResetPassword = () => {
        if (!resettingPasswordSiswaId) {
return;
}

        router.post(adminSiswa.resetPassword.url({ siswa: resettingPasswordSiswaId }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Password siswa berhasil direset ke default (password)');
                setResettingPasswordSiswaId(null);
            },
            onError: () => setResettingPasswordSiswaId(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Siswa" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Siswa
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola data dan akun akses siswa.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Input */}
                    <div className="col-span-1">
                        <div className="sticky top-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {editingSiswa ? (
                                        <><Edit2 className="h-4 w-4 text-primary" /> Edit Siswa</>
                                    ) : (
                                        <><Plus className="h-4 w-4 text-primary" /> Tambah Siswa</>
                                    )}
                                </h2>
                                {editingSiswa && (
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
                                    <Label>Foto Profil</Label>
                                    <PhotoUpload
                                        value={data.foto}
                                        onChange={handleFotoChange}
                                        fallback={data.nama || 'Siswa'}
                                    />
                                    {errors.foto && (
                                        <p className="text-xs text-destructive">
                                            {errors.foto}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nis">NIS</Label>
                                    <Input
                                        id="nis"
                                        value={data.nis}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
                                            const formatted = digits.length > 2
                                                ? `${digits.slice(0, 2)}.${digits.slice(2)}`
                                                : digits;
                                            setData('nis', formatted);
                                        }}
                                        placeholder="Format: XX.XXXXXX (misal 24.012505)"
                                        maxLength={9}
                                        className={`bg-muted/30 ${data.nis.length > 0 && !/^[0-9]{2}\.[0-9]{6}$/.test(data.nis) ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                    />
                                    {data.nis.length > 0 && !/^[0-9]{2}\.[0-9]{6}$/.test(data.nis) && (
                                        <p className="text-[11px] text-destructive">
                                            Format NIS: 2 digit + titik + 6 digit (contoh: 24.012505)
                                        </p>
                                    )}
                                    {errors.nis && (
                                        <p className="text-xs text-destructive">
                                            {errors.nis}
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
                                        placeholder="Nama Siswa"
                                        className="bg-muted/30"
                                    />
                                    {errors.nama && (
                                        <p className="text-xs text-destructive">
                                            {errors.nama}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                                    <select
                                        id="jenis_kelamin"
                                        className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        value={data.jenis_kelamin}
                                        onChange={(e) =>
                                            setData('jenis_kelamin', e.target.value)
                                        }
                                    >
                                        <option value="">Pilih Jenis Kelamin</option>
                                        <option value="laki-laki">Laki-laki</option>
                                        <option value="perempuan">Perempuan</option>
                                    </select>
                                    {errors.jenis_kelamin && (
                                        <p className="text-xs text-destructive">
                                            {errors.jenis_kelamin}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kelas_id">Kelas</Label>
                                    <select
                                        id="kelas_id"
                                        className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        value={data.kelas_id}
                                        onChange={(e) =>
                                            setData('kelas_id', e.target.value)
                                        }
                                    >
                                        <option value="">Pilih Kelas</option>
                                        {kelasList.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.full_nama_kelas}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.kelas_id && (
                                        <p className="text-xs text-destructive">
                                            {errors.kelas_id}
                                        </p>
                                    )}
                                </div>

                                {editingSiswa && (
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

                                <div className="flex gap-2 pt-2">
                                    {editingSiswa && (
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
                                        ) : editingSiswa ? (
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
                                placeholder="Cari nama, NIS, atau kelas..."
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
                                                NIS
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Nama Siswa
                                            </th>
                                            <th scope="col" className="px-6 py-4">
                                                Kelas
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
                                        {siswas.data.map((siswa) => (
                                            <tr
                                                key={siswa.id}
                                                className={`group transition-colors hover:bg-muted/30 ${editingSiswa?.id === siswa.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-mono text-xs font-medium">
                                                    {siswa.nis}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-8 shrink-0 overflow-hidden rounded-full">
                                                            <AvatarImage src={siswa.foto_url ?? undefined} alt={siswa.nama} />
                                                            <AvatarFallback className="bg-neutral-100 text-xs font-semibold text-neutral-500">
                                                                {siswa.nama.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>{siswa.nama}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {siswa.kelas?.full_nama_kelas}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {siswa.user?.password_default ? (
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
                                                            asChild
                                                            title="Lihat Profil"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Link href={adminSiswa.profil.url({ siswa: siswa.id })}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setResettingPasswordSiswaId(siswa.id)}
                                                            title="Reset Password"
                                                            className="h-8 w-8 text-muted-foreground hover:text-yellow-600"
                                                        >
                                                            <KeyRound className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(siswa)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingSiswaId(siswa.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {siswas.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-6 py-12 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UserCircle className="h-8 w-8 opacity-20" />
                                                        <p>Belum ada data siswa.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination links={siswas.links} />
                    </div>
                </div>
            </div>

            <AlertDialog open={deletingSiswaId !== null} onOpenChange={(open) => !open && setDeletingSiswaId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data siswa ini?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={resettingPasswordSiswaId !== null} onOpenChange={(open) => !open && setResettingPasswordSiswaId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Reset Password</AlertDialogTitle>
                        <AlertDialogDescription>
                            Password siswa ini akan direset ke <strong>password</strong>. Siswa wajib mengganti password setelah login berikutnya.
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

SiswaIndex.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Siswa', href: adminSiswa.index.url() },
    ],
};
