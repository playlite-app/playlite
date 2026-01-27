import { Sparkles, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PresetAvatar, useUserProfile } from '@/hooks/useUserProfile';

import { avatarComponents, avatarNames } from './AvatarIcons';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile, updateProfile } = useUserProfile();
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
      name: localName.trim() || 'Usuário',
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
          <DialogTitle>Personalizar Perfil</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="name" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="name">
              <User className="mr-2 h-4 w-4" />
              Nome
            </TabsTrigger>
            <TabsTrigger value="avatar">
              <Sparkles className="mr-2 h-4 w-4" />
              Avatar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="name" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Seu Nome</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                placeholder="Digite seu nome"
                maxLength={30}
              />
              <p className="text-muted-foreground text-xs">
                Será usado para exibir sua inicial no perfil
              </p>
            </div>

            {/* Preview */}
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-muted-foreground mb-3 text-sm font-medium">
                Preview:
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br font-bold text-white shadow-sm ${
                    localName
                      ? 'from-blue-500 to-purple-600'
                      : 'from-gray-500 to-gray-600'
                  }`}
                >
                  {localName ? localName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-semibold">
                    {localName.trim() || 'Usuário'}
                  </p>
                  <p className="text-muted-foreground text-sm">Seu perfil</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-4">
            <div className="grid gap-2">
              <Label>Escolha um Avatar</Label>
              <div className="grid grid-cols-3 gap-2">
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
            <div className="grid gap-2">
              <Label>Ou use sua inicial</Label>
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className={`hover:bg-accent w-full rounded-lg border-2 p-3 transition-all ${
                  selectedAvatar === null
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-bold text-white shadow-sm">
                    {localName ? localName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Usar Inicial</p>
                    <p className="text-muted-foreground text-xs">
                      Baseado no seu nome
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Preview do avatar selecionado */}
            {selectedAvatar && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <p className="text-muted-foreground mb-3 text-sm font-medium">
                  Preview:
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-sm">
                    {React.createElement(avatarComponents[selectedAvatar])}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {localName.trim() || 'Usuário'}
                    </p>
                    <p className="text-muted-foreground text-sm">Seu perfil</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
