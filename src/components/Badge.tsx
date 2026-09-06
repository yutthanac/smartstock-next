'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'warning' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-50 text-slate-600 border border-slate-200',
  neutral: 'bg-slate-100 text-slate-700 border border-transparent',
  warning: 'bg-amber-50/70 text-amber-800 border border-amber-200',
  danger: 'bg-rose-50/70 text-rose-700 border border-rose-200',
  success: 'bg-slate-50 text-slate-700 border border-slate-300',
  outline: 'bg-white text-slate-600 border border-slate-200 shadow-2xs',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.2 text-[10px] gap-1',
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
