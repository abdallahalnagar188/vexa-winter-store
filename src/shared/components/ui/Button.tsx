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
    'bg-[#FF6B1A] text-white hover:bg-[#E85A0C] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] font-extrabold shadow-xs',
  secondary:
    'bg-[#132238] text-[#F4F2EC] hover:bg-[#0C1626] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] font-bold shadow-xs',
  outline:
    'border border-[#132238]/30 bg-transparent text-[#132238] hover:border-[#132238]/60 hover:bg-[#132238]/6 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-[0.98] font-bold',
  outlineLight:
    'border border-[#F4F2EC]/45 bg-transparent text-[#F4F2EC] hover:bg-[#F4F2EC]/15 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-bold',
  ghost: 'bg-transparent text-inherit hover:bg-[#132238]/8 font-semibold',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-bold shadow-xs',
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
        'inline-flex cursor-pointer items-center justify-center gap-2 transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B1A] disabled:cursor-not-allowed disabled:opacity-55',
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
