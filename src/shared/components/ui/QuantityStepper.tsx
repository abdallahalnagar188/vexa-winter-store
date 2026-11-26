import { Minus, Plus } from 'lucide-react';
import { cn } from './cn';

interface QuantityStepperProps {
  value: number;
  max?: number;
  min?: number;
  onChange: (next: number) => void;
  className?: string;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  max = 10,
  min = 1,
  onChange,
  className,
  disabled,
}: QuantityStepperProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-[#3E452B]/25 bg-[#F5F2E8] text-[#3E452B]',
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center rounded-s-xl transition-colors hover:bg-[#3E452B]/10 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center font-display text-sm font-bold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center rounded-e-xl transition-colors hover:bg-[#3E452B]/10 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
