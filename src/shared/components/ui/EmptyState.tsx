import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from './cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  headingLevel?: 'h1' | 'h2' | 'h3';
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  headingLevel = 'h3',
}: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-sm border border-[#132238]/15 bg-[#FFFFFF] px-6 py-12 text-center text-[#132238] shadow-xs',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-[2px] bg-[#132238] text-[#FF6B1A]"
      >
        {icon ?? <PackageOpen className="h-7 w-7" />}
      </div>
      <Heading className="text-lg font-extrabold">{title}</Heading>
      {description && <p className="mt-1 max-w-md text-sm text-[#132238]/75">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
