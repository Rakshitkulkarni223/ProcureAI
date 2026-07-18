import React, { useEffect, useState } from 'react';
import { Check, User as UserIcon, MapPin } from 'lucide-react';
import type { Category, Preferences, SortOption } from '../types';
import { api, apiError } from '../lib/api';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'lowest_price', label: 'Lowest Price' },
  { value: 'highest_rating', label: 'Highest Rating' },
  { value: 'fastest_delivery', label: 'Fastest Delivery' },
  { value: 'highest_discount', label: 'Highest Discount' },
];

export function SettingsPage() {
  const { user } = useAuth();
  const { city: contextCity, cities: availableCities, setCity } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.categories(), api.preferences()])
      .then(([c, pr]) => {
        setCategories(c);
        setPrefs({ ...pr, city: pr.city || contextCity });
      })
      .catch((e) => setError(apiError(e)));
  }, []);

  const update = (patch: Partial<Preferences>) => {
    setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.updatePreferences({
        defaultCategory: prefs.defaultCategory,
        sortPreference: prefs.sortPreference,
        weightProfile: prefs.weightProfile,
        businessType: prefs.businessType,
        city: prefs.city,
      });
      setPrefs(updated);
      setCity(updated.city || prefs.city || contextCity);
      setSaved(true);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <div className="label-eyebrow">Account</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Tune how the AI ranks suppliers for your business.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex items-center gap-2">
            <UserIcon size={15} className="text-muted" />
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Profile</h3>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Field label="Name" value={user?.name} />
            <Field label="Email" value={user?.email} />
            <div className="flex items-center justify-between">
              <span className="label-eyebrow">Role</span>
              <Badge tone="accent">{user?.role}</Badge>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">Procurement Preferences</h3>
          </CardHeader>
          <CardBody className="space-y-6" data-testid="preferences-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="label-eyebrow block">Default Category</label>
                <select
                  data-testid="pref-default-category"
                  value={prefs?.defaultCategory || ''}
                  onChange={(e) => update({ defaultCategory: e.target.value })}
                  className="h-11 w-full appearance-none rounded-md border border-line bg-surface px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="label-eyebrow block">Default Sort</label>
                <select
                  data-testid="pref-sort"
                  value={prefs?.sortPreference || 'lowest_price'}
                  onChange={(e) => update({ sortPreference: e.target.value as SortOption })}
                  className="h-11 w-full appearance-none rounded-md border border-line bg-surface px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Location */}
            {availableCities.length > 0 && (
              <div className="space-y-1.5">
                <label className="label-eyebrow flex items-center gap-1.5">
                  <MapPin size={11} className="text-muted" /> Delivery Location
                </label>
                <select
                  data-testid="pref-city"
                  value={prefs?.city || contextCity || 'Hyderabad'}
                  onChange={(e) => update({ city: e.target.value })}
                  className="h-11 w-full appearance-none rounded-md border border-line bg-surface px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <p className="text-xs text-muted">Used for distance-based delivery estimates across all pages.</p>
              </div>
            )}

            {error && <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

            <div className="flex items-center gap-3">
              <Button onClick={save} loading={saving} data-testid="save-preferences">
                Save Preferences
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-success" data-testid="preferences-saved">
                  <Check size={15} /> Saved
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="label-eyebrow">{label}</span>
      <span className="font-medium text-ink">{value || '—'}</span>
    </div>
  );
}
