import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();
    const [visible, setVisible] = useState(false);
    const [content, setContent] = useState(children);
    const [crumbs, setCrumbs] = useState(breadcrumbs);
    const latestChildren = useRef(children);
    const latestCrumbs = useRef(breadcrumbs);
    const firstRun = useRef(true);

    useEffect(() => {
        latestChildren.current = children;
        latestCrumbs.current = breadcrumbs;
    });

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
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
    }, [url]);

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
