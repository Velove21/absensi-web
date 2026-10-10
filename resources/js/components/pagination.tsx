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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
            {links.map((link, index) => {
                const html = translateLabel(link.label);
                if (link.url === null) {
                    return (
                        <div
                            key={index}
                            className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium text-[#1E3A8A] opacity-50 cursor-not-allowed"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    );
                }

                return (
                    <Link
                        key={index}
                        href={link.url}
                        className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                            link.active
                                ? 'bg-[#1E293B] text-white hover:bg-[#1E293B]/90 hover:text-white border-[#1E293B]'
                                : 'bg-white text-[#1E3A8A] hover:bg-[#f0f4fa] hover:text-[#1E3A8A] border-input'
                        }`}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            })}
        </div>
    );
}
