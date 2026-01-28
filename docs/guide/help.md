# Ajuda e Perguntas Frequentes

Esta seção reúne respostas para dúvidas comuns sobre o uso do Playlite, além de orientações importantes sobre
segurança dos seus dados.

Se você não encontrar a sua resposta aqui, consulte o guia de primeiros passos ou a documentação adicional do projeto.

## Importação da Biblioteca Steam

### A importação da Steam não funciona. O que verificar?

Antes de tudo, verifique os pontos abaixo:

- Seu **SteamID** está no formato **64-bit**
- Sua **Steam Web API Key** é válida
- Seu perfil e biblioteca estão visíveis (dependendo das configurações de privacidade da Steam)
- Você está conectado à internet no momento da importação

Para um passo a passo completo, veja o guia de importação da Steam:

➡️ [Importando sua biblioteca Steam](/guide/getting-started#2-importando-sua-biblioteca-steam)

## Metadados e Informações dos Jogos

### Por que alguns dados vêm incompletos (ex.: gênero)?

Nem todas as informações estão disponíveis diretamente durante a importação inicial.

Nesses casos, o Playlite importa os dados essenciais e permite que você complemente ou corrija as informações depois.

Alguns dados, como gênero e descrições mais completas, podem ser obtidos posteriormente:

- usando a opção **Buscar Metadados** nas configurações
- editando o jogo manualmente, especialmente se ele não for da sua biblioteca Steam

## Backup e Restauração de Dados

O Playlite oferece um sistema simples de **backup e restauração** para garantir a segurança dos seus dados.

Todos os backups são gerados em formato **JSON**, facilitando o armazenamento e a recuperação das informações.

![Backup](/images/app-settings-backup.png)

### Como fazer backup (exportar dados)

1. Acesse **Settings** no aplicativo.
2. Localize a opção **Backup / Exportar dados**.
3. Escolha um local para salvar o arquivo.
4. Confirme a operação.

### Como restaurar um backup (importar dados)

1. Acesse **Settings**.
2. Localize a opção **Restore / Importar dados**.
3. Selecione o arquivo de backup (JSON).
4. Confirme e aguarde o processo.
5. Verifique em **Libraries** se os dados foram restaurados corretamente.

### Boas práticas de segurança

- Faça backup antes de grandes mudanças (importações, reorganizações ou testes).
- Guarde seus arquivos de backup em um local seguro (ex.: pasta dedicada, nuvem ou mídia externa).
- Evite sobrescrever backups antigos sem ter uma cópia alternativa.

### Se algo der errado

- Verifique se o arquivo selecionado é um JSON gerado pelo Playlite.
- Se a restauração falhar, considere:
  - fazer um backup do estado atual antes de tentar novamente
  - realizar o restore numa instalação limpa do aplicativo

## Ainda com dúvidas?

Consulte:

- o guia de primeiros passos
- a seção **Sobre o Projeto**
- ou a documentação técnica no repositório oficial
