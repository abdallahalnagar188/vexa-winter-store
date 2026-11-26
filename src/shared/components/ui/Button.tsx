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
    'bg-[#F47B20] text-white hover:bg-[#DC6812] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-extrabold shadow-sm',
  secondary:
    'bg-[#3E452B] text-[#EAE6D7] hover:bg-[#2F3520] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-bold shadow-sm',
  outline:
    'border border-[#3E452B]/35 bg-transparent text-[#3E452B] hover:bg-[#3E452B]/10 active:scale-[0.98] font-bold',
  outlineLight:
    'border border-[#EAE6D7]/45 bg-transparent text-[#EAE6D7] hover:bg-[#EAE6D7]/15 active:scale-[0.98] font-bold',
  ghost: 'bg-transparent text-inherit hover:bg-[#3E452B]/10 font-semibold',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] font-bold shadow-sm',
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
        'inline-flex cursor-pointer items-center justify-center gap-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47B20] disabled:cursor-not-allowed disabled:opacity-55',
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
