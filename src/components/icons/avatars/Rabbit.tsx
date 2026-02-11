import { AvatarIconProps } from '../../../types/avatars.ts';

export function Rabbit({ className = 'w-full h-full' }: AvatarIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle cx="32" cy="32" r="32" fill="#A855F7" />
      <g transform="translate(12, 10)">
        {/* Orelhas longas */}
        <ellipse cx="12" cy="8" rx="4" ry="12" fill="#E9D5FF" />
        <ellipse cx="28" cy="8" rx="4" ry="12" fill="#E9D5FF" />
        {/* Parte interna das orelhas */}
        <ellipse cx="12" cy="10" rx="2" ry="8" fill="#F3E8FF" />
        <ellipse cx="28" cy="10" rx="2" ry="8" fill="#F3E8FF" />
        {/* Cabeça */}
        <circle cx="20" cy="26" r="13" fill="#DDD6FE" />
        {/* Focinho */}
        <circle cx="20" cy="30" r="6" fill="#F3E8FF" />
        {/* Olhos */}
        <circle cx="16" cy="24" r="2" fill="#1F2937" />
        <circle cx="24" cy="24" r="2" fill="#1F2937" />
        {/* Nariz */}
        <ellipse cx="20" cy="29" rx="1.5" ry="1" fill="#F472B6" />
        {/* Dentes */}
        <rect x="18" y="32" width="2" height="3" rx="1" fill="#FFF" />
        <rect x="20" y="32" width="2" height="3" rx="1" fill="#FFF" />
      </g>
    </svg>
  );
}
