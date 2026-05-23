# AI-Assisted Development

Playlite was developed using an *AI-assisted development* process, where artificial intelligence tools were used as
support during the creation of the project.

The use of AI aimed to speed up development, explore implementation alternatives, and make it easier to learn new
technologies, without replacing critical analysis, tests, or human decisions.

## Principles of Use

AI tools were used according to a few clear principles:

- AI as a **support tool**, not an autonomous agent
- All final architecture and implementation decisions are human decisions
- Generated code was reviewed, tested, adjusted, and manually integrated
- The author takes full responsibility for the final code

No prompt logs or response logs were kept, because AI use was continuous, iterative, and exploratory throughout the
whole development process.

## Tools Used

The main AI tools used in the project were:

- **Gemini 3 Pro**  
  Used mainly for initial code generation, low-fidelity prototyping, and idea exploration in Rust and React.

- **Claude Sonnet**  
  Used as an auxiliary tool for code generation and analysis, including Python scripts for the collaborative filtering
  system.

- **ChatGPT**  
  Used mainly to support documentation, analyze technical suggestions, and evaluate architecture alternatives.

- **GitHub Copilot (RustRover)**  
  Used as an IDE-integrated tool for autocomplete, small fixes, code formatting, and static analysis.

## Limits of AI Use

AI tools were **not** responsible for:

- running or validating builds
- testing the code
- integrating components between Rust, Tauri, and React
- validating business rules
- making final architecture decisions

These steps were done manually.

## Learning and Responsibility

The use of AI in Playlite was part of an active learning process, especially in:

- Rust (ownership, lifetimes, async, module organization)
- Integration between React frontend and Rust backend via Tauri
- Local-first architecture and persistence with SQLite
- Modeling and applying recommendation systems

The goal was not only to produce working code, but to deeply understand how the entire system works.

