import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type Props = {
    src?: string | null;
    alt: string;
    className?: string;
};

export function ProfilePhoto({ src, alt, className }: Props) {
    return (
        <Avatar
            className={cn(
                'aspect-square size-40 shrink-0 overflow-hidden rounded-lg ring-2 ring-sidebar-border/70',
                className
            )}
        >
            <AvatarImage src={src ?? undefined} alt={alt} className="size-full object-cover" />
            <AvatarFallback className="bg-neutral-100 text-3xl font-semibold text-[#1E3A8A]">
                {alt.slice(0, 2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );
}