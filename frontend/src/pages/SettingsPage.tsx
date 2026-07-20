import React, { useEffect, useState } from 'react';
import { Check, User as UserIcon, MapPin, Package } from 'lucide-react';
import type { Category, Preferences } from '../types';
import { api, apiError } from '../lib/api';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

const BUSINESS_TYPES = [
  { value: 'startup', label: 'Startup' },
  { value: 'restaurant', label: 'Restaurant / Hotel' },
  { value: 'hospital', label: 'Hospital / Clinic' },
  { value: 'retail', label: 'Retail / Agency' },
  { value: 'general', label: 'General / Office' },
];

export function SettingsPage() {
  const { user } = useAuth();
  const { city: contextCity, cities: availableCities, setCity } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [savedPrefs, setSavedPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const hasUnsavedChanges = Boolean(
    prefs && savedPrefs && (
      prefs.defaultCategory !== savedPrefs.defaultCategory ||
      prefs.businessType !== savedPrefs.businessType ||
      prefs.city !== savedPrefs.city
    )
  );

  useEffect(() => {
    try {
      Promise.all([api.categories(), api.preferences()])
        .then(([categoryData, preferenceData]) => {
          const loadedPrefs = { ...preferenceData, city: preferenceData.city || contextCity };
          setCategories(categoryData);
          setPrefs(loadedPrefs);
          setSavedPrefs(loadedPrefs);
        })
        .catch((e) => setError(apiError(e)));
    } catch (e) {
      setError(apiError(e));
    }
  }, [contextCity]);

  const update = (patch: Partial<Preferences>) => {
    try {
      setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
      setSaved(false);
    } catch (e) {
      setError(apiError(e));
    }
  };

  const cancel = () => {
    try {
      if (savedPrefs) setPrefs({ ...savedPrefs });
      setSaved(false);
      setError('');
    } catch (e) {
      setError(apiError(e));
    }
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.updatePreferences({
        defaultCategory: prefs.defaultCategory,
        businessType: prefs.businessType,
        city: prefs.city,
      });
      setPrefs(updated);
      setSavedPrefs(updated);
      setCity(updated.city || prefs.city || contextCity);
      setSaved(true);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <div className="label-eyebrow">Workspace</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Workspace Settings</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Manage your account, procurement preferences, AI behavior, and workspace configuration.</p>
      </div>

      <Card className="border border-line bg-surface shadow-card">
        <CardHeader className="flex items-center gap-2 border-line">
          <UserIcon size={16} className="text-sky-400" />
          <h2 className="font-display text-base font-semibold tracking-tight text-ink">Account</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-xl font-display font-bold text-accent">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-ink">{user?.name || 'User'}</h3>
              <Badge tone="accent">{user?.role || 'User'}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{user?.email || '—'}</p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-line bg-surface shadow-card">
          <CardHeader className="flex items-center gap-2 border-line">
            <Package size={16} className="text-accent" />
            <div>
              <h2 className="font-display text-base font-semibold tracking-tight text-ink">Procurement Defaults</h2>
              <p className="mt-0.5 text-xs text-muted">Applied when starting a new supplier comparison.</p>
            </div>
          </CardHeader>
          <CardBody className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <SelectField
              label="Default category"
              testId="pref-default-category"
              value={prefs?.defaultCategory || ''}
              onChange={(value) => update({ defaultCategory: value })}
              options={categories.map((category) => ({ value: category.slug, label: category.name }))}
            />
            <SelectField
              label="Business type"
              value={prefs?.businessType || 'general'}
              onChange={(value) => update({ businessType: value })}
              options={BUSINESS_TYPES}
            />
            {availableCities.length > 0 && (
              <div className="sm:col-span-2">
                <SelectField
                  label="Delivery location"
                  testId="pref-city"
                  value={prefs?.city || contextCity || 'Hyderabad'}
                  onChange={(value) => update({ city: value })}
                  options={availableCities.map((city) => ({ value: city, label: city }))}
                  description="Used for distance-based delivery estimates."
                />
              </div>
            )}
          </CardBody>
      </Card>

      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      {hasUnsavedChanges ? (
        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" onClick={cancel} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} data-testid="save-preferences">Save Changes</Button>
        </div>
      ) : saved ? (
        <div className="flex items-center justify-end gap-1.5 border-t border-line pt-5 text-sm text-success" data-testid="preferences-saved">
          <Check size={15} /> Changes saved
        </div>
      ) : null}
    </div>
  );
}


function SelectField({
  label,
  value,
  options,
  onChange,
  description,
  testId,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  description?: string;
  testId?: string;
}) {
  try {
    return (
      <div className="space-y-1.5">
        <label className="label-eyebrow block">{label}</label>
        <select
          data-testid={testId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-md border border-line bg-bg px-3.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {description && <p className="text-xs leading-5 text-muted">{description}</p>}
      </div>
    );
  } catch {
    return null;
  }
}
