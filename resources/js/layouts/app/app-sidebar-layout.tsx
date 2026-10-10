import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import type { SharedData } from '@/types';
import type { BreadcrumbItem } from '@/types/navigation';

function inferBreadcrumbs(
    url: string,
    role: SharedData['auth']['user']['role'] | undefined,
    explicit: BreadcrumbItem[],
): BreadcrumbItem[] {
    if (explicit.length > 0) {
        // If already has role prefix, keep as is; otherwise prepend role for consistency
        const first = explicit[0]?.title?.toLowerCase();
        if (role === 'guru' && first !== 'guru') {
            return [{ title: 'Guru', href: '/guru/absensi' } as BreadcrumbItem, ...explicit];
        }
        if (role === 'admin' && first !== 'admin') {
            // Admin pages already include Admin prefix via Page.layout, keep but ensure fallback
        }
        if (role === 'siswa' && first !== 'siswa') {
            return [{ title: 'Siswa', href: '/siswa/dashboard' } as BreadcrumbItem, ...explicit];
        }
        return explicit;
    }

    const path = url.split('?')[0].split('#')[0];

    if (role === 'guru') {
        if (path.startsWith('/guru/profil')) {
            return [
                { title: 'Guru', href: '/guru/absensi' } as BreadcrumbItem,
                { title: 'Profil' } as unknown as BreadcrumbItem,
            ];
        }
        if (path.startsWith('/guru/data-absensi')) {
            return [
                { title: 'Guru', href: '/guru/absensi' } as BreadcrumbItem,
                { title: 'Lihat Data Presensi', href: '/guru/data-absensi' } as BreadcrumbItem,
            ];
        }
        if (path.startsWith('/guru/export')) {
            return [
                { title: 'Guru', href: '/guru/absensi' } as BreadcrumbItem,
                { title: 'Export Presensi', href: '/guru/export' } as BreadcrumbItem,
            ];
        }
        if (path.startsWith('/guru/ubah-sandi') || path.startsWith('/guru/password')) {
            return [
                { title: 'Guru', href: '/guru/absensi' } as BreadcrumbItem,
                { title: 'Ubah Sandi', href: '/guru/ubah-sandi' } as BreadcrumbItem,
            ];
        }
        // Default: Input Presensi (covers /guru/absensi and /guru)
        return [
            { title: 'Guru', href: '/guru/absensi' } as BreadcrumbItem,
            { title: 'Input Presensi', href: '/guru/absensi' } as BreadcrumbItem,
        ];
    }

    if (role === 'admin') {
        if (path === '/admin/dashboard' || path === '/admin') {
            return [
                { title: 'Admin', href: '/admin/dashboard' } as BreadcrumbItem,
                { title: 'Dasbor', href: '/admin/dashboard' } as BreadcrumbItem,
            ];
        }
        // Generic admin fallback: Admin > Current
        return [
            { title: 'Admin', href: '/admin/dashboard' } as BreadcrumbItem,
            { title: 'Dasbor' } as unknown as BreadcrumbItem,
        ];
    }

    if (role === 'siswa') {
        if (path.startsWith('/siswa/profil')) {
            return [
                { title: 'Siswa', href: '/siswa/dashboard' } as BreadcrumbItem,
                { title: 'Profil' } as unknown as BreadcrumbItem,
            ];
        }
        if (path.startsWith('/siswa/ubah-sandi')) {
            return [
                { title: 'Siswa', href: '/siswa/dashboard' } as BreadcrumbItem,
                { title: 'Ubah Sandi' } as unknown as BreadcrumbItem,
            ];
        }
        return [
            { title: 'Siswa', href: '/siswa/dashboard' } as BreadcrumbItem,
            { title: 'Riwayat Presensi', href: '/siswa/dashboard' } as BreadcrumbItem,
        ];
    }

    return explicit;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url, props } = usePage<SharedData>();
    const role = (props.auth?.user as SharedData['auth']['user'] | undefined)?.role;
    const inferred = useMemo(() => inferBreadcrumbs(url, role, breadcrumbs), [url, role, breadcrumbs]);
    const [visible, setVisible] = useState(false);
    const [content, setContent] = useState(children);
    const [crumbs, setCrumbs] = useState(inferred);
    const latestChildren = useRef(children);
    const latestCrumbs = useRef(inferred);
    const firstRun = useRef(true);

    useEffect(() => {
        latestChildren.current = children;
        latestCrumbs.current = inferred;
    });

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            setCrumbs(inferred);
            const t = window.setTimeout(() => setVisible(true), 30);

            return () => window.clearTimeout(t);
        }

        const outTimer = window.setTimeout(() => setVisible(false), 0);
        const swapTimer = window.setTimeout(() => {
            setContent(latestChildren.current);
            setCrumbs(latestCrumbs.current);
            setVisible(true);
        }, 180);

        return () => {
            window.clearTimeout(outTimer);
            window.clearTimeout(swapTimer);
        };
    }, [url, inferred]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className={`dashboard-content overflow-x-hidden ${visible ? 'page-pop-in' : 'page-pop-out'}`}
            >
                <AppSidebarHeader breadcrumbs={crumbs} />
                {content}
            </AppContent>
        </AppShell>
    );
}
