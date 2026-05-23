# Technical Architecture

This document describes the engineering behind **Playlite**. The project follows a **Local-First** philosophy,
prioritizing native performance, privacy, and offline operation.

## Overview

The system is a hybrid:

1. **Frontend (UI):** A lightweight React SPA responsible for presentation and view state.
2. **Backend (Host):** A Rust binary managed by Tauri, responsible for business logic, persistence, and integrations.

```text
+-------------------+            +----------------------+
|    React UI       |            |    Rust Backend      |
|   (Frontend)      |            |      (Core)          |
+-------------------+            +----------------------+
         |                                  |
         | Invoke (IPC)                     |
         v                                  v
+-------------------+            +----------------------+
|   Command Layer   | <--------> |    Service Layer     |
|                   |            |   (Business Logic)   |
+-------------------+            +----------------------+
         |                                  |
         v                                  v
                    +----------------------+
                    |      Data Layer      |
                    |   (SQLite / Models)   |
                    +----------------------+
                              |
                              v
                       +----------------+
                       |   library.db   |
                       +----------------+
```

## Project Layers (Backend)

The Rust backend is more than just glue to the database. It follows a layered architecture (3-tier) to ensure
maintainability and testability.

### 1. Command Layer (commands/)

This is the entry point. It exposes functions to the frontend through the `#[tauri::command]` macro.

**Responsibility:** Receive UI input, validate data, and call services.

**Example:** The `get_user_profile` command receives the request, fetches raw data, and passes it to the recommendation
engine.

### 2. Service Layer (services/)

This is where the pure business logic lives, independent of the user interface.

**Responsibility:** Complex algorithms, score calculations, Steam data normalization.

**Example:** The `recommendation::calculate_user_profile` module receives a list of games and returns weighted
statistics, without knowing that a database or UI exists.

### 3. Data Layer (database/ & models/)

State management and persistence.

**Technology:** Embedded SQLite (via `rusqlite`) with WAL (Write-Ahead Logging) mode for performance.

**Security:** The connection is protected by a `Mutex` inside Tauri's `AppState`, ensuring safe access in a
multithreaded environment.

## Data Structure

The heart of the system is the `Game` struct, which mirrors the main table in the database.

```rust
pub struct Game {
  pub id: String,          // Steam AppID or UUID
  pub name: String,
  pub genre: String,
  pub platform: String,    // "Steam", "Epic", "GOG"
  pub playtime: i32,       // Minutes
  pub rating: i32,         // 0-5
  pub favorite: bool,
}
```

**Note:** The types are mirrored in the frontend (TypeScript) to ensure end-to-end type safety.

## Critical Flows

### 1. Initialization

When the app opens:

1. Rust initializes SQLite in `app_data_dir`.
2. It runs migrations (table creation) if necessary.
3. The frontend mounts and calls `invoke('get_games')`.

### 2. Recommendation System

The system uses classic machine learning (content-based filtering).

1. **Extraction:** Fetch games and their features (genre, tags).
2. **Vectorization:** Convert user preferences into mathematical vectors.
3. **Calculation:** Apply cosine similarity or weighted heuristics (for example, Favorite = +50 pts, Playtime = +2 pts).

Full details in: [Recommendation System](recommendation-system.md).

## Frontend (React)

The frontend uses Vite and Tailwind CSS v4.

**State:** Managed locally (React Context/State) for speed, with a "single source of truth" coming from the backend.

**Integration:** Uses the `window.__TAURI__.core` bridge for communication.

## Design Decisions

| Decision         | Reason                                                                                              |
|------------------|-----------------------------------------------------------------------------------------------------|
| Local SQLite     | Full privacy and zero dependency on servers.                                                        |
| Rust for Logic   | JavaScript is kept for rendering only, ensuring heavy algorithms (like recommendations) run natively. |
| Tauri v2         | Lower RAM usage compared to Electron and better security.                                           |

