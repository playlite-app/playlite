# Architecture Decision Record (ADR)

This document records the main architectural decisions of the **Game Manager** project, explaining the context and
reasoning behind each technical choice.

---

## 1. Project Goal

Build a desktop application for managing a game library, focused on:

- Real personal use
- Learning modern technologies
- Showcasing full-stack skills as a portfolio project

---

## 2. Platform and General Architecture

**Decision:** Cross-platform desktop application using Tauri.

**Motivation:**

- Better performance and lower memory usage compared to Electron
- Use of Rust in the backend for learning purposes and security
- Natural integration with a modern web frontend

**Consequences:**

- Steeper learning curve with Rust
- More complex build pipeline, but more efficient output

---

## 3. Frontend

**Decision:** React with TypeScript.

**Motivation:**

- Already familiar stack
- Mature ecosystem
- Easy to maintain and scale

---

### 3.1 Frontend Organization for a Desktop Application

**Decision:** Adopt a hybrid structure in the frontend, organized by technical layers (components, hooks,
services, types) with domain-based grouping.

**Context:** Although the frontend uses React, the project is a desktop app built with Tauri. Overusing patterns
typical of web applications (e.g. many generic modals) started to create complexity as the project grew.

**Motivation:**

- Align the frontend structure with the mental model of desktop applications
- Make the codebase easier to navigate and maintain
- Reduce unnecessary complexity

---

## 4. Local Backend

**Decision:** Local backend in Rust (Tauri commands).

**Motivation:**

- Local data processing
- Avoid dependency on external services
- Better user privacy

---

## 5. Data Persistence

**Decision:** Local database (e.g. SQLite).

**Motivation:**

- Simplicity
- Portability
- Well-suited for a desktop application

---

## 6. Credential and Sensitive Data Security

**Decision:** Store API credentials in an AES-256 encrypted SQLite database, but without slow key derivation
(Argon2), opting for a less secure but faster and more practical approach for this project's context.

**Context:**
The project needs to persist API credentials to function correctly.

**Alternatives considered:**

1. **Symmetric encryption (AES-256) with key derivation (Argon2)**

- Implemented experimentally.
- Used deliberately slow key derivation to mitigate brute-force attacks.

2. **OS keyring/credential store**

- Evaluated as the most appropriate solution for commercial desktop applications.
- Failed due to lack of code signing and/or app reputation; the system refused to store the credentials.

---

## 7. Game Recommendation Strategy

### 7.1 Content-Based Filtering

**Decision:** Simple rules and filters based on metadata.

Signals considered:

- Most-played genres
- Favorite tags
- Playtime
- User ratings

**Motivation:**

- Low computational cost
- Fast and explainable results
- No need for external datasets

---

### 7.2 Offline Collaborative Filtering

**Decision:** Item-Based Collaborative Filtering using implicit feedback (positive ratings), pre-computed
offline with Python. Uses public datasets, with static artifacts distributed alongside the application.

Algorithm chosen:

- Cosine similarity

**Motivation:**

- Moderate computational cost
- Potentially more accurate results

**Consequences:**

- Requires feature engineering
- Needs a minimum data volume

---

### 7.3 Recommendation Explanations

**Decision:** Recommendation explanations are generated deterministically, without the use of LLMs.

**Motivation:**

- Recommendation reasons are directly derived from structured data (genres, tags, series).
- Avoids dependency on external APIs or local models.
- Guarantees fast, predictable, and offline explanations.

**Consequences:**

- Lower complexity
- Greater transparency
- Better alignment with the local-first philosophy

---

## 8. Infrastructure and DevOps

**Decision:** Local project, with no mandatory cloud dependency.

**Motivation:**

- Desktop application
- Reduces costs
- Simplicity

**Note:** Future experiments may include cloud services for:

- Synchronization

---

## 9. AI-Powered Auto-Translation

**Decision:** Use Gemini to translate game descriptions.

**Motivation:** Improve the user experience within the application, as well as explore LLM integration in
meaningful app features.

**Alternatives considered:**

1. No automatic translation

- Simplicity
- Lower cost
- Inferior user experience

2. Traditional translation services (e.g. Google Translate API, DeepL)

- Higher cost
- Usage limitations for large libraries
- Requires credit card registration and additional complexity

**Consequences:**

- Controlled cost with moderate usage
- Significant improvement in end-user experience

---

## 10. Documentation and Open Source

**Decision:** Lean documentation on GitHub (README, CONTRIBUTING, ADR).

**Motivation:**

- Focus on clarity
- Avoid maintenance overhead
- Demonstrate good open source project practices

---

## 11. Status

This ADR reflects the current state of architectural decisions and may evolve as the project grows.
