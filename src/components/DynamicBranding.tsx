'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

/**
 * DynamicBranding injects the active store's:
 * 1. Favicon (<link rel="icon"> and <link rel="apple-touch-icon">)
 * 2. OG Image (<meta property="og:image"> and <meta name="twitter:image">)
 * 3. Document title prefix with store name if available
 */
export function DynamicBranding() {
  const { activeStore } = useAuth();

  useEffect(() => {
    if (!activeStore) return;

    // 1. Update Favicon dynamically
    if (activeStore.favicon_url) {
      let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = activeStore.favicon_url;

      let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = activeStore.favicon_url;
    }

    // 2. Update Open Graph Image
    if (activeStore.og_image_url) {
      let ogMeta = document.querySelector<HTMLMetaElement>("meta[property='og:image']");
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogMeta);
      }
      ogMeta.content = activeStore.og_image_url;

      let twitterMeta = document.querySelector<HTMLMetaElement>("meta[name='twitter:image']");
      if (!twitterMeta) {
        twitterMeta = document.createElement('meta');
        twitterMeta.setAttribute('name', 'twitter:image');
        document.head.appendChild(twitterMeta);
      }
      twitterMeta.content = activeStore.og_image_url;
    }

    // 3. Update OG Site Name / Title if configured
    if (activeStore.name) {
      let ogTitle = document.querySelector<HTMLMetaElement>("meta[property='og:title']");
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = `${activeStore.name} - SmartStock`;
    }
  }, [activeStore?.id, activeStore?.favicon_url, activeStore?.og_image_url, activeStore?.name]);

  return null;
}
