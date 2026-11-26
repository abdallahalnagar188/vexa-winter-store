import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const siteName = import.meta.env.VITE_SITE_NAME || 'VEXA';
    document.title = `${title} | ${siteName}`;
  }, [title]);
}
