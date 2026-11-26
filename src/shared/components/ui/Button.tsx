import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outlineLight' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FFD60A] text-[#124E3B] hover:bg-[#E6C000] active:scale-[0.99] font-extrabold shadow-sm',
  secondary:
    'bg-[#124E3B] text-[#E8E3D5] hover:bg-[#0C382A] active:scale-[0.99] font-bold shadow-sm',
  outline:
    'border border-[#124E3B]/30 bg-transparent text-[#124E3B] hover:bg-[#124E3B]/10 font-semibold',
  outlineLight:
    'border border-[#E8E3D5]/40 bg-transparent text-[#E8E3D5] hover:bg-[#E8E3D5]/10 font-semibold',
  ghost: 'bg-transparent text-inherit hover:bg-black/5 font-semibold',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 font-bold shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs rounded-lg',
  md: 'min-h-11 px-5 text-sm rounded-xl',
  lg: 'min-h-12 px-7 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD60A] disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
