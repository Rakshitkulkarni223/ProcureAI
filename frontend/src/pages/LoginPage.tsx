import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@procureai.com');
  const [password, setPassword] = useState('Demo@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white">
          <Boxes size={20} />
        </span>
        <span className="font-display text-xl font-bold tracking-tight">ProcureAI</span>
      </div>

      <h2 className="font-display text-3xl font-bold tracking-tight text-ink">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted">Sign in to your procurement workspace.</p>

      <form onSubmit={submit} className="mt-7 space-y-4" data-testid="login-form">
        <Input
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          data-testid="login-email"
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          data-testid="login-password"
          required
        />
        {error && (
          <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" data-testid="login-error">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading} data-testid="login-submit">
          Sign in
        </Button>
      </form>

      <div className="mt-5 rounded-md border border-line bg-surface px-3.5 py-3 text-xs text-muted">
        <span className="font-semibold text-ink">Demo:</span> demo@procureai.com · Demo@123
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        No account?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline" data-testid="goto-register">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
