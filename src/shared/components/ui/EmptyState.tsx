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
        'flex flex-col items-center justify-center rounded-2xl border border-[#124E3B]/15 bg-[#E8E3D5] px-6 py-12 text-center text-[#124E3B]',
        className,
      )}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#124E3B] text-[#FFD60A]">
        {icon ?? <PackageOpen className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-[#124E3B]/75">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
