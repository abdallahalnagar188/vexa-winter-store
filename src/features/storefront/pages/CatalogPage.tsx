import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { StaggerGrid } from '@/shared/components/motion/StaggerGrid';
import { CategoryChips } from '@/features/storefront/components/CategoryChips';
import { ProductCard } from '@/features/storefront/components/ProductCard';
import { useProducts } from '@/features/storefront/api/useProducts';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useTiers } from '@/features/storefront/api/useTiers';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';

export function CatalogPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('catalog.title'));
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [limit, setLimit] = useState(24);

  const categoriesQuery = useCategories();
  const tiersQuery = useTiers();
  const productsQuery = useProducts({ categorySlug: selectedCategory, sort, limit });

  const handleCategory = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setSearchParams(next);
  };

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black text-[#132238] sm:text-3xl">{t('catalog.title')}</h1>

        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => setSort(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
          className="min-h-11 rounded-xl border border-[#132238]/20 bg-[#FFFFFF] px-3.5 text-sm font-bold text-[#132238] focus:border-[#FF6B1A] focus:outline-none"
        >
          <option value="newest">{t('catalog.sortNewest')}</option>
          <option value="price_asc">{t('catalog.sortPriceAsc')}</option>
          <option value="price_desc">{t('catalog.sortPriceDesc')}</option>
        </select>
      </div>

      <div className="mb-8">
        <CategoryChips
          categories={categoriesQuery.data ?? []}
          selectedSlug={selectedCategory}
          onSelect={handleCategory}
        />
      </div>

      {productsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-3/4 w-full rounded-2xl" />
          ))}
        </div>
      ) : productsQuery.isError ? (
        <EmptyState
          title={t('checkout.errors.generic')}
          action={
            <Button variant="primary" onClick={() => productsQuery.refetch()}>
              {t('catalog.retry')}
            </Button>
          }
        />
      ) : (productsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title={t('catalog.noProducts')} />
      ) : (
        <>
          <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(productsQuery.data ?? []).map((product) => (
              <ProductCard key={product.id} product={product} tiers={tiersQuery.data ?? []} />
            ))}
          </StaggerGrid>

          {(productsQuery.data?.length ?? 0) >= limit && (
            <div className="mt-8 flex justify-center">
              <Button variant="primary" onClick={() => setLimit((l) => l + 24)}>
                {t('catalog.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
