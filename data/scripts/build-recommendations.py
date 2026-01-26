"""
build_recommendations.py - Agregação de recomendações para o Playlite

Este script combina:
- Similaridade item-item (collaborative filtering offline)
- Preferências locais do usuário (favoritos, ratings, horas)

Gera recomendações em dois modos:
- purchase: jogos para comprar (exclui jogos já possuídos)
- backlog: jogos da biblioteca para jogar agora

Entrada:
- data/processed/similarity_raw.parquet
- data/local/user_library.parquet (mock / futuro SQLite export)

Saída:
- data/processed/recommendations_purchase.parquet
- data/processed/recommendations_backlog.parquet
"""

from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent
PROCESSED_DIR = DATA_DIR / "processed"
LOCAL_DIR = DATA_DIR / "local"

# Parâmetros
TOP_N = 50

# Pesos (podem ser ajustados depois)
W_FAVORITE = 1.0
W_RATING = 0.6
W_HOURS = 0.4

# Limite máximo de horas para normalização
MAX_HOURS_CAP = 50.0


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def load_similarity():
    log("Carregando similaridades...")
    df = pd.read_parquet(PROCESSED_DIR / "similarity_raw.parquet")
    return df


def load_user_library():
    """
    Estrutura esperada (mock inicial):
    user_id | app_id | is_favorite | rating | hours | status
    """
    log("Carregando biblioteca do usuário...")
    return pd.read_parquet(LOCAL_DIR / "user_library.parquet")


def build_user_profiles(library_df):
    """
    Constrói sinais do usuário por jogo
    """
    df = library_df.copy()

    df["rating_norm"] = df["rating"].fillna(0).apply(
        lambda r: (r - 1) / 4 if r > 0 else 0
    )

    df["hours_norm"] = np.minimum(df["hours"] / MAX_HOURS_CAP, 1.0)

    df["user_signal"] = (
            W_FAVORITE * df["is_favorite"].astype(float)
            + W_RATING * df["rating_norm"]
            + W_HOURS * df["hours_norm"]
    )

    return df[["user_id", "app_id", "user_signal", "status"]]


def aggregate_scores(sim_df, user_profiles):
    """
    Junta similaridades com sinais do usuário
    """
    log("Agregando scores...")

    merged = sim_df.merge(
        user_profiles,
        left_on="app_id",
        right_on="app_id",
        how="inner"
    )

    merged["score"] = merged["final_score"] * merged["user_signal"]

    aggregated = (
        merged
        .groupby(["user_id", "similar_app_id"], as_index=False)
        .agg(
            score=("score", "sum"),
            contributing_games=("app_id", "count")
        )
        .rename(columns={"similar_app_id": "app_id"})
    )

    return aggregated


def filter_by_mode(recommendations, library_df, mode):
    owned = set(library_df["app_id"].unique())

    if mode == "purchase":
        log("Aplicando filtro: remover jogos já possuídos")
        recommendations = recommendations[
            ~recommendations["app_id"].isin(owned)
        ]

    elif mode == "backlog":
        log("Aplicando filtro: manter apenas jogos da biblioteca")
        recommendations = recommendations[
            recommendations["app_id"].isin(owned)
        ]

        # Opcional: priorizar não iniciados / abandonados
        status_map = (
            library_df[["app_id", "status"]]
            .drop_duplicates()
            .set_index("app_id")["status"]
        )

        recommendations["status"] = recommendations["app_id"].map(status_map)
        recommendations = recommendations[
            recommendations["status"].isin(["not_started", "dropped"])
        ]

    return recommendations


def build_recommendations(mode: str):
    assert mode in {"purchase", "backlog"}

    log(f"Iniciando recomendações - modo: {mode}")

    sim_df = load_similarity()
    library_df = load_user_library()
    user_profiles = build_user_profiles(library_df)

    recommendations = aggregate_scores(sim_df, user_profiles)
    recommendations = filter_by_mode(recommendations, library_df, mode)

    recommendations = (
        recommendations
        .sort_values(["user_id", "score"], ascending=[True, False])
        .groupby("user_id")
        .head(TOP_N)
        .reset_index(drop=True)
    )

    output = PROCESSED_DIR / f"recommendations_{mode}.parquet"
    recommendations.to_parquet(output, index=False, compression="snappy")

    log(f"Recomendações salvas em: {output}")
    log(f"Total de entradas: {len(recommendations):,}")

    return recommendations


def main():
    build_recommendations("purchase")
    print()
    build_recommendations("backlog")


if __name__ == "__main__":
    main()
