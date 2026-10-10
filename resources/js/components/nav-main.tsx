import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [], label = 'Menu' }: { items: NavItem[]; label?: string }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    // Saat collapsed: sisakan gambar/icon aja, tulisannya hidden, icon di tengah — samakan dengan ukuran profil (size-8) biar setara, tidak ngecrack
                                    'group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:translate-x-[1px]',
                                    active &&
                                        'shadow-[0_6px_16px_rgba(0,35,153,0.35)] bg-[#002399]! text-white! hover:bg-[#002399]! hover:text-white!'
                                )}
                            >
                                <Link href={item.href} prefetch className="flex items-center gap-2">
                                    {item.icon && <item.icon className="shrink-0" />}
                                    <span className="truncate group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
