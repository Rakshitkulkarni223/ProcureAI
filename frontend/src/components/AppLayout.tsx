import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  BarChart3,
  History,
  Settings,
  LogOut,
  Boxes,
  Menu,
  X,
  FileText,
  Eye,
  Moon,
  Sun,
  TrendingUp,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { LocationDropdown } from './LocationDropdown';
import { AIChatPanel } from './AIChatPanel';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, testid: 'nav-dashboard' },
  { to: '/search', label: 'Search & Compare', icon: Search, testid: 'nav-search' },
  { to: '/impact', label: 'Business Impact', icon: TrendingUp, testid: 'nav-impact' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, testid: 'nav-analytics' },
  { to: '/history', label: 'Search History', icon: History, testid: 'nav-history' },
  { to: '/watchlist', label: 'Watchlist', icon: Eye, testid: 'nav-watchlist' },
  { to: '/supplier-hub', label: 'Supplier Hub', icon: Store, testid: 'nav-supplier-hub' },
  { to: '/settings', label: 'Settings', icon: Settings, testid: 'nav-settings' },
  { to: '/docs', label: 'Documentation', icon: FileText, testid: 'nav-docs' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-line">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white">
          <Boxes size={18} />
        </span>
        <div className="leading-none">
          <div className="font-display text-lg font-bold tracking-tight text-ink">ProcureAI</div>
          <div className="label-eyebrow text-[9px] mt-0.5">Vendor Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        <div className="label-eyebrow px-2 pb-2">Workspace</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-testid={item.testid}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                isActive ? 'bg-accent text-white' : 'text-muted hover:bg-bg hover:text-ink',
              )
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent font-display font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink">{user?.name}</div>
            <div className="truncate text-xs text-muted">{user?.email}</div>
          </div>
        </div>
        <button
          data-testid="theme-toggle"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          data-testid="logout-button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-danger"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface border-r border-line">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Desktop top bar */}
        <div className="sticky top-0 z-20 hidden h-12 items-center justify-end gap-3 border-b border-line bg-surface/80 px-5 backdrop-blur lg:flex">
          <LocationDropdown readOnly />
        </div>

        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-5 backdrop-blur lg:hidden">
          <button
            data-testid="mobile-menu-button"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-ink hover:bg-bg"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-display text-lg font-bold tracking-tight">ProcureAI</span>
          <div className="ml-auto">
            <LocationDropdown readOnly />
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-5 py-7 lg:px-9 lg:py-9">{children}</main>
      </div>

      {/* AI Assistant floating panel */}
      <AIChatPanel />
    </div>
  );
}
