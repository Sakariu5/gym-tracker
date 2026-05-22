'use client';

import clsx from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-1.5 text-sm text-muted">{label}</span>
      )}
      <input
        ref={ref}
        className={clsx(
          'bg-surfaceAlt border border-borderAlt rounded-xl px-3 py-3 w-full text-white outline-none focus:border-accent transition-colors',
          className,
        )}
        {...rest}
      />
    </label>
  );
});
