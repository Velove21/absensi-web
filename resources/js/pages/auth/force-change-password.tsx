import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password/change';
import { ShieldAlert, Lock } from 'lucide-react';

export default function ForceChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(update.url(), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Wajib Ubah Sandi" />
            <div className="relative flex min-h-screen flex-col items-center justify-center p-6 font-sans overflow-hidden">
                {/* Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/background.jpg')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f]/90 via-[#112240]/85 to-[#1a365d]/90 backdrop-blur-[2px]" />
                </div>

                {/* Card */}
                <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-md">
                    {/* Header */}
                    <div className="mb-7 flex flex-col items-center text-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/20 ring-1 ring-yellow-400/40">
                            <ShieldAlert className="h-7 w-7 text-yellow-300" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Wajib Ubah Sandi</h1>
                            <p className="mt-1 text-sm text-blue-200/70">
                                Password Anda masih menggunakan sandi default. Harap ganti sebelum melanjutkan.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-4">
                        {/* Password Lama */}
                        <div className="space-y-1.5">
                            <Label htmlFor="current_password" className="text-sm text-blue-100/90 font-medium flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" /> Password Lama (Default)
                            </Label>
                            <PasswordInput
                                id="current_password"
                                name="current_password"
                                required
                                autoFocus
                                tabIndex={1}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                placeholder="Masukkan password default saat ini"
                                className="h-11 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-[#0ea5e9] focus:ring-[#0ea5e9]/20"
                            />
                            <InputError message={errors.current_password} />
                        </div>

                        {/* Password Baru */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm text-blue-100/90 font-medium">
                                Password Baru
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                className="h-11 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-[#0ea5e9] focus:ring-[#0ea5e9]/20"
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Konfirmasi Password Baru */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password_confirmation" className="text-sm text-blue-100/90 font-medium">
                                Konfirmasi Password Baru
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                tabIndex={3}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Ulangi password baru"
                                className="h-11 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-[#0ea5e9] focus:ring-[#0ea5e9]/20"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            className="mt-2 h-11 w-full bg-gradient-to-r from-[#0ea5e9] to-blue-600 text-base font-semibold text-white shadow-[0_4px_14px_0_rgba(14,165,233,0.4)] transition-all duration-300 hover:from-[#0284c7] hover:to-blue-700"
                        >
                            {processing ? (
                                <><Spinner className="mr-2" /> Menyimpan...</>
                            ) : (
                                'Simpan Sandi Baru'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}
