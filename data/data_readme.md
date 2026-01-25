# Pipeline de Dados – Filtragem Colaborativa

Esta pasta contém exclusivamente os **artefatos de ciência de dados** usados para gerar as recomendações colaborativas
do Playlite.

Diferente do código da aplicação, que roda no dispositivo do usuário, tudo aqui é executado **offline, em batch**,
durante o desenvolvimento. O resultado final é um conjunto de arquivos prontos para consumo pelo aplicativo.

---

## 🎯 Papel desta Pasta no Projeto

O Playlite foi projetado para ser simples, rápido e local-first. Para manter essas características, qualquer
processamento pesado é **retirado do runtime da aplicação**.

Esta pasta existe para:

* Processar grandes volumes de dados de avaliações de jogos
* Extrair padrões globais de preferência entre jogadores
* Transformar esses padrões em dados estáticos
* Alimentar o sistema de recomendação do app sem custo computacional adicional

---

## 🧠 O que NÃO acontece aqui

É importante destacar que esta pasta **não**:

* Processa dados do usuário do Playlite
* Executa inferência em tempo real
* Interage com o banco SQLite do aplicativo
* Depende de serviços externos em produção

Tudo aqui é isolado do usuário final.

---

## 📦 Estrutura da Pasta

```text
data/
 ├─ README.md          # Visão geral do pipeline de dados
 ├─ scripts/           # Scripts Python para processamento batch
 ├─ notebooks/         # Análises exploratórias e validação
 ├─ datasets/          # Datasets brutos (não versionados)
 ├─ outputs/           # Arquivos JSON finais consumidos pelo app
```

---

## 🔁 Fluxo de Trabalho Esperado

O fluxo típico de uso desta pasta é:

1. Adicionar ou atualizar datasets em `datasets/`
2. Explorar e validar dados em `notebooks/`
3. Consolidar lógica em `scripts/`
4. Gerar arquivos finais em `outputs/`
5. Copiar os JSONs consolidados para o projeto principal

---

## 📊 Tipo de Processamento Realizado

Os scripts desta pasta são responsáveis por:

* Filtragem de jogos com volume mínimo de avaliações
* Conversão de avaliações em feedback implícito
* Cálculo de similaridade entre jogos
* Limitação e ordenação de vizinhos similares
* Preparação de metadados auxiliares (popularidade, categorias)

Nenhuma decisão de recomendação é tomada aqui — apenas **dados são preparados**.

---

## 🔒 Privacidade e Ética

* Nenhum dado pessoal do usuário do Playlite é utilizado
* Nenhuma identificação individual é preservada nos outputs
* O objetivo é extrair padrões agregados, não comportamentos individuais

---

## 📌 Observações

* A origem dos datasets será documentada futuramente
* Os arquivos em `outputs/` devem ser considerados artefatos versionáveis
* Esta pasta pode evoluir conforme novas estratégias forem testadas

Esta separação garante que o Playlite continue sendo um aplicativo **leve, rápido e previsível**, mesmo oferecendo
funcionalidades avançadas de recomendação.
