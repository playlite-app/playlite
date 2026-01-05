# Configuração do Prettier e ESLint no Rust Rover

Este guia explica como configurar o Prettier e ESLint no Rust Rover para formatar automaticamente o código
TypeScript/React sem afetar os arquivos Rust.

## ✅ Configurações já implementadas

### Arquivos criados/atualizados:

- ✅ `.editorconfig` - Configurações de editor (indentação, EOL, etc.)
- ✅ `eslint.config.js` - ESLint 9 (flat config) com TypeScript
- ✅ `.prettierrc.json` - Configuração do Prettier
- ✅ `.prettierignore` - Exclusões do Prettier (inclui arquivos Rust)
- ✅ `package.json` - Scripts e dependências atualizadas

### Dependências instaladas:

- `eslint` (v9.39.2)
- `prettier` (v3.7.4)
- `typescript-eslint` (v8.20.0)
- `eslint-plugin-prettier`
- `eslint-config-prettier`
- `eslint-plugin-react-refresh`
- `eslint-plugin-simple-import-sort`
- `prettier-plugin-tailwindcss`

## 🔧 Configurações no Rust Rover

### 1. Habilitar EditorConfig

1. Abra **Settings** (Ctrl+Alt+S ou File > Settings)
2. Vá para **Editor > Code Style**
3. Marque ✅ **Enable EditorConfig support**

### 2. Configurar Prettier

1. Abra **Settings** (Ctrl+Alt+S)
2. Vá para **Languages & Frameworks > JavaScript > Prettier**
3. Configure:
    - **Prettier package**: Escolha `D:\Projetos\game_manager\node_modules\prettier`
    - **Run for files**: `{**/*,*}.{js,ts,jsx,tsx,css,json,md}`
    - Marque ✅ **On 'Reformat Code' action**
    - Marque ✅ **On save** (opcional mas recomendado)

### 3. Configurar ESLint

1. Abra **Settings** (Ctrl+Alt+S)
2. Vá para **Languages & Frameworks > JavaScript > Code Quality Tools > ESLint**
3. Configure:
    - Selecione **Automatic ESLint configuration**
    - Ou selecione **Manual ESLint configuration** e aponte para `eslint.config.js`
    - Marque ✅ **Run eslint --fix on save** (opcional mas recomendado)

### 4. Configurar File Watchers (Opcional - Automático)

1. Abra **Settings** (Ctrl+Alt+S)
2. Vá para **Tools > File Watchers**
3. Clique em **+** e selecione **Custom**

#### Para Prettier:

- **Name**: Prettier
- **File type**: TypeScript/JavaScript/CSS
- **Scope**: Project Files
- **Program**: `$ProjectFileDir$\node_modules\.bin\prettier.cmd`
- **Arguments**: `--write $FilePathRelativeToProjectRoot$`
- **Output paths**: `$FilePathRelativeToProjectRoot$`
- **Working directory**: `$ProjectFileDir$`
- **Advanced Options**: Desmarque "Auto-save edited files"

#### Para ESLint:

- **Name**: ESLint Fix
- **File type**: TypeScript/JavaScript
- **Scope**: Project Files
- **Program**: `$ProjectFileDir$\node_modules\.bin\eslint.cmd`
- **Arguments**: `--fix $FilePathRelativeToProjectRoot$`
- **Output paths**: `$FilePathRelativeToProjectRoot$`
- **Working directory**: `$ProjectFileDir$`

### 5. Excluir diretórios Rust da formatação JavaScript

1. Abra **Settings** (Ctrl+Alt+S)
2. Vá para **Languages & Frameworks > JavaScript > Code Quality Tools > ESLint**
3. Em **Exclude files and directories**, adicione:
    - `src-tauri/**`
    - `target/**`

## 📝 Scripts disponíveis

Use estes comandos no terminal:

```bash
# Verificar formatação com Prettier
npm run format:check

# Formatar código com Prettier
npm run format

# Verificar problemas com ESLint
npm run lint

# Corrigir problemas automaticamente com ESLint
npm run lint:fix
```

## 🎨 Padrões de formatação configurados

### Prettier:

- **Aspas**: Simples (`'`)
- **Ponto e vírgula**: Sim
- **Tamanho da linha**: 80 caracteres
- **Indentação**: 2 espaços
- **Trailing comma**: ES5
- **Arrow parens**: Avoid
- **Plugin**: Tailwind CSS (ordena classes automaticamente)

### ESLint:

- **TypeScript**: Strict mode ativado
- **React**: Plugin react-refresh para HMR
- **Imports**: Ordenação automática de imports
- **Padding**: Linhas em branco obrigatórias antes de returns, ifs, loops
- **Prettier**: Integrado como regra do ESLint

### EditorConfig:

- **TypeScript/JavaScript/JSON**: 2 espaços
- **Rust**: 4 espaços (não afetado pelo Prettier)
- **Markdown**: 2 espaços
- **Line ending**: LF (Unix-style)
- **Charset**: UTF-8
- **Insert final newline**: Sim

## 🚫 Arquivos excluídos da formatação

O Prettier **NÃO** vai formatar:

- ✅ Todos os arquivos `.rs` (Rust)
- ✅ `Cargo.toml` e `Cargo.lock`
- ✅ Diretório `src-tauri/**`
- ✅ `node_modules/`
- ✅ `dist/` e `coverage/`
- ✅ Arquivos `*.lock`

## ✨ Atalhos úteis no Rust Rover

- **Formatar código**: `Ctrl+Alt+L` (usa Prettier se configurado)
- **Organizar imports**: `Ctrl+Alt+O`
- **Corrigir problemas ESLint**: `Alt+Enter` > "ESLint: Fix current file"
- **Reformat with Prettier**: `Ctrl+Alt+Shift+P`

## 🔍 Verificação

Para testar se tudo está funcionando:

1. Abra um arquivo TypeScript (ex: `src/App.tsx`)
2. Desformate propositalmente uma linha
3. Salve o arquivo
4. O código deve ser formatado automaticamente se você habilitou "On save"
5. Ou use `Ctrl+Alt+L` para formatar manualmente

## 🐛 Troubleshooting

### Prettier não está formatando

1. Verifique se o caminho do node_modules está correto
2. Reinicie a IDE
3. Verifique se o arquivo não está em `.prettierignore`

### ESLint não está funcionando

1. Execute `npm install` novamente
2. Verifique se `eslint.config.js` existe
3. Certifique-se de que a configuração automática está habilitada

### Rust sendo formatado incorretamente

1. Verifique `.prettierignore` inclui `src-tauri/**/*.rs`
2. Verifique se o EditorConfig está ativado
3. Use o formatter padrão do Rust Rover para arquivos `.rs` (rustfmt)

## 📚 Mais informações

- [Prettier Docs](https://prettier.io/docs/en/configuration.html)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [EditorConfig](https://editorconfig.org/)
- [Rust Rover Settings](https://www.jetbrains.com/help/rust/)

