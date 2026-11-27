import { cn } from './cn';

export interface VexaLogoProps {
  variant?: 'dark-bg' | 'light-bg' | 'monochrome';
  showWordmark?: boolean;
  className?: string;
}

const FILLS: Record<NonNullable<VexaLogoProps['variant']>, { primary: string; accent: string }> = {
  'dark-bg': { primary: '#FFFFFF', accent: '#F97316' },
  'light-bg': { primary: '#0D1526', accent: '#F97316' },
  monochrome: { primary: '#000000', accent: '#000000' },
};

export function VexaLogo({
  variant = 'dark-bg',
  showWordmark = true,
  className,
}: VexaLogoProps) {
  const { primary, accent } = FILLS[variant];

  return (
    <span dir="ltr" className="inline-flex shrink-0 items-center">
      {!showWordmark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 120"
          fill="none"
          role="img"
          aria-label="VEXA"
          className={cn('block shrink-0', className)}
        >
          <polygon points="20,24 43,24 65,80 72,91 61,100 54,100" fill={primary} />
          <polygon points="77,24 100,24 74,80 63,61" fill={accent} />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 380 96"
          fill="none"
          role="img"
          aria-label="VEXA"
          className={cn('block shrink-0', className)}
        >
          <g transform="translate(8, 8) scale(0.67)">
            <polygon points="14,18 40,18 65,83 73,96 60,106 52,106" fill={primary} />
            <polygon points="80,18 106,18 76,84 63,62" fill={accent} />
          </g>
          <g fill={primary} transform="translate(106, 26)">
            <polygon points="0,0 11,0 22,31 33,0 44,0 27,44 17,44" />
            <path d="M62,0 H100 V9 H72 V17.5 H96 V26.5 H72 V35 H101 V44 H62 Z" />
            <polygon points="118,0 130,0 142,16.5 154,0 166,0 148,22 167,44 155,44 142,27.5 129,44 117,44 136,22" />
            <path d="M202,0 H213 L231,44 H219.5 L215.5,33.5 H199.5 L195.5,44 H184 Z M202.5,25 H212.5 L207.5,11.5 Z" />
          </g>
        </svg>
      )}
    </span>
  );
}
