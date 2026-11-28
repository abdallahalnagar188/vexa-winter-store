import { cn } from './cn';

export interface BrandLogoProps {
  variant?: 'dark-bg' | 'light-bg' | 'monochrome';
  showWordmark?: boolean;
  className?: string;
}

interface LogoPalette {
  primary: string;
  accent: string;
}

const PALETTES: Record<NonNullable<BrandLogoProps['variant']>, LogoPalette> = {
  'dark-bg': {
    primary: '#FFFFFF',
    accent: '#F97316',
  },
  'light-bg': {
    primary: '#0D1526',
    accent: '#F97316',
  },
  monochrome: {
    primary: '#000000',
    accent: '#000000',
  },
};

export function BrandLogo({
  variant = 'dark-bg',
  showWordmark = true,
  className,
}: BrandLogoProps) {
  const { primary, accent } = PALETTES[variant];

  return (
    <span dir="ltr" className="inline-flex shrink-0 items-center select-none">
      {!showWordmark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 84"
          fill="none"
          role="img"
          aria-label="أثر"
          className={cn('block shrink-0', className)}
        >
          {/* Compact geometric "أ" emblem mark */}
          <polygon points="26,31 39,26 39,77 26,77" fill={primary} />
          <path
            d="M44,5 L26,5 L19,14 L34,14 L18,19 L18,24 L46,21 L46,16 L31,16 L37,10 L44,10 Z"
            fill={accent}
          />
          <polygon points="14,68 20,74 14,80 8,74" fill={accent} />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 184 94"
          fill="none"
          role="img"
          aria-label="أثر"
          className={cn('block shrink-0', className)}
        >
          {/* أ : Crisp beveled vertical Alif + architectural Hamza */}
          <polygon points="154,32 167,27 167,71 154,71" fill={primary} />
          <path
            d="M170,6 L154,6 L147,14 L161,14 L146,19 L146,24 L173,21 L173,16 L158,16 L164,10 L170,10 Z"
            fill={primary}
          />

          {/* ثر : Connected geometric Kufic body with crisp diagonal Ra sweep */}
          <path
            d="M133,43 L145,38 L145,71 L58,71 L24,91 L10,86 L45,64 L45,49 L57,44 L57,59 L133,59 Z"
            fill={primary}
          />

          {/* Three architectural diamond dots above ث in Burnt Orange */}
          <polygon points="116,18 122,24 116,30 110,24" fill={accent} />
          <polygon points="103,31 109,37 103,43 97,37" fill={accent} />
          <polygon points="129,31 135,37 129,43 123,37" fill={accent} />
        </svg>
      )}
    </span>
  );
}
