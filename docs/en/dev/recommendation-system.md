# Recommendation System

Playlite uses a **hybrid recommendation system**, combining information from the user's own library with global game
consumption patterns, while always respecting the **local-first** and **privacy-first** philosophy.

No personal user data is sent to external servers. All processing happens locally in the app or is precomputed offline.

## Overview of the Approach

The system combines two complementary strategies:

1. **Content-Based Filtering**
2. **Offline Collaborative Filtering**

These approaches are combined to generate relevant, stable, and explainable recommendations.

## 1. Content-Based Filtering

Content-based filtering analyzes only the user's library to build a **Preference Profile**.

It considers explicit and implicit signals such as:

* Games marked as favorites
* Personal ratings (1–5 stars)
* Playtime
* Genres, tags, and series associated with the games

These signals are converted into preference vectors that represent the user's taste.

### Local Scoring

Each game in the library receives a relevance weight based on simple and explainable heuristics:

* Favorites have a high weight
* Ratings influence the score moderately
* Playtime contributes as a complementary factor

Unplayed games or games without ratings do not distort the profile.

## 2. Offline Collaborative Filtering

Collaborative filtering is based on global consumption patterns extracted from public game rating datasets.

### Characteristics

* **Offline** processing, outside the app
* Based on **~25 million interactions** processed from public Steam datasets
* Uses **implicit feedback** (positive ratings filtered by playtime)
* Similarity is calculated between games, not between users

The result is a set of relationships such as:

> "Players who liked X also liked Y"

This data is exported to a JSON file and distributed with the app.

## 3. Combining the Strategies (Hybrid Model)

During recommendation, Playlite combines the two signals:

* The **user profile** determines which games in the library are the best representation of the user's taste
* **Collaborative filtering** suggests games similar to those titles

In simplified form:

```text
final_score =
   α * content_based_score +
   β * collaborative_score
```

Where `α` and `β` are adjustable weights.

## 4. Business Rules

After the mathematical scoring, additional rules ensure a better experience:

* Penalty for excessively popular games
* Genre and style diversity
* Removal of repetitive suggestions

## 5. Explainability

Recommendations are accompanied by deterministic explanations based on structured data:

* Shared genres
* Relevant tags
* Favorite series

This ensures transparency and removes the need for LLMs to explain recommendations.

## Benefits of the Approach

* Works 100% offline
* Preserves user privacy
* Scales well for large libraries
* Easy to maintain and evolve
* Suitable for a local-first desktop app

---

This system was designed to balance **recommendation quality**, **technical simplicity**, and **user control**.

