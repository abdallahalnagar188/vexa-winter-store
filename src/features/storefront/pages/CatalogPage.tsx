import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { StaggerGrid } from '@/shared/components/motion/StaggerGrid';
import { CategoryChips } from '@/features/storefront/components/CategoryChips';
import { ProductCard } from '@/features/storefront/components/ProductCard';
import { useCatalogFacets, useProducts } from '@/features/storefront/api/useProducts';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useTiers } from '@/features/storefront/api/useTiers';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDir } from '@/shared/hooks/useDir';
import { useSeo } from '@/shared/hooks/useSeo';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/components/ui/cn';

export function CatalogPage() {
  const { t } = useTranslation();
  const { lang } = useDir();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') || 'all';
  const urlQ = searchParams.get('q') || '';
  const selectedSize = searchParams.get('size') || '';
  const selectedColor = searchParams.get('color') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';

  const [searchInput, setSearchInput] = useState(urlQ);
  const debouncedSearch = useDebounce(searchInput, 280);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [limit, setLimit] = useState(24);

  // Sync URL `q` -> local input if navigated externally
  useEffect(() => {
    setSearchInput(urlQ);
  }, [urlQ]);

  // Sync debounced input -> URL `q`
  useEffect(() => {
    const clean = debouncedSearch.trim();
    if (clean === urlQ) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (clean) next.set('q', clean);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, urlQ, setSearchParams]);

  const categoriesQuery = useCategories();
  const tiersQuery = useTiers();
  const facetsQuery = useCatalogFacets();

  const activeCategoryObj = (categoriesQuery.data ?? []).find((c) => c.slug === selectedCategory);
  const seoTitle = activeCategoryObj
    ? lang === 'ar'
      ? activeCategoryObj.name_ar
      : activeCategoryObj.name_en || activeCategoryObj.name_ar
    : t('catalog.title');
  const seoDescription =
    lang === 'ar'
      ? `${seoTitle} — تسوق منتجات أثر الشتوية بخامات قطنية ثقيلة 480gsm مع خصم كميات تلقائي وشحن لجميع المحافظات.`
      : `${seoTitle} — Shop heavyweight 480gsm أثر winter essentials with automatic bundle discounts and nationwide Cash on Delivery.`;
  useSeo({ title: seoTitle, description: seoDescription });
  const productsQuery = useProducts({
    categorySlug: selectedCategory,
    search: urlQ || undefined,
    size: selectedSize || undefined,
    color: selectedColor || undefined,
    inStockOnly,
    sort,
    limit,
  });

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasAnyFilter = Boolean(
    selectedCategory !== 'all' || urlQ || selectedSize || selectedColor || inStockOnly,
  );

  const sizes = facetsQuery.data?.sizes ?? [];
  const colors = facetsQuery.data?.colors ?? [];

  const filterBarContent = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {sizes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-[#132238]/75">
            {t('catalog.sizeFilter')}:
          </span>
          {sizes.map((sz) => {
            const active = selectedSize === sz;
            return (
              <button
                key={sz}
                type="button"
                onClick={() => updateParam('size', active ? null : sz)}
                className={cn(
                  'min-h-8 min-w-8 cursor-pointer rounded-[2px] border px-2 font-display text-xs font-bold transition-colors',
                  active
                    ? 'border-[#132238] bg-[#132238] text-[#F4F2EC]'
                    : 'border-[#132238]/20 bg-[#FFFFFF] text-[#132238] hover:border-[#132238]',
                )}
              >
                {sz}
              </button>
            );
          })}
        </div>
      )}

      {colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-[#132238]/75">
            {t('catalog.colorFilter')}:
          </span>
          {colors.map((col) => {
            const active = selectedColor === col.name;
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => updateParam('color', active ? null : col.name)}
                className={cn(
                  'inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-[2px] border px-2.5 text-xs font-bold transition-colors',
                  active
                    ? 'border-[#132238] bg-[#132238] text-[#F4F2EC]'
                    : 'border-[#132238]/20 bg-[#FFFFFF] text-[#132238] hover:border-[#132238]',
                )}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                  style={{ backgroundColor: col.hex || '#132238' }}
                />
                <span>{col.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] px-3 py-1.5 text-xs font-extrabold text-[#132238]">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
          className="h-3.5 w-3.5 accent-[#FF6B1A]"
        />
        <span>{t('catalog.inStockOnly')}</span>
      </label>

      {hasAnyFilter && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="inline-flex cursor-pointer items-center gap-1 rounded-[2px] border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-100"
        >
          <X className="h-3.5 w-3.5" />
          <span>{t('catalog.clearFilters')}</span>
        </button>
      )}
    </div>
  );

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#132238] sm:text-3xl">{t('catalog.title')}</h1>
          {productsQuery.data && (
            <p className="mt-0.5 text-xs font-bold text-[#132238]/65">
              {t('catalog.resultsCount', { count: productsQuery.data.length })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#132238]/50" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
              aria-label={t('catalog.searchPlaceholder')}
              className="min-h-11 w-full rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] pe-3 ps-9 text-sm font-semibold text-[#132238] placeholder:text-[#132238]/45 focus:border-[#FF6B1A] focus:outline-none"
            />
          </div>

          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
            className="min-h-11 rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] px-3.5 text-sm font-bold text-[#132238] focus:border-[#FF6B1A] focus:outline-none"
          >
            <option value="newest">{t('catalog.sortNewest')}</option>
            <option value="price_asc">{t('catalog.sortPriceAsc')}</option>
            <option value="price_desc">{t('catalog.sortPriceDesc')}</option>
          </select>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border px-3 text-xs font-extrabold md:hidden',
              mobileFiltersOpen || selectedSize || selectedColor || inStockOnly
                ? 'border-[#132238] bg-[#132238] text-[#F4F2EC]'
                : 'border-[#132238]/20 bg-[#FFFFFF] text-[#132238]',
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{t('catalog.filters')}</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <CategoryChips
          categories={categoriesQuery.data ?? []}
          selectedSlug={selectedCategory}
          onSelect={(slug) => updateParam('category', slug)}
        />
      </div>

      {/* Desktop Attribute Filter Strip */}
      <div className="mb-7 hidden rounded-sm border border-[#132238]/12 bg-[#ECE9E0]/60 p-3.5 md:block">
        {filterBarContent}
      </div>

      {/* Mobile Collapsible Attribute Filter Panel */}
      {mobileFiltersOpen && (
        <div className="mb-6 rounded-sm border border-[#132238]/15 bg-[#ECE9E0]/80 p-3.5 md:hidden">
          {filterBarContent}
        </div>
      )}

      {productsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-3/4 w-full rounded-[2px]" />
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
        <EmptyState
          title={t('catalog.noProducts')}
          action={
            hasAnyFilter ? (
              <Button variant="secondary" onClick={clearAllFilters}>
                {t('catalog.clearFilters')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <StaggerGrid className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
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
