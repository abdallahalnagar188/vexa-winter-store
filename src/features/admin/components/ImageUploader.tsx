import { useState, type ChangeEvent } from 'react';
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface EditableImage {
  id?: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
}

interface ImageUploaderProps {
  productId: string;
  images: EditableImage[];
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

export function ImageUploader({ productId, images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

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

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#3E452B]/30 bg-[#F5F2E8] p-6 text-center transition-colors hover:border-[#F47B20]">
        <Upload className="h-6 w-6 text-[#F47B20]" />
        <span className="text-sm font-extrabold text-[#3E452B]">
          {uploading ? 'جاري ضغط ورفع الصور...' : 'اضغط لرفع صور جديدة (WebP تلقائياً)'}
        </span>
        <span className="text-xs text-[#3E452B]/65">
          تُرفع الصور إلى Supabase Storage (`products` bucket)
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

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={`${img.url}-${idx}`}
              className="group relative overflow-hidden rounded-xl border border-[#3E452B]/20 bg-[#F5F2E8]"
            >
              <img src={img.url} alt="" className="aspect-4/5 w-full object-cover" />
              <div className="flex items-center justify-between gap-1 p-1.5">
                <button
                  type="button"
                  onClick={() => setPrimary(idx)}
                  title="تعيين كصورة رئيسية"
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                    img.is_primary
                      ? 'bg-[#F47B20] text-white'
                      : 'bg-[#3E452B]/10 text-[#3E452B]'
                  }`}
                >
                  <Star className="inline h-3 w-3" /> {img.is_primary ? 'رئيسية' : 'أساسية'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    className="rounded p-1 hover:bg-[#3E452B]/10"
                    aria-label="Move back"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    className="rounded p-1 hover:bg-[#3E452B]/10"
                    aria-label="Move forward"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemove(idx)}
                    className="rounded p-1 text-rose-700 hover:bg-rose-100"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
