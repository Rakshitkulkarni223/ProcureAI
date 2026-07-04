import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SearchSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  'data-testid'?: string;
  iconSize?: number;
  categoryLabel?: string;
}

export function SearchSuggestions({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  className,
  inputClassName,
  'data-testid': testId,
  iconSize = 17,
  categoryLabel,
}: SearchSuggestionsProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter suggestions based on current input
  const trimmedLen = value.trim().length;
  const filtered = trimmedLen >= 1 ? suggestions : [];
  const showNoMatch = open && trimmedLen >= 2 && filtered.length === 0;

  const selectItem = useCallback(
    (item: string) => {
      try {
        onChange(item);
        onSelect?.(item);
        setOpen(false);
        setActiveIdx(-1);
      } catch {
        // silent
      }
    },
    [onChange, onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      try {
        if (!filtered.length) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
          setActiveIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        } else if (e.key === 'Enter' && activeIdx >= 0 && open) {
          e.preventDefault();
          selectItem(filtered[activeIdx]);
        } else if (e.key === 'Escape') {
          setOpen(false);
          setActiveIdx(-1);
        }
      } catch {
        // silent
      }
    },
    [filtered, activeIdx, open, selectItem],
  );

  // Close dropdown on outside click
  useEffect(() => {
    try {
      const handler = (e: MouseEvent) => {
        if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
          setOpen(false);
          setActiveIdx(-1);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    } catch {
      // silent
    }
  }, []);

  // Scroll active item into view
  useEffect(() => {
    try {
      if (activeIdx >= 0 && listRef.current) {
        const item = listRef.current.children[activeIdx] as HTMLElement;
        item?.scrollIntoView({ block: 'nearest' });
      }
    } catch {
      // silent
    }
  }, [activeIdx]);

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <Search
        size={iconSize}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onFocus={() => {
          if (filtered.length) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10',
          inputClassName,
        )}
      />

      {/* Bloom-filtered suggestion dropdown */}
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-line bg-surface shadow-lg"
          role="listbox"
        >
          {filtered.map((item, i) => (
            <li
              key={item}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(item);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors',
                i === activeIdx
                  ? 'bg-accent/10 text-accent'
                  : 'text-ink hover:bg-bg',
              )}
            >
              <Search size={13} className="shrink-0 text-muted" />
              <span>{highlightMatch(item, value)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* No match hint */}
      {showNoMatch && categoryLabel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-line bg-surface px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertCircle size={14} className="shrink-0 text-warning" />
            <span>
              No suggestions for <strong className="text-ink">"{value.trim()}"</strong> in{' '}
              <strong className="text-ink">{categoryLabel}</strong>.
              You can still search — we'll check all suppliers.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Highlight the matching part of a suggestion */
function highlightMatch(text: string, query: string): React.ReactNode {
  try {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (idx < 0) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.trim().length);
    const after = text.slice(idx + query.trim().length);
    return (
      <>
        {before}
        <span className="font-semibold text-accent">{match}</span>
        {after}
      </>
    );
  } catch {
    return text;
  }
}
