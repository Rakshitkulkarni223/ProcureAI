import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getIcon } from '../lib/icons';
import { cn } from '../lib/utils';

export function ProductImage({
  src,
  alt,
  icon,
  className,
}: {
  src?: string;
  alt: string;
  icon?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const Icon = getIcon(icon);

  const openPopover = useCallback(() => {
    try {
      if (src && !failed) setShowPopover(true);
    } catch {
      // silent
    }
  }, [src, failed]);

  const closePopover = useCallback(() => {
    try {
      setShowPopover(false);
    } catch {
      // silent
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    try {
      if (!showPopover) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closePopover();
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    } catch {
      // silent
    }
  }, [showPopover, closePopover]);

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-bg text-muted', className)}>
        <Icon size={28} />
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        onClick={openPopover}
        className={cn('object-cover bg-bg cursor-pointer transition-transform hover:scale-105', className)}
        title="Click to enlarge"
      />

      {/* Lightbox popover */}
      {showPopover && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-up"
          onClick={closePopover}
        >
          <div
            className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePopover}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Large image */}
            <img
              src={src}
              alt={alt}
              className="max-h-[80vh] max-w-[80vw] object-contain"
            />

            {/* Caption */}
            {alt && (
              <div className="border-t border-line bg-surface px-4 py-2.5 text-center text-sm font-medium text-ink">
                {alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
