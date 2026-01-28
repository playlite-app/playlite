# Desenvolvimento Assistido por IA

O Playlite foi desenvolvido utilizando um processo de *AI-assisted development*, no qual ferramentas de Inteligência
Artificial foram usadas como apoio durante a criação do projeto.

O uso de IA teve como objetivo acelerar o desenvolvimento, explorar alternativas de implementação e facilitar o
aprendizado de novas tecnologias, sem substituir a análise crítica, os testes e as decisões humanas.

---

## Princípios de Uso

As ferramentas de IA foram utilizadas seguindo alguns princípios claros:

- IA como **ferramenta de apoio**, não como agente autônomo
- Todas as decisões finais de arquitetura e implementação são humanas
- O código gerado foi revisado, testado, ajustado e integrado manualmente
- O autor assume total responsabilidade pelo código final

Não foram utilizados logs de prompts ou respostas, pois o uso de IA foi contínuo, iterativo e exploratório ao longo de
todo o desenvolvimento.

---

## Ferramentas Utilizadas

As principais ferramentas de IA utilizadas no projeto foram:

- **Gemini 3 Pro**  
  Utilizado principalmente para geração inicial de código, prototipagem de baixa fidelidade e exploração de ideias em
  Rust e React.

- **Claude Sonnet**  
  Utilizado como ferramenta auxiliar para geração e análise de código, incluindo scripts em Python para o sistema de
  filtragem colaborativa.

- **ChatGPT**  
  Utilizado principalmente para apoio à documentação, análise de sugestões técnicas e avaliação de alternativas de
  arquitetura.

- **GitHub Copilot (RustRover)**  
  Utilizado como ferramenta integrada à IDE para autocomplete, correções pontuais, formatação de código e análise
  estática.

---

## Limites do Uso de IA

As ferramentas de IA **não** foram responsáveis por:

- executar ou validar builds
- testar o código
- integrar componentes entre Rust, Tauri e React
- validar regras de negócio
- tomar decisões finais de arquitetura

Essas etapas foram realizadas manualmente.

---

## Aprendizado e Responsabilidade

O uso de IA no Playlite fez parte de um processo ativo de aprendizado, especialmente em:

- Rust (ownership, lifetimes, async, organização de módulos)
- Integração entre frontend React e backend Rust via Tauri
- Arquitetura local-first e persistência com SQLite
- Modelagem e aplicação de sistemas de recomendação

O objetivo não foi apenas produzir código funcional, mas compreender profundamente o funcionamento do sistema todo.
