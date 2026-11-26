import { useEffect, useState, type ChangeEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  LayoutTemplate,
  Megaphone,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadHomepageAsset,
  useAdminHomepage,
  useHomepageMutations,
} from '@/features/admin/api/useAdminHomepage';
import { useAdminCategories } from '@/features/admin/api/useAdminProducts';
import type {
  HomepageCategoryCard,
  HomepageHero,
  HomepageMarqueeItem,
  HomepagePromoBanner,
} from '@/shared/types/domain';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { cn } from '@/shared/components/ui/cn';

type TabKey = 'hero' | 'marquee' | 'banner' | 'categories';

const BLANK_HERO: Omit<HomepageHero, 'id' | 'updated_at'> = {
  badge_ar: 'مجموعة شتاء 2026 — مصر',
  badge_en: 'WINTER 2026 COLLECTION — EGYPT',
  title_ar: '',
  title_en: '',
  subtitle_ar: '',
  subtitle_en: '',
  primary_cta_ar: 'تسوق المجموعة الآن',
  primary_cta_en: 'Shop Collection',
  primary_cta_link: '/shop',
  secondary_cta_ar: 'تتبع طلبك',
  secondary_cta_en: 'Track Order',
  secondary_cta_link: '/track',
  hero_image_url: '',
  floating_tag_title_ar: 'عروض الكميات التلقائية',
  floating_tag_title_en: 'Automatic Bundle Offers',
  floating_tag_badge_ar: 'وفر حتى 15%',
  floating_tag_badge_en: 'SAVE 15%',
  stat_1_value: '480gsm',
  stat_1_label_ar: 'قطن مصري ثقيل',
  stat_1_label_en: 'Heavyweight Cotton',
  stat_2_value: '27',
  stat_2_label_ar: 'محافظة في مصر',
  stat_2_label_en: 'Governorates',
  stat_3_value: 'COD',
  stat_3_label_ar: 'كاش عند الاستلام',
  stat_3_label_en: 'Cash on Delivery',
  display_order: 0,
  is_active: true,
};

export function HomepageCmsPage() {
  useDocumentTitle('إدارة الصفحة الرئيسية');
  const [tab, setTab] = useState<TabKey>('hero');

  const cmsQuery = useAdminHomepage();
  const categoriesQuery = useAdminCategories();
  const mutations = useHomepageMutations();

  // Hero Editor state
  const [selectedHeroId, setSelectedHeroId] = useState<string | 'new' | null>(null);
  const [heroDraft, setHeroDraft] = useState<Partial<HomepageHero>>(BLANK_HERO);
  const [uploadingHeroImg, setUploadingHeroImg] = useState(false);

  // Marquee state
  const [newMarqueeAr, setNewMarqueeAr] = useState('');
  const [newMarqueeEn, setNewMarqueeEn] = useState('');
  const [editingMarquee, setEditingMarquee] = useState<Record<string, { text_ar: string; text_en: string }>>({});

  // Banner state
  const [bannerDraft, setBannerDraft] = useState<Partial<HomepagePromoBanner>>({});
  const [pillsArInput, setPillsArInput] = useState('');
  const [pillsEnInput, setPillsEnInput] = useState('');
  const [uploadingBannerImg, setUploadingBannerImg] = useState(false);

  // Category Cards state
  const [newCard, setNewCard] = useState({
    category_slug: '',
    title_ar: '',
    title_en: '',
    subtitle_ar: '',
    subtitle_en: '',
    cover_image_url: '',
  });
  const [uploadingNewCatImg, setUploadingNewCatImg] = useState(false);
  const [uploadingCatId, setUploadingCatId] = useState<string | null>(null);
  const [editingCats, setEditingCats] = useState<Record<string, Partial<HomepageCategoryCard>>>({});

  const data = cmsQuery.data;

  // Sync hero selection when data loads
  useEffect(() => {
    if (!data) return;
    if (selectedHeroId === 'new') return;
    const target =
      data.heroes.find((h) => h.id === selectedHeroId) ?? data.heroes[0] ?? null;
    if (target) {
      setSelectedHeroId(target.id);
      setHeroDraft(target);
    }
  }, [data, selectedHeroId]);

  // Sync banner draft
  useEffect(() => {
    if (!data?.promoBanner) return;
    setBannerDraft(data.promoBanner);
    setPillsArInput((data.promoBanner.pill_tags_ar ?? []).join(' | '));
    setPillsEnInput((data.promoBanner.pill_tags_en ?? []).join(' | '));
  }, [data?.promoBanner]);

  // Sync category edits map
  useEffect(() => {
    if (!data?.categoryCards) return;
    const map: Record<string, Partial<HomepageCategoryCard>> = {};
    for (const c of data.categoryCards) {
      map[c.id] = { ...c };
    }
    setEditingCats(map);
  }, [data?.categoryCards]);

  // Sync marquee edits map
  useEffect(() => {
    if (!data?.marqueeItems) return;
    const map: Record<string, { text_ar: string; text_en: string }> = {};
    for (const m of data.marqueeItems) {
      map[m.id] = { text_ar: m.text_ar, text_en: m.text_en };
    }
    setEditingMarquee(map);
  }, [data?.marqueeItems]);

  const handleHeroImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeroImg(true);
    try {
      const url = await uploadHomepageAsset(file, 'hero');
      setHeroDraft((prev) => ({ ...prev, hero_image_url: url }));
      toast.success('تم رفع صورة الهيرو بنجاح');
    } catch (err) {
      toast.error((err as Error).message || 'فشل رفع الصورة');
    } finally {
      setUploadingHeroImg(false);
      e.target.value = '';
    }
  };

  const handleSaveHero = async () => {
    if (!heroDraft.title_ar?.trim() || !heroDraft.hero_image_url?.trim()) {
      toast.error('يرجى إدخال العنوان العربي وصورة الهيرو');
      return;
    }
    try {
      await mutations.upsertHero.mutateAsync({
        ...(selectedHeroId && selectedHeroId !== 'new' ? { id: selectedHeroId } : {}),
        badge_ar: heroDraft.badge_ar ?? '',
        badge_en: heroDraft.badge_en ?? '',
        title_ar: heroDraft.title_ar ?? '',
        title_en: heroDraft.title_en ?? '',
        subtitle_ar: heroDraft.subtitle_ar ?? '',
        subtitle_en: heroDraft.subtitle_en ?? '',
        primary_cta_ar: heroDraft.primary_cta_ar ?? '',
        primary_cta_en: heroDraft.primary_cta_en ?? '',
        primary_cta_link: heroDraft.primary_cta_link ?? '/shop',
        secondary_cta_ar: heroDraft.secondary_cta_ar ?? '',
        secondary_cta_en: heroDraft.secondary_cta_en ?? '',
        secondary_cta_link: heroDraft.secondary_cta_link ?? '/track',
        hero_image_url: heroDraft.hero_image_url ?? '',
        floating_tag_title_ar: heroDraft.floating_tag_title_ar ?? '',
        floating_tag_title_en: heroDraft.floating_tag_title_en ?? '',
        floating_tag_badge_ar: heroDraft.floating_tag_badge_ar ?? '',
        floating_tag_badge_en: heroDraft.floating_tag_badge_en ?? '',
        stat_1_value: heroDraft.stat_1_value ?? '',
        stat_1_label_ar: heroDraft.stat_1_label_ar ?? '',
        stat_1_label_en: heroDraft.stat_1_label_en ?? '',
        stat_2_value: heroDraft.stat_2_value ?? '',
        stat_2_label_ar: heroDraft.stat_2_label_ar ?? '',
        stat_2_label_en: heroDraft.stat_2_label_en ?? '',
        stat_3_value: heroDraft.stat_3_value ?? '',
        stat_3_label_ar: heroDraft.stat_3_label_ar ?? '',
        stat_3_label_en: heroDraft.stat_3_label_en ?? '',
        display_order: heroDraft.display_order ?? (data?.heroes.length ?? 0),
        is_active: heroDraft.is_active ?? true,
      });
      if (selectedHeroId === 'new') setSelectedHeroId(null);
      toast.success('تم حفظ قسم الهيرو وتحديث الموقع فوراً');
    } catch (err) {
      toast.error((err as Error).message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleBannerImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBannerImg(true);
    try {
      const url = await uploadHomepageAsset(file, 'banner');
      setBannerDraft((prev) => ({ ...prev, background_image_url: url }));
      toast.success('تم رفع صورة البانر');
    } catch (err) {
      toast.error((err as Error).message || 'فشل رفع الصورة');
    } finally {
      setUploadingBannerImg(false);
      e.target.value = '';
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerDraft.title_ar?.trim() || !bannerDraft.background_image_url?.trim()) {
      toast.error('يرجى إدخال عنوان البانر وصورة الخلفية');
      return;
    }
    try {
      const splitPills = (raw: string) =>
        raw
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);

      await mutations.upsertBanner.mutateAsync({
        ...(bannerDraft.id ? { id: bannerDraft.id } : {}),
        badge_ar: bannerDraft.badge_ar ?? '',
        badge_en: bannerDraft.badge_en ?? '',
        title_ar: bannerDraft.title_ar ?? '',
        title_en: bannerDraft.title_en ?? '',
        subtitle_ar: bannerDraft.subtitle_ar ?? '',
        subtitle_en: bannerDraft.subtitle_en ?? '',
        cta_ar: bannerDraft.cta_ar ?? '',
        cta_en: bannerDraft.cta_en ?? '',
        cta_link: bannerDraft.cta_link ?? '/shop',
        background_image_url: bannerDraft.background_image_url ?? '',
        overlay_opacity: Number(bannerDraft.overlay_opacity ?? 0.75),
        pill_tags_ar: splitPills(pillsArInput),
        pill_tags_en: splitPills(pillsEnInput),
        is_active: bannerDraft.is_active ?? true,
      });
      toast.success('تم حفظ البانر الترويجي بنجاح');
    } catch (err) {
      toast.error((err as Error).message || 'فشل الحفظ');
    }
  };

  const handleAddMarquee = async () => {
    if (!newMarqueeAr.trim() || !newMarqueeEn.trim()) {
      toast.error('أدخل النص العربي والإنجليزي لشريط الإعلانات');
      return;
    }
    try {
      await mutations.upsertMarquee.mutateAsync({
        text_ar: newMarqueeAr.trim(),
        text_en: newMarqueeEn.trim(),
        display_order: (data?.marqueeItems.length ?? 0) + 1,
        is_active: true,
      });
      setNewMarqueeAr('');
      setNewMarqueeEn('');
      toast.success('تمت إضافة عنصر للشريط المتحرك');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSwapMarqueeOrder = async (items: HomepageMarqueeItem[], idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[idx]!;
    const b = items[swapIdx]!;
    await Promise.all([
      mutations.upsertMarquee.mutateAsync({ id: a.id, text_ar: a.text_ar, text_en: a.text_en, display_order: b.display_order }),
      mutations.upsertMarquee.mutateAsync({ id: b.id, text_ar: b.text_ar, text_en: b.text_en, display_order: a.display_order }),
    ]);
  };

  const handleNewCatImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNewCatImg(true);
    try {
      const url = await uploadHomepageAsset(file, 'categories');
      setNewCard((prev) => ({ ...prev, cover_image_url: url }));
      toast.success('تم رفع صورة القسم');
    } catch (err) {
      toast.error((err as Error).message || 'فشل رفع الصورة');
    } finally {
      setUploadingNewCatImg(false);
      e.target.value = '';
    }
  };

  const handleExistingCatImageUpload = async (cardId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCatId(cardId);
    try {
      const url = await uploadHomepageAsset(file, 'categories');
      setEditingCats((prev) => ({
        ...prev,
        [cardId]: { ...(prev[cardId] ?? {}), cover_image_url: url },
      }));
      toast.success('تم رفع صورة القسم الجديدة — اضغط حفظ لتأكيد التعديل');
    } catch (err) {
      toast.error((err as Error).message || 'فشل رفع الصورة');
    } finally {
      setUploadingCatId(null);
      e.target.value = '';
    }
  };

  const handleAddCategoryCard = async () => {
    if (!newCard.category_slug.trim() || !newCard.title_ar.trim() || !newCard.cover_image_url.trim()) {
      toast.error('يرجى تحديد القسم والعنوان العربي وصورة الغلاف');
      return;
    }
    try {
      await mutations.upsertCategoryCard.mutateAsync({
        category_slug: newCard.category_slug.trim(),
        title_ar: newCard.title_ar.trim(),
        title_en: newCard.title_en.trim() || newCard.title_ar.trim(),
        subtitle_ar: newCard.subtitle_ar.trim(),
        subtitle_en: newCard.subtitle_en.trim(),
        cover_image_url: newCard.cover_image_url.trim(),
        display_order: (data?.categoryCards.length ?? 0) + 1,
        is_active: true,
      });
      setNewCard({
        category_slug: '',
        title_ar: '',
        title_en: '',
        subtitle_ar: '',
        subtitle_en: '',
        cover_image_url: '',
      });
      toast.success('تمت إضافة كارت القسم إلى شبكة Bento');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSwapCatOrder = async (cards: HomepageCategoryCard[], idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= cards.length) return;
    const a = cards[idx]!;
    const b = cards[swapIdx]!;
    await Promise.all([
      mutations.upsertCategoryCard.mutateAsync({
        id: a.id,
        category_slug: a.category_slug,
        title_ar: a.title_ar,
        cover_image_url: a.cover_image_url,
        display_order: b.display_order,
      }),
      mutations.upsertCategoryCard.mutateAsync({
        id: b.id,
        category_slug: b.category_slug,
        title_ar: b.title_ar,
        cover_image_url: b.cover_image_url,
        display_order: a.display_order,
      }),
    ]);
  };

  if (cmsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#132238]">إدارة الصفحة الرئيسية (CMS)</h1>
          <p className="mt-0.5 text-sm text-[#132238]/70">
            تحكم كامل في الهيرو، الشريط المتحرك، البانر الترويجي، وشبكة صور الأقسام بدون كود.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#132238]/20 bg-[#FFFFFF] px-4 text-xs font-extrabold text-[#132238] hover:border-[#FF6B1A] hover:text-[#FF6B1A]"
        >
          <LayoutTemplate className="h-4 w-4 text-[#FF6B1A]" />
          <span>معاينة الرئيسية</span>
        </a>
      </div>

      {/* Responsive Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-2 shadow-2xs">
        {[
          { id: 'hero' as const, label: 'القسم الرئيسي (Hero)', icon: Sparkles },
          { id: 'marquee' as const, label: 'الشريط المتحرك (Marquee)', icon: Megaphone },
          { id: 'banner' as const, label: 'البانر الترويجي', icon: LayoutTemplate },
          { id: 'categories' as const, label: 'صور الأقسام (Bento)', icon: ImagePlus },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-4 text-xs font-extrabold transition-all sm:text-sm',
                active
                  ? 'bg-[#132238] text-[#F4F2EC] shadow-xs'
                  : 'text-[#132238]/75 hover:bg-[#ECE9E0]',
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-[#FF6B1A]' : 'text-[#132238]/60')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO EDITOR */}
      {tab === 'hero' && (
        <div className="space-y-5 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#132238]/10 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {(data?.heroes ?? []).map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setSelectedHeroId(h.id);
                    setHeroDraft(h);
                  }}
                  className={cn(
                    'cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                    selectedHeroId === h.id
                      ? 'border-[#FF6B1A] bg-[#FF6B1A] text-white'
                      : 'border-[#132238]/20 bg-[#F4F2EC] text-[#132238]',
                  )}
                >
                  شريحة {i + 1} {!h.is_active && '(مخفية)'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedHeroId('new');
                  setHeroDraft({ ...BLANK_HERO, display_order: data?.heroes.length ?? 0 });
                }}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1 rounded-xl border border-dashed px-3 py-1.5 text-xs font-extrabold',
                  selectedHeroId === 'new'
                    ? 'border-[#FF6B1A] bg-[#FF6B1A]/10 text-[#FF6B1A]'
                    : 'border-[#132238]/30 text-[#132238]/80 hover:border-[#FF6B1A]',
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>شريحة جديدة</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedHeroId && selectedHeroId !== 'new' && (data?.heroes.length ?? 0) > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    await mutations.deleteHero.mutateAsync(selectedHeroId);
                    setSelectedHeroId(null);
                    toast.success('تم حذف الشريحة');
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                loading={mutations.upsertHero.isPending}
                onClick={handleSaveHero}
              >
                <Save className="h-4 w-4" />
                <span>حفظ الهيرو</span>
              </Button>
            </div>
          </div>

          {/* Image Upload & Preview */}
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-4">
              <label className="block text-sm font-bold text-[#132238]">صورة الهيرو / القطعة</label>
              <div className="flex aspect-4/5 items-center justify-center overflow-hidden rounded-2xl border border-[#132238]/15 bg-[#ECE9E0] p-3">
                {heroDraft.hero_image_url ? (
                  <img
                    src={heroDraft.hero_image_url}
                    alt="Hero preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#132238]/50">لا توجد صورة</span>
                )}
              </div>
              <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#132238] px-4 text-xs font-extrabold text-[#F4F2EC] hover:bg-[#0C1626]">
                <ImagePlus className="h-4 w-4 text-[#FF6B1A]" />
                <span>{uploadingHeroImg ? 'جاري الرفع...' : 'رفع / تغيير الصورة'}</span>
                <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
              </label>
              <Input
                label="أو رابط مباشر للصورة"
                dir="ltr"
                value={heroDraft.hero_image_url ?? ''}
                onChange={(e) => setHeroDraft((p) => ({ ...p, hero_image_url: e.target.value }))}
              />
              <label className="flex items-center gap-2 pt-1 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={heroDraft.is_active ?? true}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, is_active: e.target.checked }))}
                  className="h-4 w-4 accent-[#FF6B1A]"
                />
                مفعلة في المتجر
              </label>
            </div>

            <div className="space-y-4 lg:col-span-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="الشارة (عربي)"
                  value={heroDraft.badge_ar ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, badge_ar: e.target.value }))}
                />
                <Input
                  label="Badge (English)"
                  dir="ltr"
                  value={heroDraft.badge_en ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, badge_en: e.target.value }))}
                />
                <Input
                  label="العنوان الرئيسي (عربي)"
                  value={heroDraft.title_ar ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, title_ar: e.target.value }))}
                />
                <Input
                  label="Headline (English)"
                  dir="ltr"
                  value={heroDraft.title_en ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, title_en: e.target.value }))}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">الوصف (عربي)</label>
                  <textarea
                    rows={3}
                    value={heroDraft.subtitle_ar ?? ''}
                    onChange={(e) => setHeroDraft((p) => ({ ...p, subtitle_ar: e.target.value }))}
                    className="rounded-xl border border-[#132238]/20 bg-[#FFFFFF] p-3 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Subtitle (English)</label>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={heroDraft.subtitle_en ?? ''}
                    onChange={(e) => setHeroDraft((p) => ({ ...p, subtitle_en: e.target.value }))}
                    className="rounded-xl border border-[#132238]/20 bg-[#FFFFFF] p-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="زر أساسي (عربي)"
                  value={heroDraft.primary_cta_ar ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, primary_cta_ar: e.target.value }))}
                />
                <Input
                  label="Primary CTA (EN)"
                  dir="ltr"
                  value={heroDraft.primary_cta_en ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, primary_cta_en: e.target.value }))}
                />
                <Input
                  label="رابط الزر الأساسي"
                  dir="ltr"
                  value={heroDraft.primary_cta_link ?? '/shop'}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, primary_cta_link: e.target.value }))}
                />
                <Input
                  label="زر ثانوي (عربي)"
                  value={heroDraft.secondary_cta_ar ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, secondary_cta_ar: e.target.value }))}
                />
                <Input
                  label="Secondary CTA (EN)"
                  dir="ltr"
                  value={heroDraft.secondary_cta_en ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, secondary_cta_en: e.target.value }))}
                />
                <Input
                  label="رابط الزر الثانوي"
                  dir="ltr"
                  value={heroDraft.secondary_cta_link ?? '/track'}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, secondary_cta_link: e.target.value }))}
                />
              </div>

              {/* Floating Garment Tag */}
              <div className="rounded-xl border border-[#132238]/12 bg-[#F4F2EC] p-3.5">
                <p className="mb-2.5 text-xs font-extrabold text-[#132238]">البطاقة العائمة على الصورة</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="العنوان (عربي)"
                    value={heroDraft.floating_tag_title_ar ?? ''}
                    onChange={(e) =>
                      setHeroDraft((p) => ({ ...p, floating_tag_title_ar: e.target.value }))
                    }
                  />
                  <Input
                    label="Title (EN)"
                    dir="ltr"
                    value={heroDraft.floating_tag_title_en ?? ''}
                    onChange={(e) =>
                      setHeroDraft((p) => ({ ...p, floating_tag_title_en: e.target.value }))
                    }
                  />
                  <Input
                    label="شارة العرض (عربي)"
                    value={heroDraft.floating_tag_badge_ar ?? ''}
                    onChange={(e) =>
                      setHeroDraft((p) => ({ ...p, floating_tag_badge_ar: e.target.value }))
                    }
                  />
                  <Input
                    label="Offer Badge (EN)"
                    dir="ltr"
                    value={heroDraft.floating_tag_badge_en ?? ''}
                    onChange={(e) =>
                      setHeroDraft((p) => ({ ...p, floating_tag_badge_en: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* 3 Trust Stats */}
              <div className="rounded-xl border border-[#132238]/12 bg-[#F4F2EC] p-3.5">
                <p className="mb-2.5 text-xs font-extrabold text-[#132238]">شريط الإحصائيات والثقة (3 عناصر)</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2 rounded-lg bg-[#FFFFFF] p-2.5">
                    <Input
                      label="قيمة 1"
                      dir="ltr"
                      value={heroDraft.stat_1_value ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_1_value: e.target.value }))}
                    />
                    <Input
                      label="وصف 1 (عربي)"
                      value={heroDraft.stat_1_label_ar ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_1_label_ar: e.target.value }))}
                    />
                    <Input
                      label="Label 1 (EN)"
                      dir="ltr"
                      value={heroDraft.stat_1_label_en ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_1_label_en: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 rounded-lg bg-[#FFFFFF] p-2.5">
                    <Input
                      label="قيمة 2"
                      dir="ltr"
                      value={heroDraft.stat_2_value ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_2_value: e.target.value }))}
                    />
                    <Input
                      label="وصف 2 (عربي)"
                      value={heroDraft.stat_2_label_ar ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_2_label_ar: e.target.value }))}
                    />
                    <Input
                      label="Label 2 (EN)"
                      dir="ltr"
                      value={heroDraft.stat_2_label_en ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_2_label_en: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 rounded-lg bg-[#FFFFFF] p-2.5">
                    <Input
                      label="قيمة 3"
                      dir="ltr"
                      value={heroDraft.stat_3_value ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_3_value: e.target.value }))}
                    />
                    <Input
                      label="وصف 3 (عربي)"
                      value={heroDraft.stat_3_label_ar ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_3_label_ar: e.target.value }))}
                    />
                    <Input
                      label="Label 3 (EN)"
                      dir="ltr"
                      value={heroDraft.stat_3_label_en ?? ''}
                      onChange={(e) => setHeroDraft((p) => ({ ...p, stat_3_label_en: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARQUEE TICKER CRUD */}
      {tab === 'marquee' && (
        <div className="space-y-5 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs">
          <h2 className="text-base font-extrabold text-[#132238]">الشريط الإعلاني المتحرك (Infinite Marquee)</h2>

          <div className="grid gap-3 rounded-xl border border-[#132238]/12 bg-[#F4F2EC] p-4 sm:grid-cols-12 sm:items-end">
            <div className="sm:col-span-5">
              <Input
                label="النص بالعربي"
                value={newMarqueeAr}
                onChange={(e) => setNewMarqueeAr(e.target.value)}
                placeholder="مثال: شحن مجاني للطلبات فوق 1500 ج.م"
              />
            </div>
            <div className="sm:col-span-5">
              <Input
                label="English Text"
                dir="ltr"
                value={newMarqueeEn}
                onChange={(e) => setNewMarqueeEn(e.target.value)}
                placeholder="e.g. Free Shipping on Orders Over 1500 EGP"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="primary"
                className="w-full"
                loading={mutations.upsertMarquee.isPending}
                onClick={handleAddMarquee}
              >
                <Plus className="h-4 w-4" />
                <span>إضافة</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {(data?.marqueeItems ?? []).map((item, idx, arr) => {
              const draft = editingMarquee[item.id] ?? { text_ar: item.text_ar, text_en: item.text_en };
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#132238]/12 bg-[#FFFFFF] p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
                    <Input
                      value={draft.text_ar}
                      onChange={(e) =>
                        setEditingMarquee((p) => ({
                          ...p,
                          [item.id]: { ...draft, text_ar: e.target.value },
                        }))
                      }
                    />
                    <Input
                      dir="ltr"
                      value={draft.text_en}
                      onChange={(e) =>
                        setEditingMarquee((p) => ({
                          ...p,
                          [item.id]: { ...draft, text_en: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleSwapMarqueeOrder(arr, idx, -1)}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#132238]/15 hover:bg-[#ECE9E0] disabled:opacity-35"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      onClick={() => handleSwapMarqueeOrder(arr, idx, 1)}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#132238]/15 hover:bg-[#ECE9E0] disabled:opacity-35"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await mutations.upsertMarquee.mutateAsync({
                          id: item.id,
                          text_ar: draft.text_ar,
                          text_en: draft.text_en,
                          is_active: !item.is_active,
                        });
                      }}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#132238]/15 hover:bg-[#ECE9E0]"
                      title={item.is_active ? 'إخفاء' : 'إظهار'}
                    >
                      {item.is_active ? <Eye className="h-4 w-4 text-[#132238]" /> : <EyeOff className="h-4 w-4 text-[#132238]/40" />}
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await mutations.upsertMarquee.mutateAsync({
                          id: item.id,
                          text_ar: draft.text_ar,
                          text_en: draft.text_en,
                        });
                        toast.success('تم التحديث');
                      }}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        await mutations.deleteMarquee.mutateAsync(item.id);
                        toast.success('تم الحذف');
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PROMO BANNER EDITOR */}
      {tab === 'banner' && (
        <div className="space-y-5 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#132238]/10 pb-4">
            <h2 className="text-base font-extrabold text-[#132238]">البانر الترويجي (Campaign Banner)</h2>
            <Button
              type="button"
              variant="primary"
              loading={mutations.upsertBanner.isPending}
              onClick={handleSaveBanner}
            >
              <Save className="h-4 w-4" />
              <span>حفظ البانر</span>
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-5">
              <div className="relative h-48 overflow-hidden rounded-2xl border border-[#132238]/15 bg-[#132238]">
                {bannerDraft.background_image_url && (
                  <img
                    src={bannerDraft.background_image_url}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                    style={{ opacity: 1 - Number(bannerDraft.overlay_opacity ?? 0.75) * 0.6 }}
                  />
                )}
                <div
                  className="absolute inset-0 bg-[#132238]"
                  style={{ opacity: Number(bannerDraft.overlay_opacity ?? 0.75) }}
                />
                <div className="relative z-10 flex h-full flex-col justify-center p-4 text-white">
                  <span className="w-fit rounded-full bg-[#FF6B1A] px-2.5 py-0.5 text-[10px] font-extrabold">
                    {bannerDraft.badge_ar}
                  </span>
                  <p className="mt-2 line-clamp-2 text-base font-black">{bannerDraft.title_ar}</p>
                </div>
              </div>

              <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#132238] px-4 text-xs font-extrabold text-[#F4F2EC] hover:bg-[#0C1626]">
                <ImagePlus className="h-4 w-4 text-[#FF6B1A]" />
                <span>{uploadingBannerImg ? 'جاري الرفع...' : 'رفع صورة خلفية البانر'}</span>
                <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" />
              </label>

              <div>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>شفافية التعتيم (Overlay Opacity)</span>
                  <span className="font-display">{Math.round(Number(bannerDraft.overlay_opacity ?? 0.75) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={Number(bannerDraft.overlay_opacity ?? 0.75)}
                  onChange={(e) =>
                    setBannerDraft((p) => ({ ...p, overlay_opacity: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#FF6B1A]"
                />
              </div>

              <Input
                label="رابط صورة الخلفية"
                dir="ltr"
                value={bannerDraft.background_image_url ?? ''}
                onChange={(e) =>
                  setBannerDraft((p) => ({ ...p, background_image_url: e.target.value }))
                }
              />
            </div>

            <div className="space-y-4 lg:col-span-7">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="الشارة (عربي)"
                  value={bannerDraft.badge_ar ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, badge_ar: e.target.value }))}
                />
                <Input
                  label="Badge (EN)"
                  dir="ltr"
                  value={bannerDraft.badge_en ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, badge_en: e.target.value }))}
                />
                <Input
                  label="العنوان (عربي)"
                  value={bannerDraft.title_ar ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, title_ar: e.target.value }))}
                />
                <Input
                  label="Title (EN)"
                  dir="ltr"
                  value={bannerDraft.title_en ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, title_en: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="الوصف (عربي)"
                  value={bannerDraft.subtitle_ar ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, subtitle_ar: e.target.value }))}
                />
                <Input
                  label="Subtitle (EN)"
                  dir="ltr"
                  value={bannerDraft.subtitle_en ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, subtitle_en: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="زر الإجراء (عربي)"
                  value={bannerDraft.cta_ar ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, cta_ar: e.target.value }))}
                />
                <Input
                  label="CTA (EN)"
                  dir="ltr"
                  value={bannerDraft.cta_en ?? ''}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, cta_en: e.target.value }))}
                />
                <Input
                  label="الرابط"
                  dir="ltr"
                  value={bannerDraft.cta_link ?? '/shop'}
                  onChange={(e) => setBannerDraft((p) => ({ ...p, cta_link: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="الشارات الترويجية (عربي — افصل بـ |)"
                  value={pillsArInput}
                  onChange={(e) => setPillsArInput(e.target.value)}
                />
                <Input
                  label="Promo Pills (EN — separate with |)"
                  dir="ltr"
                  value={pillsEnInput}
                  onChange={(e) => setPillsEnInput(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VISUAL CATEGORY CARDS (BENTO GRID) */}
      {tab === 'categories' && (
        <div className="space-y-6 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs">
          <h2 className="text-base font-extrabold text-[#132238]">شبكة عرض الأقسام بالصور (Visual Bento Grid)</h2>

          {/* Add New Card */}
          <div className="space-y-3 rounded-2xl border border-[#132238]/15 bg-[#F4F2EC] p-4">
            <p className="text-xs font-extrabold text-[#132238]">إضافة كارت قسم جديد</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold">ربط بقسم (Slug)</label>
                <select
                  value={newCard.category_slug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    const cat = (categoriesQuery.data ?? []).find((c) => c.slug === slug);
                    setNewCard((p) => ({
                      ...p,
                      category_slug: slug,
                      title_ar: p.title_ar || cat?.name_ar || '',
                      title_en: p.title_en || cat?.name_en || '',
                    }));
                  }}
                  className="min-h-11 rounded-xl border border-[#132238]/20 bg-[#FFFFFF] px-3 text-sm"
                >
                  <option value="">اختر القسم...</option>
                  {(categoriesQuery.data ?? []).map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name_ar} ({cat.slug})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="العنوان (عربي)"
                value={newCard.title_ar}
                onChange={(e) => setNewCard((p) => ({ ...p, title_ar: e.target.value }))}
              />
              <Input
                label="Title (EN)"
                dir="ltr"
                value={newCard.title_en}
                onChange={(e) => setNewCard((p) => ({ ...p, title_en: e.target.value }))}
              />
              <Input
                label="وصف مختصر (عربي)"
                value={newCard.subtitle_ar}
                onChange={(e) => setNewCard((p) => ({ ...p, subtitle_ar: e.target.value }))}
              />
              <Input
                label="Subtitle (EN)"
                dir="ltr"
                value={newCard.subtitle_en}
                onChange={(e) => setNewCard((p) => ({ ...p, subtitle_en: e.target.value }))}
              />
              <div className="flex items-end gap-2">
                <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#132238] px-3 text-xs font-extrabold text-[#F4F2EC]">
                  <ImagePlus className="h-4 w-4 text-[#FF6B1A]" />
                  <span>{uploadingNewCatImg ? 'جاري الرفع...' : newCard.cover_image_url ? 'تم رفع الغلاف' : 'رفع صورة الغلاف'}</span>
                  <input type="file" accept="image/*" onChange={handleNewCatImageUpload} className="hidden" />
                </label>
                <Button
                  type="button"
                  variant="primary"
                  loading={mutations.upsertCategoryCard.isPending}
                  onClick={handleAddCategoryCard}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {(data?.categoryCards ?? []).map((card, idx, arr) => {
              const draft = editingCats[card.id] ?? card;
              return (
                <div
                  key={card.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-2xl border p-4 transition-opacity',
                    card.is_active ? 'border-[#132238]/15 bg-[#FFFFFF]' : 'border-[#132238]/10 bg-[#ECE9E0]/60 opacity-75',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#ECE9E0]">
                      <img
                        src={draft.cover_image_url ?? card.cover_image_url}
                        alt={draft.title_ar ?? card.title_ar}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-[#ECE9E0] px-2 py-0.5 font-display text-[11px] font-bold text-[#132238]">
                          /{card.category_slug}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleSwapCatOrder(arr, idx, -1)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#132238]/15 hover:bg-[#ECE9E0] disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleSwapCatOrder(arr, idx, 1)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#132238]/15 hover:bg-[#ECE9E0] disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              mutations.upsertCategoryCard.mutateAsync({
                                id: card.id,
                                category_slug: card.category_slug,
                                title_ar: card.title_ar,
                                cover_image_url: card.cover_image_url,
                                is_active: !card.is_active,
                              })
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#132238]/15 hover:bg-[#ECE9E0]"
                          >
                            {card.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-[#132238]/40" />}
                          </button>
                        </div>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-extrabold text-[#FF6B1A] hover:underline">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>{uploadingCatId === card.id ? 'جاري الرفع...' : 'تغيير صورة القسم'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleExistingCatImageUpload(card.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      label="العنوان (عربي)"
                      value={draft.title_ar ?? ''}
                      onChange={(e) =>
                        setEditingCats((p) => ({ ...p, [card.id]: { ...draft, title_ar: e.target.value } }))
                      }
                    />
                    <Input
                      label="Title (EN)"
                      dir="ltr"
                      value={draft.title_en ?? ''}
                      onChange={(e) =>
                        setEditingCats((p) => ({ ...p, [card.id]: { ...draft, title_en: e.target.value } }))
                      }
                    />
                    <Input
                      label="وصف فرعي (عربي)"
                      value={draft.subtitle_ar ?? ''}
                      onChange={(e) =>
                        setEditingCats((p) => ({ ...p, [card.id]: { ...draft, subtitle_ar: e.target.value } }))
                      }
                    />
                    <Input
                      label="Subtitle (EN)"
                      dir="ltr"
                      value={draft.subtitle_en ?? ''}
                      onChange={(e) =>
                        setEditingCats((p) => ({ ...p, [card.id]: { ...draft, subtitle_en: e.target.value } }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        await mutations.deleteCategoryCard.mutateAsync(card.id);
                        toast.success('تم الحذف');
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        await mutations.upsertCategoryCard.mutateAsync({
                          id: card.id,
                          category_slug: draft.category_slug ?? card.category_slug,
                          title_ar: draft.title_ar ?? card.title_ar,
                          title_en: draft.title_en ?? card.title_en,
                          subtitle_ar: draft.subtitle_ar ?? '',
                          subtitle_en: draft.subtitle_en ?? '',
                          cover_image_url: draft.cover_image_url ?? card.cover_image_url,
                        });
                        toast.success('تم حفظ كارت القسم');
                      }}
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>حفظ</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
