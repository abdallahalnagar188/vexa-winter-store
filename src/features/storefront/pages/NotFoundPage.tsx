import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <EmptyState
        title="404"
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
