'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface DropdownProps {
  options: (DropdownOption | string)[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'เลือกรายการ...',
  className = '',
  buttonClassName = '',
  size = 'md',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to DropdownOption
  const normalizedOptions: DropdownOption[] = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Size styling
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs rounded-xl',
    md: 'py-2.5 px-3.5 text-xs rounded-2xl',
    lg: 'py-3 px-4 text-sm rounded-2xl',
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 skeuo-btn-secondary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${
          isOpen ? 'border-emerald-600 ring-2 ring-emerald-500/20' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-700' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full min-w-[160px] skeuo-card rounded-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto no-scrollbar shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);

            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {opt.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
