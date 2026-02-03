import { AvatarIconProps } from '../../../types/avatars.ts';

export function Dog({ className = 'w-full h-full' }: AvatarIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle cx="32" cy="32" r="32" fill="#8B5CF6" />
      <g transform="translate(12, 12)">
        {/* Orelhas */}
        <ellipse cx="10" cy="15" rx="6" ry="10" fill="#FEF3C7" />
        <ellipse cx="30" cy="15" rx="6" ry="10" fill="#FEF3C7" />
        {/* Cabeça */}
        <circle cx="20" cy="24" r="14" fill="#FDE68A" />
        {/* Focinho */}
        <ellipse cx="20" cy="28" rx="8" ry="6" fill="#FEF3C7" />
        {/* Olhos */}
        <circle cx="16" cy="22" r="2" fill="#1F2937" />
        <circle cx="24" cy="22" r="2" fill="#1F2937" />
        {/* Nariz */}
        <ellipse cx="20" cy="28" rx="2" ry="1.5" fill="#1F2937" />
        {/* Língua */}
        <ellipse cx="20" cy="32" rx="2" ry="2.5" fill="#F87171" />
      </g>
    </svg>
  );
}
