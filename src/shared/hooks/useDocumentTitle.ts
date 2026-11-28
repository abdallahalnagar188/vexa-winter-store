import { useSeo } from './useSeo';

export function useDocumentTitle(
  title: string,
  options?: { description?: string; noIndex?: boolean },
): void {
  useSeo({
    title,
    description: options?.description,
    noIndex: options?.noIndex,
  });
}
