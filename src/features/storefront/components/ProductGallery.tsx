import { useState } from 'react';
import type { ProductImage } from '@/shared/types/domain';
import { cn } from '@/shared/components/ui/cn';

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = images[activeIdx]?.url ?? images[0]?.url;

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-4/5 overflow-hidden rounded-2xl border border-[#3E452B]/15 bg-[#D2CCB8] shadow-md">
        {current ? (
          <img src={current} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-display font-bold text-[#3E452B]/50">
            VEXA
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={cn(
                'h-20 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all',
                idx === activeIdx
                  ? 'border-[#F47B20] ring-2 ring-[#F47B20]/45'
                  : 'border-transparent opacity-75 hover:opacity-100',
              )}
            >
              <img src={img.url} alt={`${title} ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
