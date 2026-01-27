import { Sparkles, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
  const [activeTab, setActiveTab] = useState<'name' | 'avatar'>('name');

  // Sincronizar estado local com o perfil quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setLocalName(profile.name);
      setSelectedAvatar(profile.avatarData);
    }
  }, [isOpen, profile.name, profile.avatarData]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card relative w-full max-w-md rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Personalizar Perfil</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('name')}
            className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'name'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User size={18} />
            Nome
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'avatar'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles size={18} />
            Avatar
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'name' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  placeholder="Digite seu nome"
                  maxLength={30}
                  className="bg-input focus:ring-primary w-full rounded-lg border px-4 py-3 transition-all focus:ring-2 focus:outline-none"
                />
                <p className="text-muted-foreground mt-2 text-xs">
                  Será usado para exibir sua inicial no perfil
                </p>
              </div>

              {/* Preview */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground mb-3 text-sm">Preview:</p>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br font-bold text-white shadow-lg ${
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
                    <p className="text-muted-foreground text-sm">132 jogos</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <div>
                <label className="mb-3 block text-sm font-medium">
                  Escolha um Avatar
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {presetAvatars.map(avatar => {
                    const AvatarComponent = avatarComponents[avatar];

                    return (
                      <button
                        key={avatar}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`hover:bg-accent group relative aspect-square rounded-xl border-2 p-3 transition-all ${
                          selectedAvatar === avatar
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-transparent'
                        }`}
                      >
                        <AvatarComponent className="h-full w-full" />
                        <p className="text-muted-foreground mt-2 text-xs font-medium">
                          {avatarNames[avatar]}
                        </p>
                        {selectedAvatar === avatar && (
                          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opção para usar inicial */}
              <div>
                <button
                  onClick={() => setSelectedAvatar(null)}
                  className={`hover:bg-accent w-full rounded-xl border-2 p-4 transition-all ${
                    selectedAvatar === null
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-bold text-white shadow-lg">
                      {localName ? localName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Usar Inicial</p>
                      <p className="text-muted-foreground text-xs">
                        Baseado no seu nome
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {selectedAvatar && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-muted-foreground mb-3 text-sm">Preview:</p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-lg">
                      {React.createElement(avatarComponents[selectedAvatar])}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {localName.trim() || 'Usuário'}
                      </p>
                      <p className="text-muted-foreground text-sm">132 jogos</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t p-6">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-linear-to-r from-blue-500 to-purple-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all hover:shadow-xl"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
