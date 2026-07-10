#!/usr/bin/env bash
# =============================================================================
# Playlite - Linux Desktop Integration Installer
# Instala o arquivo .desktop e o ícone para integração com a barra de tarefas
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_NAME="Playlite"
APP_ID="com.game-manager.dev"
DESKTOP_FILE="$SCRIPT_DIR/$APP_ID.desktop"
ICON_FILE="$PROJECT_ROOT/public/app-icon.png"

DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"

# --- Cores ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}==> Instalando integração Linux para $APP_NAME...${NC}"

# --- Valida arquivos necessários ---
if [ ! -f "$ICON_FILE" ]; then
  echo -e "${RED}Erro: ícone não encontrado em $ICON_FILE${NC}"
  exit 1
fi

if [ ! -f "$DESKTOP_FILE" ]; then
  echo -e "${RED}Erro: arquivo .desktop não encontrado em $DESKTOP_FILE${NC}"
  exit 1
fi

# --- Cria diretórios se não existirem ---
mkdir -p "$DESKTOP_DIR"
mkdir -p "$ICON_DIR"

# --- Copia o ícone ---
cp "$ICON_FILE" "$ICON_DIR/$APP_ID.png"
echo -e "  ${GREEN}✔${NC} Ícone instalado em $ICON_DIR/$APP_ID.png"

# --- Copia o .desktop ---
cp "$DESKTOP_FILE" "$DESKTOP_DIR/$APP_ID.desktop"
echo -e "  ${GREEN}✔${NC} Arquivo .desktop instalado em $DESKTOP_DIR/$APP_ID.desktop"

# --- Atualiza caches do sistema ---
if command -v update-desktop-database &>/dev/null; then
  update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
  echo -e "  ${GREEN}✔${NC} Cache de aplicativos atualizado"
fi

if command -v gtk-update-icon-cache &>/dev/null; then
  gtk-update-icon-cache --force --ignore-theme-index "$HOME/.local/share/icons/hicolor/" 2>/dev/null || true
  echo -e "  ${GREEN}✔${NC} Cache de ícones atualizado"
fi

echo -e "${GREEN}==> Integração instalada com sucesso!${NC}"
echo -e "${YELLOW}    Reinicie o app para que o ícone apareça na barra de tarefas.${NC}"
