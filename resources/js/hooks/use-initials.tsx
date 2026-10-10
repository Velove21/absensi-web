import { useCallback } from 'react';

export type GetInitialsFn = (fullName: string) => string;

export function useInitials(): GetInitialsFn {
    return useCallback((fullName: string): string => {
        const trimmed = fullName.trim();

        if (trimmed.length === 0) {
            return '';
        }

        return trimmed.slice(0, 2).toUpperCase();
    }, []);
}
