import { cn } from './cn';

export interface VexaLogoProps {
  variant?: 'dark-bg' | 'light-bg' | 'monochrome';
  showWordmark?: boolean;
  className?: string;
}

interface LogoPalette {
  primary: string;
  primaryFacet: string;
  accent: string;
  accentFacet: string;
}

const PALETTES: Record<NonNullable<VexaLogoProps['variant']>, LogoPalette> = {
  'dark-bg': {
    primary: '#FFFFFF',
    primaryFacet: '#CBD5E1',
    accent: '#F26522',
    accentFacet: '#C8430E',
  },
  'light-bg': {
    primary: '#0D1526',
    primaryFacet: '#1E2D4A',
    accent: '#F26522',
    accentFacet: '#C8430E',
  },
  monochrome: {
    primary: '#000000',
    primaryFacet: '#000000',
    accent: '#000000',
    accentFacet: '#000000',
  },
};

export function VexaLogo({
  variant = 'dark-bg',
  showWordmark = true,
  className,
}: VexaLogoProps) {
  const { primary, primaryFacet, accent, accentFacet } = PALETTES[variant];

  const markGeometry = (
    <g>
      {/* Left faceted blade of the V */}
      <polygon points="10,10 39,10 68,84 61,102" fill={primary} />
      <polygon points="31,10 39,10 68,84 59,75" fill={primaryFacet} />
      {/* Right faceted blade of the V (accent) */}
      <polygon points="88,10 116,10 71,76 63,55" fill={accent} />
      <polygon points="104,10 116,10 71,76 96,29" fill={accentFacet} />
    </g>
  );

  return (
    <span dir="ltr" className="inline-flex shrink-0 items-center select-none">
      {!showWordmark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 126 112"
          fill="none"
          role="img"
          aria-label="VEXA"
          className={cn('block shrink-0', className)}
        >
          {markGeometry}
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 334 112"
          fill="none"
          role="img"
          aria-label="VEXA"
          className={cn('block shrink-0', className)}
        >
          {/* Faceted V acting directly as the V of VEXA (no duplicate V) */}
          {markGeometry}

          {/* Bold Geometric EXA Wordmark */}
          <g fill={primary}>
            {/* E */}
            <path d="M132,24 H182 V36 H147 V44 H176 V56 H147 V64 H182 V76 H132 Z" />
            {/* X */}
            <polygon points="192,24 209,24 223,43 237,24 254,24 233,50 255,76 238,76 223,57 208,76 191,76 213,50" />
            {/* A */}
            <path
              fillRule="evenodd"
              d="M281,24 H297 L322,76 H305 L300,64 H278 L273,76 H256 Z M289,37 L282,53 H296 Z"
            />
          </g>
        </svg>
      )}
    </span>
  );
}
