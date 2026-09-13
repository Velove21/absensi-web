import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * Polling auto-refresh untuk Inertia.
 * - Hanya reload saat halaman visible (hemat resource)
 * - Gunakan `only` untuk partial reload (lebih ringan)
 * - `async:true` agar tidak cancel request user yang sedang spam
 */
export function useAutoRefresh(enabled: boolean, intervalMs = 5000, only?: string[]): void {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const doReload = (): void => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            const opts: Record<string, unknown> = {
                preserveScroll: true,
                preserveUrl: true,
                async: true,
            };
            if (only && only.length) {
                opts.only = only;
            }
            (router.reload as unknown as (opts: Record<string, unknown>) => void)(opts);
        };

        // Immediate refresh on mount (fix deployed manual refresh needed)
        const t0 = setTimeout(doReload, 350);
        intervalRef.current = setInterval(doReload, intervalMs);

        const onVisibility = (): void => {
            if (document.visibilityState === 'visible') {
                doReload();
            }
        };

        const onSuccess = () => {
            setTimeout(doReload, 400);
        };

        document.addEventListener('visibilitychange', onVisibility);
        const offSuccess = router.on('success', onSuccess);

        return () => {
            clearTimeout(t0);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', onVisibility);
            if (typeof offSuccess === 'function') {
                (offSuccess as unknown as () => void)();
            }
        };
    }, [enabled, intervalMs, only === undefined ? undefined : only.join(',')]);
}
