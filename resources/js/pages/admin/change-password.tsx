import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard as adminDashboard } from '@/routes/admin';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';

export default function ChangePassword() {
    const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/ubah-sandi', {
            preserveScroll: true,
            onSuccess: () => {
                reset('current_password', 'password', 'password_confirmation');
            },
        });
    };

    return (
        <>
            <Head title="Ubah Sandi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ubah Sandi</h1>
                    <p className="text-muted-foreground">
                        Ganti password akun Anda secara berkala untuk keamanan.
                    </p>
                </div>

                <div className="max-w-lg">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Lock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Form Ubah Sandi</CardTitle>
                                    <CardDescription>
                                        Masukkan password lama dan password baru Anda.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="current_password" className="flex items-center gap-1.5">
                                        <KeyRound className="h-3.5 w-3.5" /> Password Lama
                                    </Label>
                                    <PasswordInput
                                        id="current_password"
                                        name="current_password"
                                        required
                                        autoFocus
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        placeholder="Masukkan password saat ini"
                                        className="bg-muted/30 h-11"
                                    />
                                    <InputError message={errors.current_password} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Password Baru
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        className="bg-muted/30 h-11"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">
                                        Konfirmasi Password Baru
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        required
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password baru"
                                        className="bg-muted/30 h-11"
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                {recentlySuccessful && (
                                    <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                                        Password berhasil diubah.
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-11 text-base font-medium"
                                >
                                    {processing ? (
                                        <><Spinner className="mr-2" /> Menyimpan...</>
                                    ) : (
                                        'Simpan Sandi Baru'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ChangePassword.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: adminDashboard.url() },
        { title: 'Ubah Sandi', href: '/admin/ubah-sandi' },
    ],
};
