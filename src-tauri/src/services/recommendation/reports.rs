//! Exportação de Relatórios de Análise de Recomendações
//!
//! Este módulo contém funções para exportar relatórios de análise em diferentes formatos
//! (JSON, TXT, CSV). Separado do módulo de análise para manter responsabilidades distintas.

use super::analysis::{DetailedScoreBreakdown, RecommendationAnalysisReport};
use std::fs::File;
use std::io::Write;

// === EXPORTAÇÃO DE RELATÓRIOS ===

/// Exporta relatório em formato JSON
pub fn export_report_json(
    report: &RecommendationAnalysisReport,
    filename: &str,
) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(report)?;
    let mut file = File::create(filename)?;
    file.write_all(json.as_bytes())?;
    Ok(())
}

/// Exporta relatório em formato TXT legível
pub fn export_report_txt(
    report: &RecommendationAnalysisReport,
    filename: &str,
) -> std::io::Result<()> {
    let mut file = File::create(filename)?;

    write_header(&mut file)?;
    write_metadata(&mut file, report)?;
    write_configuration(&mut file, report)?;
    write_statistics(&mut file, report)?;
    write_user_profile(&mut file, report)?;
    write_tag_influence(&mut file, report)?;
    write_genre_influence(&mut file, report)?;
    write_reason_distribution(&mut file, report)?;
    write_top_games(&mut file, report)?;

    Ok(())
}

/// Exporta apenas os jogos em formato CSV
pub fn export_games_csv(games: &[DetailedScoreBreakdown], filename: &str) -> std::io::Result<()> {
    let mut file = File::create(filename)?;

    // Header
    writeln!(
        file,
        "Rank,Title,Final Score,Affinity,Context,Diversity,Genre,Tag,Series,CB Total,CF,Age Penalty,Reason"
    )?;

    // Dados
    for game in games {
        writeln!(
            file,
            "{},{},{:.4},{:.2},{:.2},{:.2},{:.2},{:.2},{:.2},{:.2},{:.2},{:.4},{}",
            game.final_rank,
            game.game_title.replace(",", ";"),
            game.final_score,
            game.affinity_score,
            game.context_score,
            game.diversity_score,
            game.genre_score,
            game.tag_score,
            game.series_score,
            game.total_cb,
            game.total_cf,
            game.age_penalty,
            game.reason_label.replace(",", ";")
        )?;
    }

    Ok(())
}

// === FUNÇÕES AUXILIARES DE ESCRITA ===

fn write_header(file: &mut File) -> std::io::Result<()> {
    writeln!(
        file,
        "================================================================================"
    )?;
    writeln!(
        file,
        "RELATÓRIO DE ANÁLISE DE RECOMENDAÇÕES - PLAYLITE v4.0"
    )?;
    writeln!(
        file,
        "================================================================================"
    )?;
    writeln!(file)?;
    Ok(())
}

fn write_metadata(file: &mut File, report: &RecommendationAnalysisReport) -> std::io::Result<()> {
    writeln!(file, "Timestamp: {}", report.timestamp)?;
    writeln!(file, "Total de jogos analisados: {}", report.total_games)?;
    writeln!(file)?;
    Ok(())
}

fn write_configuration(
    file: &mut File,
    report: &RecommendationAnalysisReport,
) -> std::io::Result<()> {
    writeln!(file, "📊 CONFIGURAÇÕES")?;
    writeln!(
        file,
        "--------------------------------------------------------------------------------"
    )?;
    writeln!(file, "Content Weight: {:.2}", report.config.content_weight)?;
    writeln!(
        file,
        "Collaborative Weight: {:.2}",
        report.config.collaborative_weight
    )?;
    writeln!(file, "Age Decay: {:.2}", report.config.age_decay)?;
    writeln!(file, "Favor Series: {}", report.config.favor_series)?;
    writeln!(
        file,
        "Filter Adult Content: {}",
        report.user_settings.filter_adult_content
    )?;
    writeln!(file, "Series Limit: {}", report.user_settings.series_limit)?;
    writeln!(file)?;
    Ok(())
}

fn write_statistics(file: &mut File, report: &RecommendationAnalysisReport) -> std::io::Result<()> {
    writeln!(file, "📈 ESTATÍSTICAS GERAIS")?;
    writeln!(
        file,
        "--------------------------------------------------------------------------------"
    )?;
    writeln!(
        file,
        "Score Final Médio: {:.4}",
        report.stats.avg_final_score
    )?;
    writeln!(
        file,
        "Score Final Mediana: {:.4}",
        report.stats.median_final_score
    )?;
    writeln!(
        file,
        "Score Final Máximo: {:.4}",
        report.stats.max_final_score
    )?;
    writeln!(
        file,
        "Score Final Mínimo: {:.4}",
        report.stats.min_final_score
    )?;
    writeln!(file)?;
    writeln!(
        file,
        "CB Médio: {:.2}  |  CF Médio: {:.2}",
        report.stats.avg_cb_score, report.stats.avg_cf_score
    )?;
    writeln!(file)?;
    writeln!(
        file,
        "Affinity Médio: {:.2}  ({:.1}%)",
        report.stats.avg_affinity_score, report.stats.affinity_proportion
    )?;
    writeln!(
        file,
        "Context Médio: {:.2}  ({:.1}%)",
        report.stats.avg_context_score, report.stats.context_proportion
    )?;
    writeln!(
        file,
        "Diversity Médio: {:.2}  ({:.1}%)",
        report.stats.avg_diversity_score, report.stats.diversity_proportion
    )?;
    writeln!(file)?;
    writeln!(
        file,
        "Genre Score Médio: {:.2}  ({:.1}%)",
        report.stats.avg_genre_score, report.stats.genre_proportion
    )?;
    writeln!(file, "Tag Score Médio: {:.2}", report.stats.avg_tag_score)?;
    writeln!(
        file,
        "Series Score Médio: {:.2}",
        report.stats.avg_series_score
    )?;
    writeln!(
        file,
        "Age Penalty Médio: {:.4}",
        report.stats.avg_age_penalty
    )?;
    writeln!(file)?;
    Ok(())
}

fn write_user_profile(
    file: &mut File,
    report: &RecommendationAnalysisReport,
) -> std::io::Result<()> {
    writeln!(file, "👤 PERFIL DO USUÁRIO")?;
    writeln!(
        file,
        "--------------------------------------------------------------------------------"
    )?;
    writeln!(
        file,
        "Total de gêneros no perfil: {}",
        report.profile_stats.total_genres
    )?;
    writeln!(
        file,
        "Total de tags no perfil: {}",
        report.profile_stats.total_tags
    )?;
    writeln!(
        file,
        "Total de séries no perfil: {}",
        report.profile_stats.total_series
    )?;
    writeln!(file)?;

    if !report.profile_stats.top_genres.is_empty() {
        writeln!(file, "Top 10 Gêneros no Perfil:")?;
        for (idx, (genre, weight)) in report.profile_stats.top_genres.iter().enumerate() {
            writeln!(file, "  {}. {} - peso: {:.2}", idx + 1, genre, weight)?;
        }
        writeln!(file)?;
    }

    if !report.profile_stats.top_tags.is_empty() {
        writeln!(file, "Top 20 Tags no Perfil:")?;
        for (idx, (slug, key, weight)) in report.profile_stats.top_tags.iter().enumerate() {
            writeln!(
                file,
                "  {}. {} ({}) - peso: {:.2}",
                idx + 1,
                slug,
                key,
                weight
            )?;
        }
        writeln!(file)?;
    }
    Ok(())
}

fn write_tag_influence(
    file: &mut File,
    report: &RecommendationAnalysisReport,
) -> std::io::Result<()> {
    writeln!(file, "🏷️  TOP TAGS POR INFLUÊNCIA")?;
    writeln!(
        file,
        "--------------------------------------------------------------------------------"
    )?;
    for (idx, (_, tag)) in report.tag_influence.iter().take(20).enumerate() {
        writeln!(file, "{}. {} ({})", idx + 1, tag.tag_name, tag.category)?;
        writeln!(
            file,
            "   Jogos: {}  |  Avg: {:.2}  |  Max: {:.2}  |  Razão principal: {} vezes",
            tag.games_count, tag.avg_contribution, tag.max_contribution, tag.times_as_reason
        )?;
    }
    writeln!(file)?;
    Ok(())
}

fn write_genre_influence(
    file: &mut File,
    report: &RecommendationAnalysisReport,
) -> std::io::Result<()> {
    writeln!(file, "🎮 TOP GÊNEROS POR INFLUÊNCIA")?;
    writeln!(
        file,
        "--------------------------------------------------------------------------------"
    )?;
    for (idx, (name, genre)) in report.genre_influence.iter().take(10).enumerate() {
        writeln!(file, "{}. {}", idx + 1, name)?;
        writeln!(
            file,
            "   Jogos: {}  |  Avg: {:.2}  |  Max: {:.2}  |  Razão principal: {} vezes",
            genre.games_count,
            genre.avg_contribution,
            genre.max_contribution,
            genre.times_as_reason
        )?;
    }
    writeln!(file)?;
    Ok(())
}

fn write_reason_distribution(
    file: &mut File,
    report: &RecommendationAnalysisReport,
) -> std::io::Result<()> {
    writeln!(file, "📊 DISTRIBUIÇÃO DE RAZÕES")?;
    writeln!(
        file,
        "--------------------------------------------------------------------------------"
    )?;
    let mut reasons: Vec<_> = report.reason_distribution.iter().collect();
    reasons.sort_by(|a, b| b.1.cmp(a.1));
    for (reason, count) in reasons {
        let percentage = (*count as f32 / report.total_games as f32) * 100.0;
        writeln!(file, "{}: {} ({:.1}%)", reason, count, percentage)?;
    }
    writeln!(file)?;
    Ok(())
}

fn write_top_games(file: &mut File, report: &RecommendationAnalysisReport) -> std::io::Result<()> {
    writeln!(file, "🎯 TOP 50 JOGOS RECOMENDADOS")?;
    writeln!(
        file,
        "================================================================================"
    )?;
    for game in report.games.iter().take(50) {
        writeln!(file)?;
        writeln!(file, "#{} - {}", game.final_rank, game.game_title)?;
        writeln!(
            file,
            "   Score Final: {:.4}  |  CB: {:.2}  |  CF: {:.2}",
            game.final_score, game.total_cb, game.total_cf
        )?;
        writeln!(
            file,
            "   Affinity: {:.2}  |  Context: {:.2}  |  Diversity: {:.2}",
            game.affinity_score, game.context_score, game.diversity_score
        )?;
        writeln!(
            file,
            "   Genre: {:.2}  |  Tag: {:.2}  |  Series: {:.2}  |  Age Penalty: {:.4}",
            game.genre_score, game.tag_score, game.series_score, game.age_penalty
        )?;
        writeln!(file, "   Razão: {}", game.reason_label)?;

        if !game.top_genres.is_empty() {
            write!(file, "   Top Gêneros: ")?;
            for (i, (genre, score)) in game.top_genres.iter().enumerate() {
                if i > 0 {
                    write!(file, ", ")?;
                }
                write!(file, "{} ({:.1})", genre, score)?;
            }
            writeln!(file)?;
        }

        if !game.top_affinity_tags.is_empty() {
            write!(file, "   Top Tags (Affinity): ")?;
            for (i, (tag, score)) in game.top_affinity_tags.iter().take(5).enumerate() {
                if i > 0 {
                    write!(file, ", ")?;
                }
                write!(file, "{} ({:.1})", tag, score)?;
            }
            writeln!(file)?;
        }
        writeln!(file)?;
    }

    Ok(())
}
