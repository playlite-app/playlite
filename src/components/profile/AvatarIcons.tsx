import React from 'react';

import { PresetAvatar } from '@/hooks/user';

interface AvatarIconProps {
  className?: string;
}

export const DogAvatar = ({ className = 'w-full h-full' }: AvatarIconProps) => (
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

export const CatAvatar = ({ className = 'w-full h-full' }: AvatarIconProps) => (
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
      <line x1="10" y1="24" x2="4" y2="23" stroke="#1F2937" strokeWidth="0.5" />
      <line x1="10" y1="26" x2="4" y2="27" stroke="#1F2937" strokeWidth="0.5" />
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

export const FoxAvatar = ({ className = 'w-full h-full' }: AvatarIconProps) => (
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

export const BearAvatar = ({
  className = 'w-full h-full',
}: AvatarIconProps) => (
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

export const RabbitAvatar = ({
  className = 'w-full h-full',
}: AvatarIconProps) => (
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

export const PandaAvatar = ({
  className = 'w-full h-full',
}: AvatarIconProps) => (
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

export const avatarComponents: Record<
  PresetAvatar,
  React.FC<AvatarIconProps>
> = {
  dog: DogAvatar,
  cat: CatAvatar,
  fox: FoxAvatar,
  bear: BearAvatar,
  rabbit: RabbitAvatar,
  panda: PandaAvatar,
};

export const avatarNames: Record<PresetAvatar, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  fox: 'Raposa',
  bear: 'Urso',
  rabbit: 'Coelho',
  panda: 'Panda',
};
