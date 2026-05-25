'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, required, description, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-medium text-gray-800">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
