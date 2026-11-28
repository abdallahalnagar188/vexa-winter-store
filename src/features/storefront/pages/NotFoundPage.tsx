import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useSeo } from '@/shared/hooks/useSeo';

export function NotFoundPage() {
  const { t } = useTranslation();
  useSeo({ title: '404', noIndex: true });

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <EmptyState
        title="404"
        headingLevel="h1"
        description={t('catalog.noProducts')}
        action={
          <Link to="/">
            <Button variant="primary">{t('nav.home')}</Button>
          </Link>
        }
      />
    </div>
  );
}
