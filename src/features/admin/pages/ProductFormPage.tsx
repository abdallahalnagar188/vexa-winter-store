import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/format';
import { productSchema, type ProductFormValues } from '@/shared/validation/productSchema';
import { useAdminCategories } from '@/features/admin/api/useAdminProducts';
import { useSaveTiersForScope } from '@/features/admin/api/useAdminTiers';
import { ImageUploader, type EditableImage } from '@/features/admin/components/ImageUploader';
import { VariantMatrixEditor, type EditableVariant } from '@/features/admin/components/VariantMatrixEditor';
import { TierEditor, type EditableTier } from '@/features/admin/components/TierEditor';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  useDocumentTitle(isNew ? 'إضافة منتج' : 'تعديل المنتج');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [productId] = useState(() => (isNew ? crypto.randomUUID() : id));
  const [images, setImages] = useState<EditableImage[]>([]);
  const [variants, setVariants] = useState<EditableVariant[]>([]);
  const [tiers, setTiers] = useState<EditableTier[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const categoriesQuery = useAdminCategories();
  const saveTiers = useSaveTiersForScope();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title_ar: '',
      title_en: '',
      slug: '',
      category_id: null,
      description_ar: '',
      description_en: '',
      base_price: 1000,
      is_new: true,
      is_active: true,
    },
  });

  useEffect(() => {
    if (isNew) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), product_variants(*)')
        .eq('id', productId)
        .single();
      if (error || !data || !mounted) return;

      reset({
        title_ar: data.title_ar,
        title_en: data.title_en ?? '',
        slug: data.slug,
        category_id: data.category_id,
        description_ar: data.description_ar ?? '',
        description_en: data.description_en ?? '',
        base_price: data.base_price,
        is_new: data.is_new,
        is_active: data.is_active,
      });

      setImages(
        [...(data.product_images ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({
            id: img.id,
            url: img.url,
            storage_path: img.storage_path,
            sort_order: img.sort_order,
            is_primary: img.is_primary,
          })),
      );

      setVariants(
        (data.product_variants ?? []).map((v) => ({
          id: v.id,
          size: v.size,
          color_name: v.color_name,
          color_hex: v.color_hex ?? '#3E452B',
          sku: v.sku ?? '',
          stock: v.stock,
          is_active: v.is_active,
        })),
      );

      const { data: tierRows } = await supabase
        .from('discount_tiers')
        .select('*')
        .eq('product_id', productId)
        .order('min_qty', { ascending: true });
      if (mounted && tierRows) {
        setTiers(
          tierRows.map((t) => ({
            min_qty: t.min_qty,
            discount_type: t.discount_type,
            value: t.value,
            is_active: t.is_active,
          })),
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isNew, productId, reset]);

  const titleEnWatch = watch('title_en');
  const slugWatch = watch('slug');

  const handleAutoSlug = () => {
    if (!slugWatch && titleEnWatch) {
      setValue('slug', slugify(titleEnWatch), { shouldValidate: true });
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const slug = slugify(name) || `cat-${Date.now()}`;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name_ar: name, name_en: name, slug })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    await categoriesQuery.refetch();
    setValue('category_id', data.id);
    setNewCategoryName('');
    toast.success('تم إضافة القسم');
  };

  const uniqueMinQtys = useMemo(() => new Set(tiers.map((t) => t.min_qty)).size === tiers.length, [tiers]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!uniqueMinQtys) {
      toast.error('لا يمكن تكرار نفس الحد الأدنى للكمية في شرائح الخصم');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: productId,
        slug: values.slug,
        category_id: values.category_id || null,
        title_ar: values.title_ar,
        title_en: values.title_en || null,
        description_ar: values.description_ar || null,
        description_en: values.description_en || null,
        base_price: values.base_price,
        is_new: values.is_new,
        is_active: values.is_active,
      };

      const { error: prodErr } = await supabase.from('products').upsert(payload);
      if (prodErr) throw prodErr;

      await supabase.from('product_images').delete().eq('product_id', productId);
      if (images.length > 0) {
        const { error: imgErr } = await supabase.from('product_images').insert(
          images.map((img, i) => ({
            product_id: productId,
            url: img.url,
            storage_path: img.storage_path,
            sort_order: i,
            is_primary: img.is_primary,
          })),
        );
        if (imgErr) throw imgErr;
      }

      const keepIds = variants.map((v) => v.id).filter((x): x is string => Boolean(x));
      if (!isNew) {
        if (keepIds.length > 0) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', productId)
            .not('id', 'in', `(${keepIds.join(',')})`);
        } else {
          await supabase.from('product_variants').delete().eq('product_id', productId);
        }
      }

      if (variants.length > 0) {
        const { error: varErr } = await supabase.from('product_variants').upsert(
          variants.map((v) => ({
            ...(v.id ? { id: v.id } : {}),
            product_id: productId,
            size: v.size,
            color_name: v.color_name,
            color_hex: v.color_hex,
            sku: v.sku || null,
            stock: v.stock,
            is_active: v.is_active,
          })),
        );
        if (varErr) throw varErr;
      }

      await saveTiers.mutateAsync({ productId, rows: tiers });

      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product', values.slug] });

      toast.success('تم حفظ المنتج بنجاح');
      navigate('/admin/products');
    } catch (err) {
      toast.error((err as Error).message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#3E452B]">
          {isNew ? 'إضافة منتج جديد' : 'تعديل المنتج'}
        </h1>
        <Button type="submit" variant="primary" size="lg" loading={saving}>
          <Save className="h-4 w-4" />
          <span>حفظ التعديلات</span>
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 shadow-sm">
        <h2 className="text-base font-extrabold">البيانات الأساسية</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="الاسم بالعربي" {...register('title_ar')} error={errors.title_ar?.message} />
          <Input
            label="الاسم بالإنجليزي"
            dir="ltr"
            {...register('title_en')}
            onBlur={handleAutoSlug}
          />
          <Input
            label="Slug (رابط المنتج)"
            dir="ltr"
            {...register('slug')}
            error={errors.slug?.message}
          />
          <Input
            label="السعر الأساسي (ج.م صحيح)"
            type="number"
            {...register('base_price', { valueAsNumber: true })}
            error={errors.base_price?.message}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold">القسم</label>
            <select
              {...register('category_id')}
              className="min-h-11 rounded-xl border border-[#3E452B]/25 bg-[#F5F2E8] px-3 text-sm"
            >
              <option value="">بدون قسم</option>
              {(categoriesQuery.data ?? []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_ar}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Input
              label="إضافة قسم سريع"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="مثال: سكارف شتوي"
            />
            <Button type="button" variant="secondary" onClick={handleCreateCategory}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold">الوصف بالعربي</label>
            <textarea
              rows={3}
              {...register('description_ar')}
              className="rounded-xl border border-[#3E452B]/25 bg-[#F5F2E8] p-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold">الوصف بالإنجليزي</label>
            <textarea
              rows={3}
              dir="ltr"
              {...register('description_en')}
              className="rounded-xl border border-[#3E452B]/25 bg-[#F5F2E8] p-3 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 text-sm font-bold">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('is_new')} className="h-4 w-4 accent-[#3E452B]" />
            إظهار شارة NEW (جديد)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('is_active')} className="h-4 w-4 accent-[#3E452B]" />
            ظاهر في المتجر
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 shadow-sm">
        <h2 className="text-base font-extrabold">صور المنتج</h2>
        <ImageUploader productId={productId} images={images} onChange={setImages} />
      </div>

      <div className="space-y-4 rounded-2xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 shadow-sm">
        <h2 className="text-base font-extrabold">المقاسات والألوان والمخزون</h2>
        <VariantMatrixEditor variants={variants} onChange={setVariants} />
      </div>

      <div className="space-y-3 rounded-2xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 shadow-sm">
        <h2 className="text-base font-extrabold">خصومات خاصة بهذا المنتج (اختياري)</h2>
        <p className="text-xs text-[#3E452B]/75">
          إضافة شرائح هنا تلغي الخصم العام لهذا المنتج فقط وتطبق شرائحه الخاصة.
        </p>
        <TierEditor tiers={tiers} onChange={setTiers} />
      </div>
    </form>
  );
}
