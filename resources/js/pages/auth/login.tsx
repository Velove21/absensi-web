import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    const [loginAs, setLoginAs] = useState<'pegawai' | 'siswa'>('pegawai');

    return (
        <div className="relative w-full max-w-md mx-auto pt-4">
            <Head title="Login Portal" />
            
            <div className="flex flex-col items-center mb-8 px-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground text-center">Selamat Datang</h1>
                <h2 className="text-xl font-bold tracking-tight text-foreground text-center mt-1">Absensi SMKN 2 SURAKARTA</h2>
                <h3 className="text-lg font-semibold tracking-tight text-foreground text-center mt-1">PORTAL SCOSEN</h3>
                <p className="text-sm text-muted-foreground mt-2 text-center">Masuk ke dalam absensi SMKN 2 Surakarta</p>
            </div>

            {/* Toggle Role Login */}
            <div className="flex bg-muted/50 p-1 rounded-lg mb-6">
                <button 
                    type="button"
                    onClick={() => setLoginAs('pegawai')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${loginAs === 'pegawai' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Admin / Guru
                </button>
                <button 
                    type="button"
                    onClick={() => setLoginAs('siswa')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${loginAs === 'siswa' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Siswa
                </button>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
            >
                {({ processing, errors, setData }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-5 animate-in fade-in duration-300">
                                {loginAs === 'pegawai' ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="login">NIP</Label>
                                            <Input
                                                id="login"
                                                type="text"
                                                name="login"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="username"
                                                placeholder="Masukkan NIP"
                                                pattern="^\d{18}$"
                                                title="Harus 18 digit angka"
                                                className="h-11 bg-muted/30"
                                            />
                                            <InputError message={errors.login} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password</Label>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Masukkan password"
                                                className="h-11 bg-muted/30"
                                            />
                                            <InputError message={errors.password} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="login">Nomor Induk Siswa (NIS)</Label>
                                            <Input
                                                id="login"
                                                type="text"
                                                name="login"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="username"
                                                placeholder="Masukkan NIS Anda"
                                                className="h-11 bg-muted/30"
                                            />
                                            <InputError message={errors.login} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password</Label>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Masukkan password (default: password1)"
                                                className="h-11 bg-muted/30"
                                            />
                                            <InputError message={errors.password} />
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <KeyRound className="h-3 w-3" />
                                                Lupa sandi? Hubungi admin. Setelah login, Anda bisa ubah sandi.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full h-11 text-base font-medium"
                                tabIndex={3}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <><Spinner className="mr-2" /> Memproses...</>
                                ) : (
                                    'Masuk'
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-6 text-center text-sm font-medium text-green-600 bg-green-50 dark:bg-green-500/10 p-3 rounded-md border border-green-200 dark:border-green-500/20">
                    {status}
                </div>
            )}
        </div>
    );
}

Login.layout = {
    title: '',
    description: '',
};
