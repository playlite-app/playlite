//! Persistência dos dados do PCGamingWiki no banco SQLite local.
//!
//! Os dados são armazenados na tabela `pcgw_data` sem TTL — tratados como
//! características fixas do jogo e atualizados apenas por invalidação explícita
//! via [`invalidate_pcgw_data`].

use crate::models::PcgwData;
use rusqlite::{params, Connection};
use tracing::{info, warn};

/// Retorna os dados do PCGamingWiki armazenados para o jogo.
///
/// Retorna `None` se o jogo nunca foi buscado (fetched_at IS NULL ou linha inexistente).
/// Dados expirados **nunca** são descartados automaticamente — a invalidação é explícita.
pub fn get_pcgw_data(conn: &Connection, steam_app_id: &str) -> Option<PcgwData> {
    let result = conn.query_row(
        "SELECT
            steam_app_id,
            pcgw_page_id,
            pcgw_page_name,
            engine,
            available_on,

            dx_versions,
            vulkan_versions,
            opengl_versions,

            win64,
            linux64,
            macos_arm,
            macos_intel64,

            ray_tracing,
            upscaling,
            frame_gen,
            ultrawidescreen,
            four_k_support,
            hdr,
            high_fps,
            fov,
            borderless_windowed,
            color_blind,

            controller_support,
            full_controller,
            playstation_controllers,
            xinput_controllers,

            surround_sound,
            subtitles,
            closed_captions,

            has_save_data,
            has_config_data,

            languages_interface,
            languages_audio,
            languages_subtitles,

            fetched_at
         FROM pcgw_data
         WHERE steam_app_id = ?1
           AND fetched_at IS NOT NULL",
        params![steam_app_id],
        |row| {
            let parse_json_vec = |s: Option<String>| -> Option<Vec<String>> {
                s.and_then(|v| serde_json::from_str(&v).ok())
            };

            Ok(PcgwData {
                steam_app_id: row.get(0)?,
                pcgw_page_id: row.get(1)?,
                pcgw_page_name: row.get(2)?,
                engine: row.get(3)?,
                available_on: row.get(4)?,

                // API
                dx_versions: row.get(5)?,
                vulkan_versions: row.get(6)?,
                opengl_versions: row.get(7)?,

                win64: row.get(8)?,
                linux64: row.get(9)?,
                macos_arm: row.get(10)?,
                macos_intel64: row.get(11)?,

                // Video
                ray_tracing: row.get(12)?,
                upscaling: row.get(13)?,
                frame_gen: row.get(14)?,
                ultrawidescreen: row.get(15)?,
                four_k_support: row.get(16)?,
                hdr: row.get(17)?,
                high_fps: row.get(18)?,
                fov: row.get(19)?,
                borderless_windowed: row.get(20)?,
                color_blind: row.get(21)?,

                // Input
                controller_support: row.get(22)?,
                full_controller: row.get(23)?,
                playstation_controllers: row.get(24)?,
                xinput_controllers: row.get(25)?,

                // Audio
                surround_sound: row.get(26)?,
                subtitles: row.get(27)?,
                closed_captions: row.get(28)?,

                // Tags
                has_save_data: row.get(29)?,
                has_config_data: row.get(30)?,

                // L10n
                languages_interface: parse_json_vec(row.get(31)?),
                languages_audio: parse_json_vec(row.get(32)?),
                languages_subtitles: parse_json_vec(row.get(33)?),

                fetched_at: row.get(34)?,
            })
        },
    );

    match result {
        Ok(data) => Some(data),
        Err(rusqlite::Error::QueryReturnedNoRows) => None,
        Err(e) => {
            warn!("Erro ao buscar pcgw_data para {}: {}", steam_app_id, e);
            None
        }
    }
}

/// Salva ou atualiza os dados do PCGamingWiki para um jogo.
pub fn save_pcgw_data(conn: &Connection, data: &PcgwData) -> Result<(), String> {
    let serialize_vec = |v: &Option<Vec<String>>| -> Option<String> {
        v.as_ref().and_then(|list| serde_json::to_string(list).ok())
    };

    conn.execute(
        "INSERT OR REPLACE INTO pcgw_data (
            steam_app_id,
            pcgw_page_id,
            pcgw_page_name,
            engine,
            available_on,

            dx_versions,
            vulkan_versions,
            opengl_versions,

            win64,
            linux64,
            macos_arm,
            macos_intel64,

            ray_tracing,
            upscaling,
            frame_gen,
            ultrawidescreen,
            four_k_support,
            hdr,
            high_fps,
            fov,
            borderless_windowed,
            color_blind,

            controller_support,
            full_controller,
            playstation_controllers,
            xinput_controllers,

            surround_sound,
            subtitles,
            closed_captions,

            has_save_data,
            has_config_data,

            languages_interface,
            languages_audio,
            languages_subtitles,

            fetched_at
        ) VALUES (
            ?1,  ?2,  ?3,  ?4,  ?5,
            ?6,  ?7,  ?8,
            ?9,  ?10, ?11, ?12,
            ?13, ?14, ?15, ?16, ?17,
            ?18, ?19, ?20, ?21, ?22,
            ?23, ?24, ?25, ?26,
            ?27, ?28, ?29,
            ?30, ?31,
            ?32, ?33, ?34,
            ?35
        )",
        params![
            data.steam_app_id,
            data.pcgw_page_id,
            data.pcgw_page_name,
            data.engine,
            data.available_on,
            data.dx_versions,
            data.vulkan_versions,
            data.opengl_versions,
            data.win64,
            data.linux64,
            data.macos_arm,
            data.macos_intel64,
            data.ray_tracing,
            data.upscaling,
            data.frame_gen,
            data.ultrawidescreen,
            data.four_k_support,
            data.hdr,
            data.high_fps,
            data.fov,
            data.borderless_windowed,
            data.color_blind,
            data.controller_support,
            data.full_controller,
            data.playstation_controllers,
            data.xinput_controllers,
            data.surround_sound,
            data.subtitles,
            data.closed_captions,
            data.has_save_data,
            data.has_config_data,
            serialize_vec(&data.languages_interface),
            serialize_vec(&data.languages_audio),
            serialize_vec(&data.languages_subtitles),
            data.fetched_at,
        ],
    )
    .map_err(|e| format!("Erro ao salvar pcgw_data: {}", e))?;

    Ok(())
}

/// Invalida os dados de um jogo, forçando nova busca na próxima chamada.
///
/// Define `fetched_at = NULL` — a linha permanece no banco mas
/// `get_pcgw_data` ignora registros sem `fetched_at`.
pub fn invalidate_pcgw_data(conn: &Connection, steam_app_id: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE pcgw_data SET fetched_at = NULL WHERE steam_app_id = ?1",
        params![steam_app_id],
    )
    .map_err(|e| format!("Erro ao invalidar pcgw_data: {}", e))?;

    info!("pcgw_data invalidado para steam_app_id={}", steam_app_id);
    Ok(())
}
