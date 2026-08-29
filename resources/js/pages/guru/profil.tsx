import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, UserRound } from 'lucide-react';
import { ProfilePhoto } from '@/components/profile-photo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import guruAbsensi from '@/routes/guru/absensi';

interface Profil {
    id: number;
    nip: string;
    nama: string;
    jenis_kelamin?: 'laki-laki' | 'perempuan' | null;
    foto_url?: string | null;
}

export default function GuruProfil({ profil }: { profil: Profil }) {
    const jenisKelamin =
        profil.jenis_kelamin === 'perempuan'
            ? 'Perempuan'
            : profil.jenis_kelamin === 'laki-laki'
              ? 'Laki-laki'
              : '-';

    return (
        <>
            <Head title={`Profil ${profil.nama}`} />
            <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Profil Guru</h1>
                        <p className="text-muted-foreground">Data pribadi Anda.</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="bg-white text-[#093ff9] hover:bg-white/80" style={{ color: '#093ff9' }}>
                        <Link href={guruAbsensi.index.url()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                        <ProfilePhoto src={profil.foto_url} alt={profil.nama} />
                        <div>
                            <h2 className="text-xl font-bold">{profil.nama}</h2>
                            <p className="font-mono text-sm text-muted-foreground">NIP: {profil.nip}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserRound className="h-4 w-4 text-primary" />
                            Data Pribadi
                        </CardTitle>
                        <CardDescription>Informasi yang tercatat di sistem.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input id="nama" value={profil.nama} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nip">NIP</Label>
                            <Input id="nip" value={profil.nip} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jenis-kelamin">Jenis Kelamin</Label>
                            <Input id="jenis-kelamin" value={jenisKelamin} readOnly />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

GuruProfil.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: guruAbsensi.index.url() },
        { title: 'Profil' },
    ],
};