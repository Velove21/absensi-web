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
                            className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium text-black opacity-50 cursor-not-allowed"
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
                                ? 'bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 hover:text-white border-[#1e3a8a]'
                                : 'bg-white text-black hover:bg-[#dbeafe] hover:text-black border-input'
                        }`}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            })}
        </div>
    );
}
