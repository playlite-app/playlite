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
            steam_app_id, pcgw_page_id, pcgw_page_name, engine,
            linux_support, windows_support, macos_support,
            ray_tracing, dlss, fsr, xess, frame_generation,
            ultrawidescreen, four_k_support, hdr, high_fps, fov,
            borderless_windowed, color_blind,
            controller_support, full_controller,
            playstation_controllers, xinput_controllers,
            surround_sound, subtitles, closed_captions,
            win_min_os, win_min_cpu, win_min_ram, win_min_gpu,
            win_min_vram, win_min_dx, win_min_storage,
            win_rec_cpu, win_rec_ram, win_rec_gpu, win_rec_vram, win_rec_dx,
            linux_min_cpu, linux_min_ram, linux_min_gpu, linux_min_storage,
            linux_rec_cpu, linux_rec_ram, linux_rec_gpu,
            languages_interface, languages_audio, languages_subtitles,
            save_path_windows, save_path_linux,
            config_path_windows, config_path_linux,
            fetched_at
         FROM pcgw_data
         WHERE steam_app_id = ?1 AND fetched_at IS NOT NULL",
        params![steam_app_id],
        |row| {
            // Desserializa JSON arrays de idiomas
            let parse_langs = |s: Option<String>| -> Option<Vec<String>> {
                s.and_then(|v| serde_json::from_str(&v).ok())
            };

            Ok(PcgwData {
                steam_app_id: row.get(0)?,
                pcgw_page_id: row.get(1)?,
                pcgw_page_name: row.get(2)?,
                engine: row.get(3)?,
                linux_support: row.get(4)?,
                windows_support: row.get(5)?,
                macos_support: row.get(6)?,
                ray_tracing: row.get(7)?,
                dlss: row.get(8)?,
                fsr: row.get(9)?,
                xess: row.get(10)?,
                frame_generation: row.get(11)?,
                ultrawidescreen: row.get(12)?,
                four_k_support: row.get(13)?,
                hdr: row.get(14)?,
                high_fps: row.get(15)?,
                fov: row.get(16)?,
                borderless_windowed: row.get(17)?,
                color_blind: row.get(18)?,
                controller_support: row.get(19)?,
                full_controller: row.get(20)?,
                playstation_controllers: row.get(21)?,
                xinput_controllers: row.get(22)?,
                surround_sound: row.get(23)?,
                subtitles: row.get(24)?,
                closed_captions: row.get(25)?,
                win_min_os: row.get(26)?,
                win_min_cpu: row.get(27)?,
                win_min_ram: row.get(28)?,
                win_min_gpu: row.get(29)?,
                win_min_vram: row.get(30)?,
                win_min_dx: row.get(31)?,
                win_min_storage: row.get(32)?,
                win_rec_cpu: row.get(33)?,
                win_rec_ram: row.get(34)?,
                win_rec_gpu: row.get(35)?,
                win_rec_vram: row.get(36)?,
                win_rec_dx: row.get(37)?,
                linux_min_cpu: row.get(38)?,
                linux_min_ram: row.get(39)?,
                linux_min_gpu: row.get(40)?,
                linux_min_storage: row.get(41)?,
                linux_rec_cpu: row.get(42)?,
                linux_rec_ram: row.get(43)?,
                linux_rec_gpu: row.get(44)?,
                languages_interface: parse_langs(row.get(45)?),
                languages_audio: parse_langs(row.get(46)?),
                languages_subtitles: parse_langs(row.get(47)?),
                save_path_windows: row.get(48)?,
                save_path_linux: row.get(49)?,
                config_path_windows: row.get(50)?,
                config_path_linux: row.get(51)?,
                fetched_at: row.get(52)?,
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
    // Serializa Vec<String> de idiomas para JSON
    let serialize_langs = |v: &Option<Vec<String>>| -> Option<String> {
        v.as_ref().and_then(|list| serde_json::to_string(list).ok())
    };

    conn.execute(
        "INSERT OR REPLACE INTO pcgw_data (
            steam_app_id, pcgw_page_id, pcgw_page_name, engine,
            linux_support, windows_support, macos_support,
            ray_tracing, dlss, fsr, xess, frame_generation,
            ultrawidescreen, four_k_support, hdr, high_fps, fov,
            borderless_windowed, color_blind,
            controller_support, full_controller,
            playstation_controllers, xinput_controllers,
            surround_sound, subtitles, closed_captions,
            win_min_os, win_min_cpu, win_min_ram, win_min_gpu,
            win_min_vram, win_min_dx, win_min_storage,
            win_rec_cpu, win_rec_ram, win_rec_gpu, win_rec_vram, win_rec_dx,
            linux_min_cpu, linux_min_ram, linux_min_gpu, linux_min_storage,
            linux_rec_cpu, linux_rec_ram, linux_rec_gpu,
            languages_interface, languages_audio, languages_subtitles,
            save_path_windows, save_path_linux,
            config_path_windows, config_path_linux,
            fetched_at
        ) VALUES (
            ?1,  ?2,  ?3,  ?4,  ?5,  ?6,  ?7,  ?8,  ?9,  ?10,
            ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20,
            ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30,
            ?31, ?32, ?33, ?34, ?35, ?36, ?37, ?38, ?39, ?40,
            ?41, ?42, ?43, ?44, ?45, ?46, ?47, ?48, ?49, ?50,
            ?51, ?52, ?53
        )",
        params![
            data.steam_app_id,
            data.pcgw_page_id,
            data.pcgw_page_name,
            data.engine,
            data.linux_support,
            data.windows_support,
            data.macos_support,
            data.ray_tracing,
            data.dlss,
            data.fsr,
            data.xess,
            data.frame_generation,
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
            data.win_min_os,
            data.win_min_cpu,
            data.win_min_ram,
            data.win_min_gpu,
            data.win_min_vram,
            data.win_min_dx,
            data.win_min_storage,
            data.win_rec_cpu,
            data.win_rec_ram,
            data.win_rec_gpu,
            data.win_rec_vram,
            data.win_rec_dx,
            data.linux_min_cpu,
            data.linux_min_ram,
            data.linux_min_gpu,
            data.linux_min_storage,
            data.linux_rec_cpu,
            data.linux_rec_ram,
            data.linux_rec_gpu,
            serialize_langs(&data.languages_interface),
            serialize_langs(&data.languages_audio),
            serialize_langs(&data.languages_subtitles),
            data.save_path_windows,
            data.save_path_linux,
            data.config_path_windows,
            data.config_path_linux,
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
