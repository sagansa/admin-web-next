'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 text-center text-sm text-gray-700', className)}>
      <p className="font-semibold text-gray-800">{title}</p>
      {description ? <p className="mt-2 text-gray-600">{description}</p> : null}
    </div>
  );
}
