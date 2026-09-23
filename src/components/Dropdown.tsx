'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

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
  searchable?: boolean;
  searchPlaceholder?: string;
  placement?: 'auto' | 'bottom' | 'top';
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
  searchable = false,
  searchPlaceholder = 'ค้นหา...',
  placement = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Normalize options to DropdownOption
  const normalizedOptions: DropdownOption[] = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Compute fixed popover coordinates based on button's bounding box
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const availableBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 240; // Estimated max height

    let top = rect.bottom + 6;
    // If not forced to bottom and not enough room below, open upwards
    if (placement === 'top') {
      top = rect.top - dropdownHeight - 6;
    } else if (placement === 'auto') {
      if (availableBelow < dropdownHeight && rect.top > dropdownHeight) {
        top = rect.top - dropdownHeight - 6;
      }
    }

    setMenuPosition({
      top: Math.max(8, top),
      left: rect.left,
      width: Math.max(rect.width, 180),
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setSearch('');
      setIsOpen(true);
      // Auto-focus the search input after the portal mounts
      if (searchable) {
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicked outside or when window scrolls/resizes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (event: Event) => {
      // If scrolling inside the dropdown itself, don't close
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Size styling matching standardized Button and Input heights
  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded-xl',
    md: 'h-10 px-3.5 text-xs sm:text-sm rounded-xl',
    lg: 'h-11 px-4 text-sm rounded-xl',
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 bg-white border border-stone-200/90 text-stone-800 rounded-xl hover:bg-stone-50/80 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all cursor-pointer font-normal disabled:opacity-50 disabled:cursor-not-allowed ${
          sizeClasses[size]
        } ${isOpen ? 'border-stone-400 ring-2 ring-stone-900/10' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-stone-800' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover via Portal (ทะลุกรอบ modal / overflow:hidden ทุกชนิด) */}
      {isOpen &&
        menuPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              zIndex: 99999,
            }}
        className="rounded-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col shadow-[0_16px_36px_rgba(28,25,23,0.12)] border border-stone-200/90 bg-white"
          >
            {searchable && (
              <div className="px-2.5 pt-2 pb-1.5 border-b border-stone-100 shrink-0">
                <div className="relative">
                  <Search className="w-3 h-3 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>
            )}
            <div className="overflow-y-auto flex-1 py-1">
            {(() => {
              const filtered = searchable && search.trim()
                ? normalizedOptions.filter((opt) =>
                    opt.label.toLowerCase().includes(search.trim().toLowerCase())
                  )
                : normalizedOptions;
              if (filtered.length === 0) {
                return (
                  <div className="px-3.5 py-3 text-xs text-stone-400 text-center">
                    ไม่พบรายการที่ตรงกัน
                  </div>
                );
              }
              return filtered.map((opt) => {
              const isSelected = String(opt.value) === String(value);

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-stone-100 text-stone-900 font-semibold'
                      : 'text-stone-800 hover:bg-stone-50 hover:text-stone-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate font-medium text-stone-900">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-stone-900 shrink-0" />}
                  </div>
                </button>
              );
              });
            })()}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
