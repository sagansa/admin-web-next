'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-amber-600 focus:outline-none focus:ring-amber-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
