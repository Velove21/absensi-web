import { usePage, Link } from '@inertiajs/react';
import { BookOpen, LayoutGrid, Users, UserCircle, GraduationCap, School, ClipboardList, History, ListOrdered, Clock, KeyRound, FileSpreadsheet, Calendar, ShieldCheck } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import admin from '@/routes/admin';
import adminTahunAjaran from '@/routes/admin/tahun-ajaran';
import adminJenjang from '@/routes/admin/jenjang';
import { profil as guruProfil } from '@/routes/guru';
import guruRoutes from '@/routes/guru/absensi';
import absensiData from '@/routes/guru/data-absensi';
import exportAbsensi from '@/routes/guru/export';
import guruPassword from '@/routes/guru/password';
import { dashboard as siswaDashboard } from '@/routes/siswa';
import { profil as siswaProfil } from '@/routes/siswa';
import siswaPassword from '@/routes/siswa/password';
import type { NavItem, SharedData } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const { isMobile, openMobile, setOpenMobile } = useSidebar();
    const { isCurrentUrl } = useCurrentUrl();
    const userRole = auth.user.role;
    const getInitials = useInitials();

    const profileHref =
        userRole === 'guru'
            ? guruProfil.url()
            : userRole === 'siswa'
              ? siswaProfil.url()
              : null;

    let mainNavItems: NavItem[] = [];
    let platformLabel = 'Platform';
    if (userRole === 'admin') {
        platformLabel = 'Platform';
    } else if (userRole === 'guru') {
        platformLabel = 'Guru';
    } else if (userRole === 'siswa') {
        platformLabel = 'Siswa';
    }

    if (userRole === 'admin') {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: admin.dashboard.url(),
                icon: LayoutGrid,
            },
            {
                title: 'Tahun Ajaran',
                href: adminTahunAjaran.index.url(),
                icon: Calendar,
            },
            {
                title: 'Jurusan',
                href: admin.jurusan.index.url(),
                icon: School,
            },
            {
                title: 'Jenjang',
                href: adminJenjang.index.url(),
                icon: ListOrdered,
            },
            {
                title: 'Kelas',
                href: admin.kelas.index.url(),
                icon: GraduationCap,
            },
            {
                title: 'Kategori Pelajaran',
                href: admin.kategoriPembelajaran.index.url(),
                icon: BookOpen,
            },
            {
                title: 'Mata Pelajaran',
                href: admin.matapelajaran.index.url(),
                icon: BookOpen,
            },
            {
                title: 'Durasi Pembelajaran',
                href: admin.durasiPembelajaran.index.url(),
                icon: Clock,
            },
            {
                title: 'Guru',
                href: admin.guru.index.url(),
                icon: Users,
            },
            {
                title: 'Siswa',
                href: admin.siswa.index.url(),
                icon: UserCircle,
            },
            {
                title: 'Admin',
                href: admin.tambahAdmin.url(),
                icon: ShieldCheck,
            },
            {
                title: 'Alumni',
                href: '/admin/alumni',
                icon: GraduationCap,
            },
        ];
    } else if (userRole === 'guru') {
        mainNavItems = [
            {
                title: 'Input Presensi',
                href: guruRoutes.index.url(),
                icon: ClipboardList,
            },
            {
                title: 'Lihat Presensi',
                href: absensiData.index.url(),
                icon: BookOpen,
            },
            {
                title: 'Export Presensi',
                href: exportAbsensi.index.url(),
                icon: FileSpreadsheet,
            },
            {
                title: 'Ubah Sandi',
                href: guruPassword.change.url(),
                icon: KeyRound,
            },
        ];
    } else if (userRole === 'siswa') {
        mainNavItems = [
            {
                title: 'Riwayat Presensi',
                href: siswaDashboard.url(),
                icon: History,
            },
            {
                title: 'Ubah Sandi',
                href: siswaPassword.change.url(),
                icon: KeyRound,
            },
        ];
    }



    return (
        <>
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    {profileHref ? (
                        <Link
                            href={profileHref}
                            className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                        >
                            <ProfileHeaderInfo userRole={userRole} getInitials={getInitials} auth={auth} />
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3 rounded-md px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                            <ProfileHeaderInfo userRole={userRole} getInitials={getInitials} auth={auth} />
                        </div>
                    )}
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={mainNavItems} label={platformLabel} />
                </SidebarContent>

                <SidebarFooter>
                    {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            {/* Mobile: ketika tertutup, hanya gambar/icon aja yang tampil — tulisannya disembunyikan, semua ditaruh di tengah. */}
            {isMobile && !openMobile && (
                <div className="fixed inset-y-0 left-0 z-30 flex w-[3rem] flex-col items-center bg-sidebar py-3 md:hidden">
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setOpenMobile(true)}
                                className="flex size-9 translate-x-[1px] items-center justify-center rounded-md transition-colors hover:bg-accent"
                                aria-label="Buka sidebar"
                            >
                                <Avatar className="size-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
                                    <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                    <AvatarFallback className="bg-white text-[#002399] dark:bg-white dark:text-[#002399] text-xs font-semibold">
                                        {getInitials(auth.user?.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center" sideOffset={10} className="bg-card text-card-foreground border border-sidebar-border/70 shadow-xl">
                            Buka sidebar
                        </TooltipContent>
                    </Tooltip>

                    {/* Platform icons kecil — tetap tampil di mobile biar tidak hilang saat layar dikecilkan, hover langsung keliatan tanpa jeda + mengambang */}
                    <div className="mt-6 flex flex-1 flex-col items-center gap-1">
                        {mainNavItems.map((item) => {
                            const active = isCurrentUrl(item.href);
                            return (
                                <Tooltip key={item.title} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            prefetch
                                            aria-label={item.title}
                                            className={cn(
                                                'flex size-9 translate-x-[1px] items-center justify-center rounded-md transition-colors',
                                                active
                                                    ? 'bg-[#002399] text-white shadow-[0_6px_16px_rgba(0,35,153,0.35)]'
                                                    : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
                                            )}
                                        >
                                            {item.icon && <item.icon className="size-5 shrink-0" />}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="center" sideOffset={10} className="bg-card text-card-foreground border border-sidebar-border/70 shadow-xl">
                                        {item.title}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>

                    {/* Bawah — hanya inisial/avatar, tanpa teks, di tengah — langsung bisa logout (klik) + hover langsung keliatan */}
                    <div className="mt-auto flex flex-col items-center gap-2">
                        <Tooltip delayDuration={0}>
                            <DropdownMenu>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="flex size-9 translate-x-[1px] items-center justify-center rounded-md hover:bg-accent transition-colors"
                                            aria-label="Akun"
                                        >
                                            <Avatar className="size-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
                                                <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                                <AvatarFallback className="bg-white text-[#002399] dark:bg-white dark:text-[#002399] text-xs font-semibold">
                                                    {getInitials(auth.user?.name ?? '')}
                                                </AvatarFallback>
                                            </Avatar>
                                        </button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <DropdownMenuContent className="w-56 rounded-lg" side="right" align="end" sideOffset={8}>
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <TooltipContent side="right" align="center" sideOffset={10} className="bg-card text-card-foreground border border-sidebar-border/70 shadow-xl">
                                {auth.user.name}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            )}
            {/* Spacer untuk konten agar tidak tertutup bar mini di mobile saat tertutup */}
            {isMobile && !openMobile && (
                <div className="w-[3rem] shrink-0 md:hidden" aria-hidden />
            )}
        </>
    );
}

function ProfileHeaderInfo({
    userRole,
    getInitials,
    auth,
}: {
    userRole: 'admin' | 'guru' | 'siswa';
    getInitials: (name: string) => string;
    auth: SharedData['auth'];
}) {
    return (
        <>
            <Avatar className="size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:translate-x-[1px]">
                <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                <AvatarFallback className="bg-white text-[#002399] dark:bg-white dark:text-[#002399] text-xs font-semibold group-data-[collapsible=icon]:text-xs">
                    {getInitials(auth.user?.name ?? '')}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                <span
                    className="truncate text-sm font-bold capitalize"
                    style={{ fontFamily: "'Poppins', sans-serif", color: '#002399' }}
                >
                    {userRole}
                </span>
                {userRole === 'guru' || userRole === 'siswa' ? (
                    <>
                        <span
                            className="truncate text-xs font-normal text-black"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                            {auth.user?.name}
                        </span>
                        <span
                            className="truncate text-xs font-normal text-black"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                            {userRole === 'guru'
                                ? `NIP: ${auth.user?.guru?.nip ?? '-'}`
                                : `NIS: ${auth.user?.siswa?.nis ?? '-'}`}
                        </span>
                    </>
                ) : (
                    <span
                        className="truncate text-xs font-normal text-black"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        {auth.user?.email}
                    </span>
                )}
            </div>
        </>
    );
}
