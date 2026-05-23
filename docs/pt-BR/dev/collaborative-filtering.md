# Filtragem Colaborativa Offline

Este documento descreve a estratégia de **Filtragem Colaborativa baseada em itens** utilizada pelo Playlite.

Diferente de sistemas tradicionais que calculam recomendações em tempo real comparando usuários entre si, o Playlite
utiliza um modelo **pré-computado**, distribuído junto com o aplicativo.

## Motivação

A adoção de uma abordagem offline foi motivada por:

* Preservação da privacidade do usuário
* Funcionamento sem dependência de internet
* Simplicidade arquitetural
* Performance previsível em ambiente desktop

## Tipo de Filtragem Colaborativa

O sistema utiliza **Item-based Collaborative Filtering**, onde:

* Cada jogo é tratado como uma entidade
* A similaridade é calculada entre jogos
* Usuários servem apenas como sinal estatístico

Essa abordagem é mais estável do que user-based CF em datasets grandes e esparsos.

## Fonte dos Dados

O sistema de recomendação é alimentado pelo dataset **Game Recommendations on Steam**,
que contém interações reais de usuários da plataforma Steam, incluindo:

- Avaliações e reviews
- Relacionamentos entre usuários e jogos

### Informações do Dataset

| Propriedade | Valor                                                                                 |
|-------------|---------------------------------------------------------------------------------------|
| **Nome**    | Game Recommendations on Steam                                                         |
| **Autor**   | Anton Kozyriev                                                                        |
| **Fonte**   | [Kaggle](https://www.kaggle.com/datasets/antonkozyriev/game-recommendations-on-steam) |
| **DOI**     | [10.34740/KAGGLE/DS/2871694](https://doi.org/10.34740/KAGGLE/DS/2871694)              |
| **Licença** | CC0: Public Domain                                                                    |
| **Tamanho** | ~2.24 GB                                                                              |
| **Período** | Dados até 2023                                                                        |

### Estrutura dos Dados

O dataset inclui as seguintes tabelas principais:

- `recommendations.csv` - Reviews de usuários
- `games.csv` - Metadados dos jogos
- `users.csv` - Informações dos usuários (anonimizadas)

### Citação Acadêmica

```
Kozyriev, A. (2023). Game Recommendations on Steam [Data set]. 
Kaggle. https://doi.org/10.34740/KAGGLE/DS/2871694
```

### Pré-processamento e Limpeza

Para evitar o problema de "Cold Start" e garantir a relevância das recomendações, o dataset bruto é filtrado antes do
treinamento. São removidos:

1. **Jogos de Baixa Qualidade:** Títulos com menos de 70% de aprovação.
2. **Jogos de Nicho Extremo:** Títulos com menos de 100 avaliações (evita viés de poucos usuários).
3. **Ruído de Usuário:** Contas com tempo de jogo insignificante (< 2 horas).

O resultado final é um subconjunto de **~14.000 jogos** de alta relevância, representando cerca de 28% do catálogo
original, mas mantendo a maioria das interações significativas.

## Representação dos Dados

Cada jogo é representado por um vetor binário:

```text
Jogo A = [1, 0, 1, 1, 0, ...]
```

Onde:

* `1` indica que o usuário avaliou positivamente o jogo
* `0` indica ausência de avaliação positiva

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

## Filtragem e Estabilização

Para garantir qualidade nas recomendações, são aplicadas as seguintes regras:

* Remoção de jogos com poucas avaliações
* Limitação do número de vizinhos similares (Top-K)
* Penalização de jogos excessivamente populares

Essas heurísticas evitam recomendações instáveis ou óbvias.

## Geração do Arquivo Final

O resultado do processamento é um arquivo JSON contendo:

* Lista de jogos similares para cada jogo
* Scores normalizados entre 0 e 1
* Metadados auxiliares (popularidade, categorias)

Este arquivo é consumido diretamente pelo backend em Rust.

## Integração com o Modelo Híbrido

A filtragem colaborativa não decide sozinha a recomendação final.

Durante a execução do aplicativo:

* O perfil do usuário define o peso de cada jogo da biblioteca
* A filtragem colaborativa sugere jogos relacionados
* Os scores são combinados com o content-based filtering

Isso garante recomendações personalizadas sem comprometer a privacidade.

## Limitações Conhecidas

* Jogos muito recentes podem não aparecer
* Recomendações dependem da qualidade do dataset
* Não considera contexto temporal do usuário

Essas limitações são aceitáveis dentro da proposta local-first.

---

Este modelo foi escolhido por equilibrar **qualidade**, **simplicidade** e **controle do usuário**, sendo adequado para
um aplicativo desktop offline.
