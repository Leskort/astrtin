'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export default function Card({ children, className = '', glow = true }: CardProps) {
  return (
    <div
      className={`
        bg-[var(--matrix-black)] 
        border-2 border-[var(--matrix-green-dark)] 
        ${glow ? 'hover:border-[var(--matrix-green-bright)] hover:button-glow' : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}

