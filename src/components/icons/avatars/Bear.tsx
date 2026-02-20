import { AvatarIconProps } from '../../../types/avatars';

export function Bear({ className = 'w-full h-full' }: AvatarIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle cx="32" cy="32" r="32" fill="#92400E" />
      <g transform="translate(12, 14)">
        {/* Orelhas redondas */}
        <circle cx="10" cy="12" r="6" fill="#D97706" />
        <circle cx="30" cy="12" r="6" fill="#D97706" />
        {/* Cabeça */}
        <circle cx="20" cy="22" r="14" fill="#F59E0B" />
        {/* Focinho */}
        <ellipse cx="20" cy="28" rx="8" ry="6" fill="#FDE68A" />
        {/* Olhos */}
        <circle cx="16" cy="20" r="2" fill="#1F2937" />
        <circle cx="24" cy="20" r="2" fill="#1F2937" />
        {/* Nariz */}
        <ellipse cx="20" cy="28" rx="2.5" ry="2" fill="#1F2937" />
      </g>
    </svg>
  );
}
