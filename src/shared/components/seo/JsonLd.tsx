import { useEffect } from 'react';

interface JsonLdProps {
  id: string;
  data: Record<string, unknown> | Array<Record<string, unknown>> | null;
}

export function JsonLd({ id, data }: JsonLdProps) {
  const serialized = data ? JSON.stringify(data) : null;

  useEffect(() => {
    const selector = `script[type="application/ld+json"][data-vexa-jsonld="${id}"]`;
    const existing = document.head.querySelector<HTMLScriptElement>(selector);

    if (!serialized) {
      existing?.remove();
      return;
    }

    const scriptEl = existing ?? document.createElement('script');
    scriptEl.type = 'application/ld+json';
    scriptEl.setAttribute('data-vexa-jsonld', id);
    scriptEl.textContent = serialized;

    if (!existing) {
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.head.querySelector(selector)?.remove();
    };
  }, [id, serialized]);

  return null;
}
