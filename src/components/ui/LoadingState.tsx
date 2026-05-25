'use client';

import { cn } from '@/lib/utils';

export function LoadingState({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 text-sm text-gray-700', className)}>
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-transparent" />
      {message ? <p className="mt-3 text-gray-700">{message}</p> : null}
    </div>
  );
}
