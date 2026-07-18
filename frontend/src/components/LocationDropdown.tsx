import React, { useEffect, useState, useRef } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { api, apiError } from '../lib/api';

export function LocationDropdown({ readOnly = false }: { readOnly?: boolean }) {
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState<string>('Mumbai');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      Promise.all([api.cities(), api.preferences()])
        .then(([citiesData, pref]) => {
          setCities(citiesData.cities || []);
          setCity(pref.city || citiesData.default || 'Mumbai');
        })
        .catch((e) => console.error(apiError(e)));
    } catch (e) {
      console.error('Failed to load location data', e);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      try {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false);
        }
      } catch {
        /* silent */
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeCity = async (newCity: string) => {
    try {
      setCity(newCity);
      setOpen(false);
      setLoading(true);
      await api.updatePreferences({ city: newCity });
    } catch (e) {
      console.error('Failed to update city', e);
    } finally {
      setLoading(false);
    }
  };

  if (readOnly) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink" data-testid="location-readonly">
        <MapPin size={13} className="text-accent shrink-0" />
        <span className="max-w-[100px] truncate">{city}</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative" data-testid="location-dropdown">
      <button
        onClick={() => { try { setOpen((v) => !v); } catch { /* silent */ } }}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 disabled:opacity-50"
        data-testid="location-dropdown-trigger"
      >
        <MapPin size={13} className="text-accent shrink-0" />
        <span className="max-w-[100px] truncate">{city}</span>
        <ChevronDown size={12} className="text-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 max-h-64 w-44 overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => { try { changeCity(c); } catch { /* silent */ } }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-bg ${
                c === city ? 'font-semibold text-accent' : 'text-ink-soft'
              }`}
            >
              <MapPin size={11} className="shrink-0 opacity-60" />
              <span className="truncate">{c}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
