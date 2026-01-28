# Sistema de Recomendação

O Playlite utiliza um **sistema híbrido de recomendação**, combinando informações do próprio usuário com padrões globais
de consumo de jogos, sempre respeitando a filosofia **local-first** e **privacy-first**.

Nenhum dado pessoal do usuário é enviado para servidores externos. Todo o processamento acontece localmente no
aplicativo ou é pré-computado offline.

## Visão Geral da Abordagem

O sistema combina duas estratégias complementares:

1. **Filtragem Baseada em Conteúdo (Content-Based Filtering)**
2. **Filtragem Colaborativa Offline (Collaborative Filtering)**

Essas abordagens são combinadas para gerar recomendações relevantes, estáveis e explicáveis.

## 1. Filtragem Baseada em Conteúdo

A filtragem baseada em conteúdo analisa exclusivamente a biblioteca do usuário para construir um **Perfil de
Preferências**.

São considerados sinais explícitos e implícitos, como:

* Jogos marcados como favoritos
* Avaliações pessoais (1–5 estrelas)
* Tempo de jogo
* Gêneros, tags e séries associadas aos jogos

Esses sinais são convertidos em vetores de preferência que representam o gosto do usuário.

### Scoring Local

Cada jogo da biblioteca recebe um peso de relevância baseado em heurísticas simples e explicáveis:

* Favoritos possuem peso alto
* Avaliações influenciam moderadamente
* Tempo jogado contribui de forma complementar

Jogos não jogados ou sem avaliação não distorcem o perfil.

## 2. Filtragem Colaborativa Offline

A filtragem colaborativa é baseada em padrões globais de consumo extraídos de datasets públicos de avaliações de jogos.

### Características

* Processamento **offline**, fora do aplicativo.
* Baseado em **~25 milhões de interações** processadas de datasets públicos da Steam.
* Uso de **feedback implícito** (avaliações positivas filtradas por tempo de jogo).
* Similaridade calculada entre jogos, não entre usuários.

O resultado é um conjunto de relações do tipo:

> "Jogadores que gostaram de X também gostaram de Y"

Esses dados são exportados para um arquivo JSON e distribuídos com o aplicativo.

## 3. Combinação das Estratégias (Modelo Híbrido)

Durante a recomendação, o Playlite combina os dois sinais:

* O **perfil do usuário** determina quais jogos da sua biblioteca são mais representativos do seu gosto
* A **filtragem colaborativa** sugere jogos semelhantes a esses títulos

De forma simplificada:

```text
score_final =
  α × content_based_score +
  β × collaborative_score
```

Onde α e β são pesos ajustáveis.

## 4. Regras de Negócio

Após o cálculo matemático, regras adicionais garantem uma melhor experiência:

* Penalização de jogos excessivamente populares
* Diversidade de gêneros e estilos
* Remoção de sugestões repetitivas

## 5. Explicabilidade

As recomendações são acompanhadas de explicações determinísticas, baseadas em dados estruturados:

* Gêneros em comum
* Tags relevantes
* Séries favoritas

Isso garante transparência e elimina a necessidade de LLMs para explicação.

## Benefícios da Abordagem

* Funciona 100% offline
* Preserva a privacidade do usuário
* Escala bem para bibliotecas grandes
* Fácil de manter e evoluir
* Adequada para um aplicativo desktop local-first

---

Este sistema foi projetado para equilibrar **qualidade de recomendação**, **simplicidade técnica** e **controle do
usuário**.
