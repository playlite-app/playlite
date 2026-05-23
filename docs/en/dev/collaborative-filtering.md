# Offline Collaborative Filtering

This document describes the **item-based collaborative filtering** strategy used by Playlite.

Unlike traditional systems that calculate recommendations in real time by comparing users against each other, Playlite
uses a **precomputed** model distributed together with the app.

## Motivation

The choice to use an offline approach was motivated by:

* Preservation of user privacy
* Operation without internet dependency
* Architectural simplicity
* Predictable performance in a desktop environment

## Type of Collaborative Filtering

The system uses **Item-based Collaborative Filtering**, where:

* Each game is treated as an entity
* Similarity is calculated between games
* Users serve only as a statistical signal

This approach is more stable than user-based CF on large and sparse datasets.

## Data Source

The recommendation system is powered by the **Game Recommendations on Steam** dataset,
which contains real interactions from Steam platform users, including:

- Ratings and reviews
- Relationships between users and games

### Dataset Information

| Property   | Value                                                                                 |
|------------|---------------------------------------------------------------------------------------|
| **Name**   | Game Recommendations on Steam                                                         |
| **Author** | Anton Kozyriev                                                                        |
| **Source**  | [Kaggle](https://www.kaggle.com/datasets/antonkozyriev/game-recommendations-on-steam) |
| **DOI**    | [10.34740/KAGGLE/DS/2871694](https://doi.org/10.34740/KAGGLE/DS/2871694)              |
| **License** | CC0: Public Domain                                                                    |
| **Size**   | ~2.24 GB                                                                              |
| **Period** | Data up to 2023                                                                       |

### Data Structure

The dataset includes the following main tables:

- `recommendations.csv` - User reviews
- `games.csv` - Game metadata
- `users.csv` - User information (anonymized)

### Academic Citation

```
Kozyriev, A. (2023). Game Recommendations on Steam [Data set]. 
Kaggle. https://doi.org/10.34740/KAGGLE/DS/2871694
```

### Preprocessing and Cleaning

To avoid the "Cold Start" problem and ensure recommendation relevance, the raw dataset is filtered before training.
The following are removed:

1. **Low-Quality Games:** Titles with less than 70% approval.
2. **Extreme Niche Games:** Titles with fewer than 100 reviews (to avoid bias from a small number of users).
3. **User Noise:** Accounts with insignificant playtime (< 2 hours).

The final result is a subset of **~14,000 games** with high relevance, representing about 28% of the original catalog
while preserving most meaningful interactions.

## Data Representation

Each game is represented by a binary vector:

```text
Game A = [1, 0, 1, 1, 0, ...]
```

Where:

* `1` indicates that the user positively rated the game
* `0` indicates no positive rating

## Similarity Metric

Similarity between two games is calculated using **Cosine Similarity**:

```text
cos(A, B) = (A · B) / (||A|| × ||B||)
```

### Why This Choice

* Works well with binary data
* Handles sparse datasets better
* Reduces bias caused by extreme popularity
* Easy to explain and audit

## Filtering and Stabilization

To ensure recommendation quality, the following rules are applied:

* Removal of games with very few ratings
* Limiting the number of similar neighbors (Top-K)
* Penalty for excessively popular games

These heuristics prevent unstable or obvious recommendations.

## Generating the Final File

The processing result is a JSON file containing:

* List of similar games for each game
* Scores normalized between 0 and 1
* Auxiliary metadata (popularity, categories)

This file is consumed directly by the Rust backend.

## Integration with the Hybrid Model

Collaborative filtering does not decide the final recommendation on its own.

During app runtime:

* The user profile determines the weight of each game in the library
* Collaborative filtering suggests related games
* The scores are combined with content-based filtering

This ensures personalized recommendations without compromising privacy.

## Known Limitations

* Very recent games may not appear
* Recommendations depend on dataset quality
* Temporal user context is not considered

These limitations are acceptable within the local-first proposal.

---

This model was chosen because it balances **quality**, **simplicity**, and **user control**, making it suitable for an
offline desktop application.

