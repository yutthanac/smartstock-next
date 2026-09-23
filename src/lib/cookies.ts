/**
 * Cookie utility functions for client and server synchronization.
 * Stores authentication token and active store ID in HTTP cookies
 * so Next.js React Server Components (RSC) can access them during SSR.
 */

export const AUTH_COOKIE_NAME = 'smartstock_auth_token';
export const ACTIVE_STORE_COOKIE_NAME = 'smartstock_active_store_id';

export function setClientCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const [k, ...v] = c.trim().split('=');
    if (k === name) {
      return decodeURIComponent(v.join('='));
    }
  }
  return null;
}

export function deleteClientCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}
