'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  glow = true,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-mono border-2 transition-all duration-300 focus:outline-none';
  
  const variantStyles = {
    primary: 'border-[var(--matrix-green-bright)] text-[var(--matrix-green-bright)] hover:bg-[var(--matrix-green-bright)] hover:text-[var(--matrix-black)]',
    secondary: 'border-[var(--matrix-gray-light)] text-[var(--matrix-green-soft)] hover:border-[var(--matrix-green-bright)]',
    danger: 'border-[var(--matrix-red-neon)] text-[var(--matrix-red-neon)] hover:bg-[var(--matrix-red-neon)] hover:text-[var(--matrix-black)]',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-[40px] md:min-h-[44px]',
    md: 'px-4 py-2 text-base md:text-base text-sm min-h-[48px] md:min-h-[44px]',
    lg: 'px-6 py-3 text-lg md:text-lg text-base min-h-[52px] md:min-h-[48px]',
  };
  
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed border-[var(--matrix-gray-medium)] text-[var(--matrix-gray-medium)]' 
    : '';
  
  const glowClass = glow && !disabled ? 'button-glow' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${glowClass} ${disabledStyles} ${className} touch-manipulation active:scale-95 transition-transform`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

