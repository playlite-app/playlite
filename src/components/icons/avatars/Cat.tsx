import { AvatarIconProps } from '../../../types/avatars.ts';

export function Cat({ className = 'w-full h-full' }: AvatarIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle cx="32" cy="32" r="32" fill="#EC4899" />
      <g transform="translate(12, 14)">
        {/* Orelhas triangulares */}
        <path d="M8 8 L12 0 L16 8 Z" fill="#FCA5A5" />
        <path d="M24 8 L28 0 L32 8 Z" fill="#FCA5A5" />
        {/* Cabeça */}
        <circle cx="20" cy="22" r="14" fill="#FECACA" />
        {/* Olhos */}
        <ellipse cx="16" cy="20" rx="2" ry="3" fill="#1F2937" />
        <ellipse cx="24" cy="20" rx="2" ry="3" fill="#1F2937" />
        {/* Nariz */}
        <path d="M20 24 L18 26 L20 27 L22 26 Z" fill="#F87171" />
        {/* Bigodes */}
        <line
          x1="10"
          y1="24"
          x2="4"
          y2="23"
          stroke="#1F2937"
          strokeWidth="0.5"
        />
        <line
          x1="10"
          y1="26"
          x2="4"
          y2="27"
          stroke="#1F2937"
          strokeWidth="0.5"
        />
        <line
          x1="30"
          y1="24"
          x2="36"
          y2="23"
          stroke="#1F2937"
          strokeWidth="0.5"
        />
        <line
          x1="30"
          y1="26"
          x2="36"
          y2="27"
          stroke="#1F2937"
          strokeWidth="0.5"
        />
      </g>
    </svg>
  );
}
