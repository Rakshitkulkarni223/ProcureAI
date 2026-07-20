import React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-[0_8px_20px_rgba(34,197,94,0.18)] hover:bg-accent-hover hover:shadow-[0_12px_26px_rgba(34,197,94,0.24)]',
  accent: 'bg-accent text-white shadow-[0_8px_20px_rgba(34,197,94,0.18)] hover:bg-accent-hover hover:shadow-[0_12px_26px_rgba(34,197,94,0.24)]',
  outline: 'border border-line bg-slate-950/35 text-ink hover:border-white/20 hover:bg-bg',
  ghost: 'bg-transparent text-ink hover:bg-bg',
  danger: 'bg-danger text-white shadow-[0_8px_20px_rgba(239,68,68,0.16)] hover:bg-red-600',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight transition-all duration-200 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
