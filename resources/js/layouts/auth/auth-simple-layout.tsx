import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden font-sans">
            {/* Background Image with Overlay */}   
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
                style={{ backgroundImage: "url('/images/background.jpg')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f]/90 via-[#112240]/85 to-[#1a365d]/90 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white/95 dark:bg-gray-950/90 shadow-[0_8px_32px_0_rgba(14,165,233,0.15)] backdrop-blur-md p-8 border border-white/20 dark:border-white/10 transition-all duration-300">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-4 relative">
                        {/* Tombol Silang / Close disejajarkan dengan Logo SMK di kiri */}
                        <div className="absolute left-0 top-0">
                            <Button variant="ghost" size="icon" asChild className="rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                <Link href="/">
                                    <X className="h-5 w-5" />
                                    <span className="sr-only">Kembali</span>
                                </Link>
                            </Button>
                        </div>

                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium transition-transform hover:scale-105"
                        >
                            <div className="mb-1 flex items-center justify-center rounded-md">
                                <img src="/images/logo.png" className="size-16 md:size-20 object-contain" alt="Logo SMKN 2" />
                            </div>
                            <span className="sr-only">Absensi SMKN 2 SURAKARTA</span>
                        </Link>
                        
                        {(title || description) && (
                            <div className="space-y-1 text-center mt-2">
                                {title && <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>}
                                {description && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
