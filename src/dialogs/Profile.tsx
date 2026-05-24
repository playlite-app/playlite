import { Sparkles, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { avatarComponents, avatarNames } from '@/components/icons/avatars';
import { PresetAvatar, useUserProfile } from '@/hooks/user';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Profile({ isOpen, onClose }: ProfileModalProps) {
  const { profile, updateProfile } = useUserProfile();
  const { t } = useTranslation('dialog');
  const [localName, setLocalName] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState<PresetAvatar | null>(
    profile.avatarData
  );

  // Sincronizar estado local com o perfil quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setLocalName(profile.name);
      setSelectedAvatar(profile.avatarData);
    }
  }, [isOpen, profile.name, profile.avatarData]);

  const handleSave = () => {
    updateProfile({
      name: localName.trim() || t('profile_default_name'),
      avatarType: selectedAvatar ? 'preset' : 'initial',
      avatarData: selectedAvatar,
    });
    onClose();
  };

  const presetAvatars: PresetAvatar[] = [
    'dog',
    'cat',
    'fox',
    'bear',
    'rabbit',
    'panda',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profile_title')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="name" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="name">
              <User className="mr-2 h-4 w-4" />
              {t('profile_name_tab')}
            </TabsTrigger>
            <TabsTrigger value="avatar">
              <Sparkles className="mr-2 h-4 w-4" />
              {t('profile_avatar_tab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="name" className="space-y-4">
            <div className="grid gap-2 py-2 pt-4">
              <Label htmlFor="name">{t('profile_name_label')}</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                placeholder={t('profile_name_placeholder')}
                maxLength={30}
              />
              <p className="text-muted-foreground text-xs">
                {t('profile_name_helper_text')}
              </p>
            </div>

            {/* Preview */}
            <p className="mb-3 text-sm font-medium">
              {t('profile_preview_label')}
            </p>
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br font-bold text-white shadow-sm ${
                    localName
                      ? 'from-blue-500 to-purple-600'
                      : 'from-gray-500 to-gray-600'
                  }`}
                >
                  {localName
                    ? localName.charAt(0).toUpperCase()
                    : t('profile_default_initial')}
                </div>
                <div>
                  <p className="font-semibold">
                    {localName.trim() || t('profile_default_name')}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t('profile_your_profile_text')}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-4">
            <div className="grid gap-2 pt-4">
              <Label>{t('profile_choose_avatar_label')}</Label>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {presetAvatars.map(avatar => {
                  const AvatarComponent = avatarComponents[avatar];

                  return (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`hover:bg-accent group relative aspect-square rounded-lg border-2 p-2 transition-all ${
                        selectedAvatar === avatar
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent'
                      }`}
                    >
                      <AvatarComponent className="h-full w-full" />
                      <p className="text-muted-foreground mt-1 text-xs font-medium">
                        {avatarNames[avatar]}
                      </p>
                      {selectedAvatar === avatar && (
                        <div className="bg-primary absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white shadow-sm">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opção para usar inicial */}
            <div className="grid gap-2 py-2">
              <Label className="pb-1">{t('profile_use_initial_label')}</Label>
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className={`hover:bg-accent w-full rounded-lg border-2 p-4 transition-all ${
                  selectedAvatar === null
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-bold text-white shadow-sm">
                    {localName
                      ? localName.charAt(0).toUpperCase()
                      : t('profile_default_initial')}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      {t('profile_use_initial_button')}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t('profile_use_initial_helper_text')}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Preview do avatar selecionado */}
            {selectedAvatar && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <p className="text-muted-foreground mb-3 text-sm font-medium">
                  {t('profile_selected_avatar_preview_label')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-sm">
                    {React.createElement(avatarComponents[selectedAvatar])}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {localName.trim() || t('profile_default_name')}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('profile_your_profile_text')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            {t('profile_cancel_button')}
          </Button>
          <Button onClick={handleSave}>{t('profile_save_button')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
