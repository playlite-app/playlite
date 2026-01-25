# Filtragem Colaborativa Offline

Este documento descreve a estratégia de **Filtragem Colaborativa baseada em itens** utilizada pelo Playlite.

Diferente de sistemas tradicionais que calculam recomendações em tempo real comparando usuários entre si, o Playlite utiliza um modelo **pré-computado**, distribuído junto com o aplicativo.

---

## Motivação

A adoção de uma abordagem offline foi motivada por:

* Preservação da privacidade do usuário
* Funcionamento sem dependência de internet
* Simplicidade arquitetural
* Performance previsível em ambiente desktop

---

## Tipo de Filtragem Colaborativa

O sistema utiliza **Item-based Collaborative Filtering**, onde:

* Cada jogo é tratado como uma entidade
* A similaridade é calculada entre jogos
* Usuários servem apenas como sinal estatístico

Essa abordagem é mais estável do que user-based CF em datasets grandes e esparsos.

---

## Fonte dos Dados

> **Nota:** A origem específica dos datasets será documentada futuramente.

De forma geral, são utilizados datasets públicos contendo:

* Identificador do jogo
* Identificador do usuário
* Avaliação positiva ou negativa

Somente avaliações positivas são consideradas.

---

## Representação dos Dados

Cada jogo é representado por um vetor binário:

```text
Jogo A = [1, 0, 1, 1, 0, ...]
```

Onde:

* `1` indica que o usuário avaliou positivamente o jogo
* `0` indica ausência de avaliação positiva

---

## Métrica de Similaridade

A similaridade entre dois jogos é calculada usando **Cosine Similarity**:

```text
cos(A, B) = (A · B) / (||A|| × ||B||)
```

### Justificativa da Escolha

* Funciona bem com dados binários
* Lida melhor com datasets esparsos
* Reduz viés causado por popularidade extrema
* Fácil de explicar e auditar

---

## Filtragem e Estabilização

Para garantir qualidade nas recomendações, são aplicadas as seguintes regras:

* Remoção de jogos com poucas avaliações
* Limitação do número de vizinhos similares (Top-K)
* Penalização de jogos excessivamente populares

Essas heurísticas evitam recomendações instáveis ou óbvias.

---

## Geração do Arquivo Final

O resultado do processamento é um arquivo JSON contendo:

* Lista de jogos similares para cada jogo
* Scores normalizados entre 0 e 1
* Metadados auxiliares (popularidade, categorias)

Este arquivo é consumido diretamente pelo backend em Rust.

---

## Integração com o Modelo Híbrido

A filtragem colaborativa não decide sozinha a recomendação final.

Durante a execução do aplicativo:

* O perfil do usuário define o peso de cada jogo da biblioteca
* A filtragem colaborativa sugere jogos relacionados
* Os scores são combinados com o content-based filtering

Isso garante recomendações personalizadas sem comprometer a privacidade.

---

## Limitações Conhecidas

* Jogos muito recentes podem não aparecer
* Recomendações dependem da qualidade do dataset
* Não considera contexto temporal do usuário

Essas limitações são aceitáveis dentro da proposta local-first.

---

Este modelo foi escolhido por equilibrar **qualidade**, **simplicidade** e **controle do usuário**, sendo adequado para um aplicativo desktop offline.
