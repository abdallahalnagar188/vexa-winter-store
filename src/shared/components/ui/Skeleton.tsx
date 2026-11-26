import { cn } from './cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-sm bg-[#132238]/12', className)} />;
}
