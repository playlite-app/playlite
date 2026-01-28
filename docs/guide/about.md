# Sobre o Playlite

O **Playlite** é um gerenciador de biblioteca de jogos desktop com foco em uso local (*local-first*), privacidade e
recomendações inteligentes.

Ele foi criado para ajudar jogadores com bibliotecas grandes a decidir **o que jogar a seguir**, oferecendo uma
experiência simples, rápida e focada em uso offline, sem dependência obrigatória de serviços externos após a instalação
e importação da biblioteca e download de dados de jogos.

O projeto também funciona como um estudo de tecnologias modernas para aplicações desktop, mas sempre com foco principal
na **experiência do usuário final**.

## Privacidade e Dados do Usuário

A privacidade é um princípio central do Playlite.

- Todos os dados são armazenados **localmente** no computador do usuário
- Nenhuma informação pessoal é coletada, enviada ou compartilhada
- O aplicativo funciona **offline**
- Não há rastreamento, telemetria ou analytics

O Playlite não exige login ou conta para funcionar.

## APIs e Serviços Externos

O Playlite utiliza APIs externas **apenas durante a importação inicial** da biblioteca de jogos e download de metadados,
como capas, descrições e avaliações. Após essa etapa, o funcionamento do aplicativo é totalmente local.

Algumas funcionalidades opcionais dependem de acesso à internet, como:

- Busca jogos em alta e lançamentos via API do RAWG
- Busca de preços e promoções na API do IsThereAnyDeal
- Pesquisa de jogos gratuitos via API do GamerPower

Esses serviços são acessados de forma segura, sem envio de dados pessoais e apenas quando o usuário opta por
utilizá-los.

## Uso de IA como funcionalidade opcional

O Playlite oferece uma funcionalidade opcional de tradução automática de descrições de jogos utilizando serviços de
Inteligência Artificial (IA), atavés da API do Gemini.

## Uso de Inteligência Artificial no desenvolvimento

O Playlite foi desenvolvido com apoio de ferramentas de Inteligência Artificial como parte do processo de
desenvolvimento do software.

Esse uso de IA ocorreu **apenas durante a criação do projeto**, como ferramenta de apoio para escrita de código,
documentação e exploração de ideias. Nenhuma IA é executada dentro do aplicativo.

- o funcionamento do Playlite é local e offline
- não existe coleta ou envio de informações pessoais

O uso de IA no desenvolvimento teve como objetivo acelerar a criação do projeto, facilitar o aprendizado de novas
tecnologias e melhorar a qualidade geral do software, sempre com validação humana das decisões finais.

## Transparência

O Playlite adota uma postura de transparência sobre como foi desenvolvido e como funciona.

Detalhes técnicos adicionais, arquitetura e decisões de implementação estão disponíveis na documentação voltada para
desenvolvedores e no repositório oficial do projeto.
