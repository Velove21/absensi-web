import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ShieldCheck, UserCheck, Lock, Mail, User, ShieldAlert } from 'lucide-react';

interface SecretAdminRegisterProps {
    secretKey: string;
}

export default function SecretAdminRegister({ secretKey }: SecretAdminRegisterProps) {
    return (
        <>
            <Head title="Registrasi Admin Rahasia - Absensi SMKN 2 SURAKARTA" />
            <div className="relative flex min-h-screen flex-col items-center justify-center p-4 font-sans sm:p-6 lg:p-8 overflow-hidden bg-[#0a192f]">
                {/* Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
                    style={{ backgroundImage: "url('/images/background.jpg')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f]/95 via-[#112240]/90 to-[#1a365d]/95 backdrop-blur-[3px]" />
                </div>

                {/* Main Container */}
                <div className="relative z-10 w-full max-w-md space-y-5">
                    {/* Header Branding */}
                    <div className="text-center">
                        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                            Absensi SMKN 2 SURAKARTA
                        </h1>
                    </div>

                    {/* Portal Card */}
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 sm:p-8 shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        {/* Card Header */}
                        <div className="mb-5 flex flex-col items-center text-center">
                            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 border border-emerald-400/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h2 className="text-base font-bold tracking-wide text-white uppercase">
                                Buat Akun Admin Baru
                            </h2>
                            <p className="mt-0.5 text-xs text-blue-200/70">
                                Akun ini akan didaftarkan sebagai Administrator
                            </p>
                        </div>

                        {/* Form */}
                        <Form
                            action={`/secret-admin-register?key=${secretKey}`}
                            method="post"
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            className="space-y-3.5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-1">
                                        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-blue-100/90 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-[#0ea5e9]" /> Nama Lengkap
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            name="name"
                                            placeholder="Nama lengkap admin"
                                            className="h-10 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-blue-100/90 flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-[#0ea5e9]" /> Alamat Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            tabIndex={2}
                                            name="email"
                                            placeholder="admin@smkn2surakarta.sch.id"
                                            className="h-10 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-blue-100/90 flex items-center gap-1.5">
                                            <UserCheck className="h-3.5 w-3.5 text-[#0ea5e9]" /> Username (Opsional)
                                        </Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            tabIndex={3}
                                            name="username"
                                            placeholder="Contoh: admin_utama"
                                            className="h-10 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                                        />
                                        <InputError message={errors.username} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-blue-100/90 flex items-center gap-1.5">
                                                <Lock className="h-3.5 w-3.5 text-[#0ea5e9]" /> Password
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                required
                                                tabIndex={4}
                                                name="password"
                                                placeholder="Min 8 karakter"
                                                className="h-10 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="password_confirmation" className="text-xs font-semibold uppercase tracking-wider text-blue-100/90 flex items-center gap-1.5">
                                                <Lock className="h-3.5 w-3.5 text-[#0ea5e9]" /> Konfirmasi
                                            </Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                required
                                                tabIndex={5}
                                                name="password_confirmation"
                                                placeholder="Ulangi password"
                                                className="h-10 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        tabIndex={6}
                                        className="mt-3 h-11 w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-[1.01] hover:from-emerald-600 hover:to-teal-700 hover:shadow-[0_6px_25px_rgba(16,185,129,0.5)] active:scale-[0.99]"
                                    >
                                        {processing ? (
                                            <><Spinner className="mr-2" /> Memproses Registrasi...</>
                                        ) : (
                                            'Daftarkan Akun Administrator'
                                        )}
                                    </Button>
                                </>
                            )}
                        </Form>

                        {/* Footer Security Note */}
                        <div className="mt-5 border-t border-white/10 pt-3 text-center">
                            <p className="flex items-center justify-center gap-1.5 text-[11px] text-blue-200/60">
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-400/80" />
                                Terenkripsi & Khusus Penggunaan Internal Admin
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

SecretAdminRegister.layout = null;
