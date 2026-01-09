//! Lógica de negócios compartilhada para jogos.

/// Calcula o status do jogo baseado no tempo jogado (em minutos).
///
/// # Regras
/// - 0 min: **backlog**
/// - < 2h (120 min): **abandoned** (testou e parou)
/// - < 30h (1800 min): **playing**
/// - > 30h: **completed**
pub fn calculate_status(playtime_minutes: i32) -> String {
    if playtime_minutes == 0 {
        "backlog".to_string()
    } else if playtime_minutes < 120 {
        "abandoned".to_string()
    } else if playtime_minutes < 1800 {
        "playing".to_string()
    } else {
        "completed".to_string()
    }
}
