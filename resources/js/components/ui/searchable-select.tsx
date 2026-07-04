import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, Check } from 'lucide-react';

interface SearchableItem {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    items: SearchableItem[];
    className?: string;
}

export default function SearchableSelect({
    value,
    onValueChange,
    placeholder = 'Pilih...',
    items,
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = items.find(i => i.value === value)?.label;

    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
            setHighlightedIndex(0);
        }
        if (!open) {
            setSearch('');
        }
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredItems[highlightedIndex]) {
            e.preventDefault();
            onValueChange(filteredItems[highlightedIndex].value);
            setOpen(false);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }, [filteredItems, highlightedIndex, onValueChange]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    'border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                    !value && 'text-muted-foreground',
                    className,
                )}
            >
                <span className="line-clamp-1 flex-1 text-left">
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div
                    className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full min-w-[8rem] origin-top overflow-hidden rounded-md border shadow-md animate-in fade-in zoom-in-95"
                    onKeyDown={handleKeyDown}
                >
                    <div className="flex items-center gap-2 border-b px-3 py-2">
                        <Search className="size-4 shrink-0 opacity-50" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setHighlightedIndex(0);
                            }}
                            placeholder="Cari..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredItems.length === 0 ? (
                            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                Tidak ada hasil
                            </p>
                        ) : (
                            filteredItems.map((item, index) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    className={cn(
                                        'relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 pr-8 text-sm outline-none',
                                        index === highlightedIndex
                                            ? 'bg-accent text-accent-foreground'
                                            : '',
                                        value === item.value
                                            ? 'font-medium'
                                            : '',
                                    )}
                                    onClick={() => {
                                        onValueChange(item.value);
                                        setOpen(false);
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {value === item.value && (
                                        <Check className="size-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
