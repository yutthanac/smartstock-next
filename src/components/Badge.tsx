'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'warning' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-stone-50 text-stone-600 border border-stone-200',
  neutral: 'bg-stone-100 text-stone-700 border border-transparent',
  warning: 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]',
  danger: 'bg-rose-50/80 text-rose-700 border border-rose-200',
  success: 'bg-stone-50 text-stone-700 border border-stone-300',
  outline: 'bg-white text-stone-600 border border-stone-200 shadow-2xs',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full font-normal transition-colors select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
