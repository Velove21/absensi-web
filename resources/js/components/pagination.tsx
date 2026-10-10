import { Link } from '@inertiajs/react';

interface Props {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function Pagination({ links }: Props) {
    if (links.length <= 3) {
        return null;
    }

    const translateLabel = (label: string) => {
        if (label.includes('Previous')) {
            return label.replace(/Previous/g, 'Sebelumnya');
        }
        if (label.includes('Next')) {
            return label.replace(/Next/g, 'Selanjutnya');
        }
        return label;
    };

    return (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5" data-slot="pagination">
            {links.map((link, index) => {
                const html = translateLabel(link.label);
                if (link.url === null) {
                    return (
                        <div
                            key={index}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background/50 px-3 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed select-none"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    );
                }

                return (
                    <Link
                        key={index}
                        href={link.url}
                        className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none ${
                            link.active
                                ? '!bg-slate-900 !text-white !border-slate-900 shadow-sm dark:!bg-slate-100 dark:!text-slate-900'
                                : '!bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-slate-900 border-input dark:!bg-card dark:!text-card-foreground dark:hover:!bg-muted'
                        }`}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            })}
        </div>
    );
}
