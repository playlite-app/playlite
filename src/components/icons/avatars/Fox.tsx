import { AvatarIconProps } from '../../../types/avatars.ts';

export function Fox({ className = 'w-full h-full' }: AvatarIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle cx="32" cy="32" r="32" fill="#F97316" />
      <g transform="translate(12, 14)">
        {/* Orelhas grandes */}
        <path d="M8 10 L12 0 L14 12 Z" fill="#FED7AA" />
        <path d="M32 10 L28 0 L26 12 Z" fill="#FED7AA" />
        {/* Cabeça */}
        <circle cx="20" cy="22" r="13" fill="#FDBA74" />
        {/* Focinho branco */}
        <ellipse cx="20" cy="28" rx="7" ry="5" fill="#FEF3C7" />
        {/* Olhos */}
        <circle cx="16" cy="20" r="2" fill="#1F2937" />
        <circle cx="24" cy="20" r="2" fill="#1F2937" />
        {/* Nariz */}
        <circle cx="20" cy="26" r="1.5" fill="#1F2937" />
      </g>
    </svg>
  );
}
