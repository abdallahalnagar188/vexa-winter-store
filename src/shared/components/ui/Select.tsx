import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-bold text-[#132238]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'min-h-11 w-full rounded-xl border bg-[#FFFFFF] px-3.5 py-2.5 text-sm text-[#132238] transition-colors focus:border-[#132238] focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]/50',
            error ? 'border-rose-600' : 'border-[#132238]/20',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
