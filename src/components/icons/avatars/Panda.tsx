import { AvatarIconProps } from '../../../types/avatars';

export function Panda({ className = 'w-full h-full' }: AvatarIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle cx="32" cy="32" r="32" fill="#047857" />
      <g transform="translate(12, 14)">
        {/* Orelhas pretas */}
        <circle cx="10" cy="14" r="6" fill="#1F2937" />
        <circle cx="30" cy="14" r="6" fill="#1F2937" />
        {/* Cabeça branca */}
        <circle cx="20" cy="22" r="14" fill="#F9FAFB" />
        {/* Manchas dos olhos */}
        <ellipse cx="14" cy="20" rx="4" ry="5" fill="#1F2937" />
        <ellipse cx="26" cy="20" rx="4" ry="5" fill="#1F2937" />
        {/* Olhos brancos */}
        <circle cx="14" cy="20" r="2" fill="#F9FAFB" />
        <circle cx="26" cy="20" r="2" fill="#F9FAFB" />
        {/* Pupilas */}
        <circle cx="14" cy="20" r="1" fill="#1F2937" />
        <circle cx="26" cy="20" r="1" fill="#1F2937" />
        {/* Nariz */}
        <ellipse cx="20" cy="26" rx="2" ry="1.5" fill="#1F2937" />
        {/* Boca */}
        <path
          d="M20 26 Q18 28 16 28"
          stroke="#1F2937"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M20 26 Q22 28 24 28"
          stroke="#1F2937"
          strokeWidth="0.8"
          fill="none"
        />
      </g>
    </svg>
  );
}
