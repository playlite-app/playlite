# 🗺️ Roadmap do Playlite

Este documento descreve os planos de longo prazo para o Playlite.
O foco é expandir a compatibilidade e a riqueza de dados, mantendo a filosofia *local-first*.

## 🚧 v2.0.0 - A Era dos Metadados (Em Planejamento)

O foco desta versão é enriquecer a biblioteca visualmente e informativamente.

- [ ] **Integração IGDB:** Migração/Complemento da RAWG para IGDB (Twitch) para capas de alta resolução e metadados
  precisos.
- [ ] **Sistema de Cache de Imagens:** Otimizar o armazenamento local de capas para reduzir chamadas de rede.
- [ ] **Abstração de MetadataProvider:** Refatoração do Rust (Traits) para suportar múltiplas fontes.

## 🔮 v3.0.0 - O Hub Universal

Transformar o app em um lançador centralizado real.

- [ ] **Leitura da Epic Games Store:** Importação local via manifestos `.item`.
- [ ] **Leitura da GOG Galaxy:** Importação local de jogos instalados.
- [ ] **Monitoramento de Execução:** Detectar quando um jogo fecha para atualizar o "Tempo Jogado" automaticamente.

## ☁️ v4.0.0 - Sincronização & Expansão

- [ ] **Cloud Sync (Supabase):** Salvar banco de dados e configurações na nuvem (Opcional/Opt-in).
- [ ] **Build Linux:** Suporte oficial para Debian/Ubuntu e Flatpak (focado no Steam Deck?).

## 📱 Projetos Satélites

- **Playlite Companion (Android):** App React Native separado para visualização da biblioteca longe do PC.
