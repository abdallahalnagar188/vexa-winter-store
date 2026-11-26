import { useState, type ChangeEvent } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Palette, Star, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/shared/components/ui/cn';

export interface EditableImage {
  id?: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
  color_name: string | null;
  color_hex: string | null;
}

export interface ColorOption {
  name: string;
  hex: string;
}

interface ImageUploaderProps {
  productId: string;
  images: EditableImage[];
  colors: ColorOption[];  // derived from variant matrix
  onChange: (next: EditableImage[]) => void;
}

async function convertToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('WebP conversion failed'));
      },
      'image/webp',
      0.82,
    );
  });
}

/** Group images by color_name (null → "كل الألوان") for display */
function groupByColor(images: EditableImage[]): Map<string, EditableImage[]> {
  const map = new Map<string, EditableImage[]>();
  for (const img of images) {
    const key = img.color_name ?? '__all__';
    const bucket = map.get(key) ?? [];
    bucket.push(img);
    map.set(key, bucket);
  }
  return map;
}

const ALLOWED_IMAGE_MIME = new Set(['image/webp', 'image/jpeg', 'image/png']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function ImageUploader({ productId, images, colors, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  // Which color is active in the uploader header dropdown (null = all)
  const [uploadColor, setUploadColor] = useState<ColorOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        toast.error('يُسمح فقط بصور WebP أو JPEG أو PNG');
        e.target.value = '';
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error('الحد الأقصى لحجم الصورة هو 5 ميجابايت');
        e.target.value = '';
        return;
      }
    }

    setUploading(true);
    try {
      const added: EditableImage[] = [];
      for (const file of files) {
        const blob = await convertToWebp(file);
        const path = `products/${productId}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from('products')
          .upload(path, blob, { contentType: 'image/webp', upsert: true });
        if (error) throw error;

        const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
        added.push({
          url: pub.publicUrl,
          storage_path: path,
          sort_order: images.length + added.length,
          is_primary: images.length === 0 && added.length === 0,
          color_name: uploadColor?.name ?? null,
          color_hex: uploadColor?.hex ?? null,
        });
      }
      onChange([...images, ...added]);
      toast.success('تم رفع الصور بنجاح');
    } catch (err) {
      toast.error((err as Error).message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (idx: number) => {
    const target = images[idx];
    if (!target) return;
    if (target.storage_path) {
      await supabase.storage.from('products').remove([target.storage_path]);
    }
    const next = images
      .filter((_, i) => i !== idx)
      .map((img, i) => ({
        ...img,
        sort_order: i,
        is_primary: target.is_primary ? i === 0 : img.is_primary,
      }));
    onChange(next);
  };

  const setPrimary = (idx: number) => {
    onChange(images.map((img, i) => ({ ...img, is_primary: i === idx })));
  };

  const move = (idx: number, delta: number) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const copy = [...images];
    const [removed] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, removed!);
    onChange(copy.map((img, i) => ({ ...img, sort_order: i })));
  };

  const setImageColor = (idx: number, color: ColorOption | null) => {
    onChange(
      images.map((img, i) =>
        i === idx
          ? { ...img, color_name: color?.name ?? null, color_hex: color?.hex ?? null }
          : img,
      ),
    );
  };

  const grouped = groupByColor(images);
  const colorLabel = uploadColor ? uploadColor.name : 'كل الألوان';

  return (
    <div className="space-y-4">
      {/* Upload zone header with color selector */}
      <div className="relative flex flex-col gap-2">
        {/* Color picker for new uploads */}
        {colors.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#132238]/70 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-[#FF6B1A]" />
              لون الصور الجديدة:
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#132238]/20 bg-[#F4F2EC] px-3 py-1.5 text-xs font-bold text-[#132238] hover:border-[#FF6B1A] transition-colors"
              >
                {uploadColor ? (
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: uploadColor.hex }}
                  />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-dashed border-[#132238]/40 bg-transparent shrink-0" />
                )}
                {colorLabel}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {dropdownOpen && (
                <div className="absolute start-0 top-full z-20 mt-1 min-w-44 rounded-xl border border-[#132238]/15 bg-white shadow-xl">
                  <button
                    type="button"
                    onClick={() => { setUploadColor(null); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-[#132238] hover:bg-[#F4F2EC] rounded-t-xl transition-colors"
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-dashed border-[#132238]/40 shrink-0" />
                    كل الألوان (بدون تعيين)
                  </button>
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => { setUploadColor(c); setDropdownOpen(false); }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-[#132238] hover:bg-[#F4F2EC] transition-colors',
                        c.name === uploadColor?.name && 'bg-[#FF6B1A]/10 text-[#FF6B1A]',
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Show active color badge */}
            {uploadColor && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white"
                style={{ backgroundColor: uploadColor.hex }}
              >
                {uploadColor.name}
              </span>
            )}
          </div>
        )}

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#132238]/25 bg-[#F4F2EC] p-6 text-center transition-colors hover:border-[#FF6B1A]">
          <Upload className="h-6 w-6 text-[#FF6B1A]" />
          <span className="text-sm font-extrabold text-[#132238]">
            {uploading
              ? 'جاري ضغط ورفع الصور...'
              : uploadColor
              ? `رفع صور لـ "${uploadColor.name}"`
              : 'اضغط لرفع صور جديدة (WebP تلقائياً)'}
          </span>
          <span className="text-xs text-[#132238]/65">
            {uploadColor
              ? `ستُعيَّن تلقائياً للون "${uploadColor.name}"`
              : 'بدون لون محدد = تظهر لكل الألوان'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleFiles}
            className="hidden"
          />
        </label>
      </div>

      {/* Images grouped by color */}
      {images.length > 0 && (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([colorKey, colorImgs]) => {
            const colorMeta = colors.find((c) => c.name === colorKey);
            const colorBg = colorMeta?.hex ?? '#132238';
            const colorLabel = colorKey === '__all__' ? 'بدون لون محدد' : colorKey;

            return (
              <div key={colorKey} className="rounded-2xl border border-[#132238]/12 bg-[#F4F2EC]/60 p-3">
                {/* Color group header */}
                <div className="mb-2.5 flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: colorKey === '__all__' ? 'transparent' : colorBg,
                             borderStyle: colorKey === '__all__' ? 'dashed' : 'solid' }}
                  />
                  <span className="text-xs font-extrabold text-[#132238]">{colorLabel}</span>
                  <span className="rounded-full bg-[#132238]/10 px-2 py-0.5 text-[10px] font-bold text-[#132238]">
                    {colorImgs.length} صورة
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {colorImgs.map((img) => {
                    const idx = images.indexOf(img);
                    return (
                      <div
                        key={`${img.url}-${idx}`}
                        className="group relative overflow-hidden rounded-xl border border-[#132238]/15 bg-[#FFFFFF]"
                      >
                        {/* Primary badge */}
                        {img.is_primary && (
                          <div className="absolute start-1.5 top-1.5 z-10 rounded-full bg-[#FF6B1A] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                            رئيسية
                          </div>
                        )}

                        <img
                          src={img.url}
                          alt=""
                          className="aspect-[4/5] w-full object-contain bg-[#ECE9E0] p-1"
                        />

                        {/* Per-image color selector */}
                        <div className="border-t border-[#132238]/10 p-1.5">
                          <select
                            value={img.color_name ?? '__all__'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '__all__') {
                                setImageColor(idx, null);
                              } else {
                                const c = colors.find((c) => c.name === val);
                                setImageColor(idx, c ?? null);
                              }
                            }}
                            className="w-full rounded-lg border border-[#132238]/15 bg-[#F4F2EC] px-1.5 py-1 text-[10px] font-bold text-[#132238] outline-none focus:border-[#FF6B1A]"
                          >
                            <option value="__all__">كل الألوان</option>
                            {colors.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>

                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => setPrimary(idx)}
                              title="تعيين كصورة رئيسية"
                              className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                                img.is_primary
                                  ? 'bg-[#FF6B1A] text-white'
                                  : 'bg-[#132238]/10 text-[#132238]'
                              }`}
                            >
                              <Star className="inline h-2.5 w-2.5" />
                            </button>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => move(idx, -1)}
                                className="rounded p-0.5 hover:bg-[#132238]/10"
                                aria-label="Move back"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => move(idx, 1)}
                                className="rounded p-0.5 hover:bg-[#132238]/10"
                                aria-label="Move forward"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleRemove(idx)}
                                className="rounded p-0.5 text-rose-700 hover:bg-rose-100"
                                aria-label="Remove"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
