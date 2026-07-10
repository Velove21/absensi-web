import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Login Portal - Absensi SMKN 2 SURAKARTA" />

            <div className="relative flex min-h-screen flex-col items-center justify-center p-6 font-sans lg:p-8 overflow-hidden">
                {/* Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/background.jpg')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f]/90 via-[#112240]/85 to-[#1a365d]/90 backdrop-blur-[2px]" />
                </div>

                {/* Heading */}
                <div className="relative z-10 mb-15 text-center space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-5xl">
                        Selamat Datang
                    </h1>
                    <p className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-5xl">
                        Silahkan Akses Absensi{' '}
                        <span className="font-semibold text-[#0ea5e9]">SMKN 2 SURAKARTA</span>
                    </p>
                </div>

                {/* Portal Card */}
                <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-md">
                    {/* Card Header */}
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-bold tracking-widest text-white uppercase">
                            Portal Login
                        </h2>
                        <p className="mt-1 text-xs text-blue-200/70">
                            Masuk kedalam absensi SMKN 2 Surakarta
                        </p>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="login" className="text-sm text-blue-100/90 font-medium">
                                        NIP / NIS / Email
                                    </Label>
                                    <Input
                                        id="login"
                                        type="text"
                                        name="login"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="username"
                                        placeholder="Masukkan NIP / NIS / Email"
                                        className="h-11 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-[#0ea5e9] focus:ring-[#0ea5e9]/20"
                                    />
                                    <InputError message={errors.login} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="password" className="text-sm text-blue-100/90 font-medium">
                                        Password
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Masukkan password"
                                        className="h-11 border-white/20 bg-white/10 text-white placeholder:text-blue-200/40 focus:border-[#0ea5e9] focus:ring-[#0ea5e9]/20"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <Button
                                    type="submit"
                                    tabIndex={3}
                                    disabled={processing}
                                    data-test="login-button"
                                    className="mt-2 h-11 w-full bg-gradient-to-r from-[#0ea5e9] to-blue-600 text-base font-semibold text-white shadow-[0_4px_14px_0_rgba(14,165,233,0.4)] transition-all duration-300 hover:from-[#0284c7] hover:to-blue-700 hover:shadow-[0_6px_20px_rgba(14,165,233,0.35)]"
                                >
                                    {processing ? (
                                        <><Spinner className="mr-2" /> Memproses...</>
                                    ) : (
                                        'Masuk'
                                    )}
                                </Button>
                            </div>
                        )}
                    </Form>

                    {status && (
                        <div className="mt-6 text-center text-sm font-medium text-green-600 bg-green-50 dark:bg-green-500/10 p-3 rounded-md border border-green-200 dark:border-green-500/20">
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: '',
    description: '',
};
