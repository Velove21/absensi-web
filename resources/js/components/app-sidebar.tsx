import { Link, usePage } from '@inertiajs/react';
import { BookOpen, LayoutGrid, Users, UserCircle, GraduationCap, School, ClipboardList, History, ListOrdered, Clock, KeyRound, FileSpreadsheet, Calendar } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import * as routes from '@/routes';
import admin from '@/routes/admin';
import adminPassword from '@/routes/admin/password';
import adminTahunAjaran from '@/routes/admin/tahun-ajaran';
import guruRoutes from '@/routes/guru/absensi';
import absensiData from '@/routes/guru/data-absensi';
import exportAbsensi from '@/routes/guru/export';
import guruPassword from '@/routes/guru/password';
import { dashboard as siswaDashboard } from '@/routes/siswa';
import siswaPassword from '@/routes/siswa/password';
import type { NavItem, SharedData } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user.role;

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



    const getHeaderHref = () => {
        if (userRole === 'admin') {
return admin.dashboard.url();
}

        if (userRole === 'guru') {
return guruRoutes.index.url();
}

        if (userRole === 'siswa') {
return siswaDashboard.url();
}

        return routes.dashboard.url();
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={getHeaderHref()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
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
