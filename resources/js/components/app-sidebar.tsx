import { usePage, Link } from '@inertiajs/react';
import { BookOpen, LayoutGrid, Users, UserCircle, GraduationCap, School, ClipboardList, History, ListOrdered, Clock, KeyRound, FileSpreadsheet, Calendar } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import admin from '@/routes/admin';
import adminPassword from '@/routes/admin/password';
import adminTahunAjaran from '@/routes/admin/tahun-ajaran';
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
    const userRole = auth.user.role;
    const getInitials = useInitials();

    const profileHref =
        userRole === 'guru'
            ? guruProfil.url()
            : userRole === 'siswa'
              ? siswaProfil.url()
              : null;

    let mainNavItems: NavItem[] = [];

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
                title: 'Jenjang Kelas',
                href: admin.jenjangKelas.index.url(),
                icon: ListOrdered,
            },
            {
                title: 'Durasi Pembelajaran',
                href: admin.durasiPembelajaran.index.url(),
                icon: Clock,
            },
            {
                title: 'Kelas',
                href: admin.kelas.index.url(),
                icon: GraduationCap,
            },
            {
                title: 'Kategori Mapel',
                href: admin.kategoriPembelajaran.index.url(),
                icon: BookOpen,
            },
            {
                title: 'Mata Pelajaran',
                href: admin.matapelajaran.index.url(),
                icon: BookOpen,
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
                title: 'Ubah Sandi',
                href: adminPassword.change.url(),
                icon: KeyRound,
            },
        ];
    } else if (userRole === 'guru') {
        mainNavItems = [
            {
                title: 'Input Absensi',
                href: guruRoutes.index.url(),
                icon: ClipboardList,
            },
            {
                title: 'Lihat Data Absensi',
                href: absensiData.index.url(),
                icon: BookOpen,
            },
            {
                title: 'Export Absensi',
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
                title: 'Riwayat Absensi',
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
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
            <Avatar className="size-10 shrink-0 overflow-hidden rounded-full">
                <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(auth.user?.name ?? '')}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
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
