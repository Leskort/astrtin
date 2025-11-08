'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-[var(--matrix-green-soft)] text-sm font-mono">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2 
            bg-[var(--matrix-black)] 
            border-2 border-[var(--matrix-green-dark)] 
            text-[var(--matrix-green-bright)] 
            font-mono
            placeholder:text-[var(--matrix-green-dark)] 
            placeholder:opacity-50
            focus:outline-none 
            focus:border-[var(--matrix-green-bright)]
            focus:button-glow
            transition-all duration-300
            ${error ? 'border-[var(--matrix-red-neon)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[var(--matrix-red-neon)] text-sm font-mono text-glow-red">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

