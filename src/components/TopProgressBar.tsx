'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsVisible(true);
    setProgress(25);

    // Increment gradually to simulate progress
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 50) return prev + 15;
        if (prev < 75) return prev + 8;
        if (prev < 88) return prev + 3;
        return prev;
      });
    }, 150);

    // Safety timeout: don't stay visible forever if navigation was cancelled
    safetyTimerRef.current = setTimeout(() => {
      stopProgress();
    }, 8000);
  };

  const stopProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 250);
  };

  // Complete progress whenever route or query params change
  useEffect(() => {
    stopProgress();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [pathname, searchParams]);

  // Global click interceptor on internal links to start progress instantly (0ms feedback)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Ignore external, target=_blank, download, hash-only, or mailto/tel links
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        targetAttr === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      // Ignore modifier clicks (open in new tab/window)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Check if same origin and different path
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          const isSamePage =
            url.pathname === window.location.pathname &&
            url.search === window.location.search;
          if (!isSamePage) {
            startProgress();
          }
        }
      } catch {
        // invalid URL or relative path fallback
        if (href.startsWith('/') && href !== window.location.pathname) {
          startProgress();
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[2.5px] bg-transparent overflow-hidden print:hidden"
    >
      <div
        className="h-full bg-stone-900 shadow-[0_0_8px_rgba(28,25,23,0.5)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '200ms',
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
}
