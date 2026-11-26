import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from './cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-[#132238]/15 bg-[#FFFFFF] px-6 py-12 text-center text-[#132238] shadow-xs',
        className,
      )}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#132238] text-[#FF6B1A]">
        {icon ?? <PackageOpen className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-[#132238]/75">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
