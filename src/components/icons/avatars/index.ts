import React from 'react';

import { AvatarIconProps, PresetAvatar } from '../../../types/avatars';
import { Bear } from './Bear';
import { Cat } from './Cat';
import { Dog } from './Dog';
import { Fox } from './Fox';
import { Panda } from './Panda';
import { Rabbit } from './Rabbit';

// Export individual components
export { Bear, Cat, Dog, Fox, Panda, Rabbit };

// Export types
export type { AvatarIconProps, PresetAvatar };

// Export avatar components map
export const avatarComponents: Record<
  PresetAvatar,
  React.FC<AvatarIconProps>
> = {
  dog: Dog,
  cat: Cat,
  fox: Fox,
  bear: Bear,
  rabbit: Rabbit,
  panda: Panda,
};

// Export avatar display names (localized)
export const avatarNames: Record<PresetAvatar, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  fox: 'Raposa',
  bear: 'Urso',
  rabbit: 'Coelho',
  panda: 'Panda',
};
