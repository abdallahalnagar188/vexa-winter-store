import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-bold text-[#124E3B]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'min-h-11 w-full rounded-xl border bg-[#F2EFE6] px-3.5 py-2.5 text-sm text-[#124E3B] placeholder:text-[#124E3B]/45 transition-colors focus:border-[#124E3B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/60',
            error ? 'border-rose-600' : 'border-[#124E3B]/20',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#124E3B]/70">{hint}</p>}
        {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
