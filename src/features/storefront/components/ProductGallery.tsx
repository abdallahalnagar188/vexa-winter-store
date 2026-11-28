import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { ProductImage } from '@/shared/types/domain';
import { cn } from '@/shared/components/ui/cn';

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
  /** Active color name from VariantPicker — filters images to those tagged for this color */
  selectedColor?: string | null;
}

export function ProductGallery({ images, title, selectedColor }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Filter images for the selected color:
  // 1. Images explicitly tagged for the selected color
  // 2. Fall back to images with no color tag (null = shown for all)
  // 3. If nothing specific, show all
  const filteredImages = (() => {
    if (!selectedColor) return images;
    const colorSpecific = images.filter((img) => img.color_name === selectedColor);
    if (colorSpecific.length > 0) return colorSpecific;
    const fallback = images.filter((img) => img.color_name === null);
    if (fallback.length > 0) return fallback;
    return images;
  })();

  // Reset active index when filtered set changes (color switch)
  const [prevColor, setPrevColor] = useState(selectedColor);
  if (prevColor !== selectedColor) {
    setPrevColor(selectedColor);
    // reset to 0 on next render via derived index
  }
  const safeIdx = Math.min(activeIdx, filteredImages.length - 1);
  const current = filteredImages[safeIdx]?.url ?? filteredImages[0]?.url;

  return (
    <div className="flex flex-col gap-3">
      {/* Main image with seamless studio surface and crossfade on color switch */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-[#132238]/10 bg-[radial-gradient(circle_at_center,#FFFFFF_0%,#F3F2EE_65%,#EAE6DC_100%)] shadow-md">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.img
              key={current}
              src={current}
              alt={title}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display font-bold text-[#132238]/50">
              VEXA
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnail strip */}
      {filteredImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {filteredImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={cn(
                'h-20 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-[#F3F2EE] transition-all',
                idx === safeIdx
                  ? 'border-[#FF6B1A] ring-2 ring-[#FF6B1A]/40'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <img
                src={img.url}
                alt={`${title} ${idx + 1}`}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
