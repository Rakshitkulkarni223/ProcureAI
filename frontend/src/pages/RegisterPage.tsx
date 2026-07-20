import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';

const BUSINESS_TYPES = [
  { value: 'startup', label: 'Startup' },
  { value: 'restaurant', label: 'Restaurant / Hotel' },
  { value: 'hospital', label: 'Hospital / Clinic' },
  { value: 'retail', label: 'Retail / Agency' },
  { value: 'general', label: 'General / Office' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessType: 'startup' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.businessType);
      navigate('/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8 flex items-center gap-2.5 xl:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white">
          <Boxes size={20} />
        </span>
        <span className="font-display text-xl font-bold tracking-tight">ProcureAI</span>
      </div>

      <h2 className="font-display text-3xl font-bold tracking-tight text-ink">Create your workspace</h2>
      <p className="mt-1.5 text-sm text-muted">Start comparing suppliers in minutes.</p>

      <form onSubmit={submit} className="mt-7 space-y-4" data-testid="register-form">
        <Input
          id="name"
          label="Full name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Jane Doe"
          data-testid="register-name"
          required
        />
        <Input
          id="email"
          label="Work email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="you@company.com"
          data-testid="register-email"
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          placeholder="At least 6 characters"
          data-testid="register-password"
          required
        />
        <div className="space-y-1.5">
          <label className="label-eyebrow block">Business type</label>
          <select
            value={form.businessType}
            onChange={(e) => update('businessType', e.target.value)}
            data-testid="register-business-type"
            className="h-11 w-full appearance-none rounded-md border border-line bg-surface px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
          >
            {BUSINESS_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" data-testid="register-error">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading} data-testid="register-submit">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline" data-testid="goto-login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
