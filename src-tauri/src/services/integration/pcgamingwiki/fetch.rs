//! Busca e montagem dos dados técnicos de um jogo no PCGamingWiki.
//!
//! Orquestra até 8 queries sequenciais à Cargo API, cobrindo as tabelas:
//! `Infobox_game`, `OS`, `Video_settings`, `Input`, `Audio_settings`,
//! `System_requirements` (Windows e Linux), `L10n` e `Game_data`.
//!
//! O rate limiting é aplicado automaticamente em cada query via
//! [`crate::services::integration::pcgamingwiki::client::cargo_query`].

use crate::errors::AppError;
use crate::models::PcgwData;
use crate::services::integration::pcgamingwiki::client::{build_http_client, cargo_query};
use crate::services::integration::pcgamingwiki::parsers::{
    extract_field, normalize_bool_field, parse_game_data_paths, parse_l10n_rows,
};
use chrono::Utc;
use tracing::{debug, info};

/// Busca todos os dados técnicos de um jogo no PCGamingWiki pelo Steam AppID.
///
/// Faz até 8 queries sequenciais (com delay entre elas) cobrindo todas as
/// tabelas Cargo relevantes. Retorna `None` se o jogo não for encontrado na PCGW.
///
/// # Erros
/// - `AppError::NetworkError` — falha de rede (sem internet, timeout, rate limit)
/// - `AppError::ParseError` — resposta inesperada da API
/// - `AppError::NotFound` — jogo não encontrado na PCGW pelo AppID fornecido
pub async fn fetch_pcgw_data(steam_app_id: &str) -> Result<PcgwData, AppError> {
    let client = build_http_client()?;
    debug!("Iniciando busca PCGW para steam_app_id={}", steam_app_id);

    // ------------------------------------------------------------------
    // 1. Infobox_game — resolve page_id, page_name e engine
    // ------------------------------------------------------------------
    let infobox_rows = cargo_query(
        &client,
        "Infobox_game",
        "Infobox_game._pageID=pageID,\
         Infobox_game._pageName=pageName,\
         Infobox_game.Engines=engine",
        &format!("Infobox_game.Steam_AppID HOLDS \"{}\"", steam_app_id),
    )
    .await?;

    if infobox_rows.is_empty() {
        return Err(AppError::NotFound(format!(
            "Jogo com Steam AppID {} não encontrado no PCGamingWiki",
            steam_app_id
        )));
    }

    let page_id = extract_field(&infobox_rows, "pageID").ok_or_else(|| {
        AppError::ParseError("pageID ausente na resposta da Infobox_game".to_string())
    })?;

    let page_name = extract_field(&infobox_rows, "pageName");
    let engine = extract_field(&infobox_rows, "engine");

    info!(
        "PCGW: jogo encontrado — page_id={}, name={:?}",
        page_id, page_name
    );

    // Filtro por page_id usado nas demais queries
    let page_filter = format!("_pageID=\"{}\"", page_id);

    // ------------------------------------------------------------------
    // 2. OS — suporte a sistemas operacionais
    // ------------------------------------------------------------------
    let os_rows = cargo_query(
        &client,
        "OS",
        "OS.Windows=windows,OS.Linux=linux,OS.macOS=macos",
        &page_filter,
    )
    .await?;

    let windows_support = normalize_bool_field(extract_field(&os_rows, "windows"));
    let linux_support = normalize_bool_field(extract_field(&os_rows, "linux"));
    let macos_support = normalize_bool_field(extract_field(&os_rows, "macos"));

    // ------------------------------------------------------------------
    // 3. Video_settings — gráficos, display e acessibilidade visual
    // ------------------------------------------------------------------
    let video_rows = cargo_query(
        &client,
        "Video_settings",
        "Video_settings.Ray_tracing=ray_tracing,\
         Video_settings.DLSS=dlss,\
         Video_settings.FSR=fsr,\
         Video_settings.XeSS=xess,\
         Video_settings.Frame_generation=frame_gen,\
         Video_settings.Ultrawidescreen=ultrawide,\
         Video_settings.4K_Ultra_HD=four_k,\
         Video_settings.HDR=hdr,\
         Video_settings.120_FPS=high_fps,\
         Video_settings.FOV=fov,\
         Video_settings.Borderless_windowed=borderless,\
         Video_settings.Color_blind=color_blind",
        &page_filter,
    )
    .await?;

    let ray_tracing = normalize_bool_field(extract_field(&video_rows, "ray_tracing"));
    let dlss = normalize_bool_field(extract_field(&video_rows, "dlss"));
    let fsr = normalize_bool_field(extract_field(&video_rows, "fsr"));
    let xess = normalize_bool_field(extract_field(&video_rows, "xess"));
    let frame_generation = normalize_bool_field(extract_field(&video_rows, "frame_gen"));
    let ultrawidescreen = normalize_bool_field(extract_field(&video_rows, "ultrawide"));
    let four_k_support = normalize_bool_field(extract_field(&video_rows, "four_k"));
    let hdr = normalize_bool_field(extract_field(&video_rows, "hdr"));
    let high_fps = normalize_bool_field(extract_field(&video_rows, "high_fps"));
    let fov = normalize_bool_field(extract_field(&video_rows, "fov"));
    let borderless_windowed = normalize_bool_field(extract_field(&video_rows, "borderless"));
    let color_blind = normalize_bool_field(extract_field(&video_rows, "color_blind"));

    // ------------------------------------------------------------------
    // 4. Input — suporte a controles
    // ------------------------------------------------------------------
    let input_rows = cargo_query(
        &client,
        "Input",
        "Input.Controller_support=ctrl_support,\
         Input.Full_controller=full_ctrl,\
         Input.PlayStation_controllers=ps_ctrl,\
         Input.XInput_controllers=xinput",
        &page_filter,
    )
    .await?;

    let controller_support = normalize_bool_field(extract_field(&input_rows, "ctrl_support"));
    let full_controller = normalize_bool_field(extract_field(&input_rows, "full_ctrl"));
    let playstation_controllers = normalize_bool_field(extract_field(&input_rows, "ps_ctrl"));
    let xinput_controllers = normalize_bool_field(extract_field(&input_rows, "xinput"));

    // ------------------------------------------------------------------
    // 5. Audio_settings — surround sound, legendas e acessibilidade
    // ------------------------------------------------------------------
    let audio_rows = cargo_query(
        &client,
        "Audio_settings",
        "Audio_settings.Surround_sound=surround,\
         Audio_settings.Subtitles=subtitles,\
         Audio_settings.Closed_captions=closed_captions",
        &page_filter,
    )
    .await?;

    let surround_sound = normalize_bool_field(extract_field(&audio_rows, "surround"));
    let subtitles = normalize_bool_field(extract_field(&audio_rows, "subtitles"));
    let closed_captions = normalize_bool_field(extract_field(&audio_rows, "closed_captions"));

    // ------------------------------------------------------------------
    // 6. System_requirements — requisitos de hardware
    //    Buscamos Windows e Linux separadamente (campo OSfamily)
    // ------------------------------------------------------------------
    let sysreq_win_rows = cargo_query(
        &client,
        "System_requirements",
        "System_requirements.OSfamily=os_family,\
         System_requirements.Minimum_OS=min_os,\
         System_requirements.Minimum_CPU=min_cpu,\
         System_requirements.Minimum_RAM=min_ram,\
         System_requirements.Minimum_GPU=min_gpu,\
         System_requirements.Minimum_VRAM=min_vram,\
         System_requirements.Minimum_DirectX=min_dx,\
         System_requirements.Minimum_HDD=min_storage,\
         System_requirements.Recommended_CPU=rec_cpu,\
         System_requirements.Recommended_RAM=rec_ram,\
         System_requirements.Recommended_GPU=rec_gpu,\
         System_requirements.Recommended_VRAM=rec_vram,\
         System_requirements.Recommended_DirectX=rec_dx",
        &format!(
            "{} AND System_requirements.OSfamily=\"Windows\"",
            page_filter
        ),
    )
    .await?;

    let win_min_os = extract_field(&sysreq_win_rows, "min_os");
    let win_min_cpu = extract_field(&sysreq_win_rows, "min_cpu");
    let win_min_ram = extract_field(&sysreq_win_rows, "min_ram");
    let win_min_gpu = extract_field(&sysreq_win_rows, "min_gpu");
    let win_min_vram = extract_field(&sysreq_win_rows, "min_vram");
    let win_min_dx = extract_field(&sysreq_win_rows, "min_dx");
    let win_min_storage = extract_field(&sysreq_win_rows, "min_storage");
    let win_rec_cpu = extract_field(&sysreq_win_rows, "rec_cpu");
    let win_rec_ram = extract_field(&sysreq_win_rows, "rec_ram");
    let win_rec_gpu = extract_field(&sysreq_win_rows, "rec_gpu");
    let win_rec_vram = extract_field(&sysreq_win_rows, "rec_vram");
    let win_rec_dx = extract_field(&sysreq_win_rows, "rec_dx");

    let sysreq_linux_rows = cargo_query(
        &client,
        "System_requirements",
        "System_requirements.OSfamily=os_family,\
         System_requirements.Minimum_CPU=min_cpu,\
         System_requirements.Minimum_RAM=min_ram,\
         System_requirements.Minimum_GPU=min_gpu,\
         System_requirements.Minimum_HDD=min_storage,\
         System_requirements.Recommended_CPU=rec_cpu,\
         System_requirements.Recommended_RAM=rec_ram,\
         System_requirements.Recommended_GPU=rec_gpu",
        &format!("{} AND System_requirements.OSfamily=\"Linux\"", page_filter),
    )
    .await?;

    let linux_min_cpu = extract_field(&sysreq_linux_rows, "min_cpu");
    let linux_min_ram = extract_field(&sysreq_linux_rows, "min_ram");
    let linux_min_gpu = extract_field(&sysreq_linux_rows, "min_gpu");
    let linux_min_storage = extract_field(&sysreq_linux_rows, "min_storage");
    let linux_rec_cpu = extract_field(&sysreq_linux_rows, "rec_cpu");
    let linux_rec_ram = extract_field(&sysreq_linux_rows, "rec_ram");
    let linux_rec_gpu = extract_field(&sysreq_linux_rows, "rec_gpu");

    // -------------------------------------------------------------------------------------------
    // 7. L10n — idiomas suportados - A tabela L10n tem uma linha por idioma - Agrupa por tipo.
    // -------------------------------------------------------------------------------------------
    let l10n_rows = cargo_query(
        &client,
        "L10n",
        "L10n.Language=language,\
         L10n.Interface=interface,\
         L10n.Audio=audio,\
         L10n.Subtitles=subtitles",
        &page_filter,
    )
    .await?;

    let (languages_interface, languages_audio, languages_subtitles) = parse_l10n_rows(&l10n_rows);

    // ------------------------------------------------------------------
    // 8. Game_data — caminhos de save e config (Windows e Linux)
    // ------------------------------------------------------------------
    let gamedata_rows = cargo_query(
        &client,
        "Game_data",
        "Game_data.Path=path,\
         Game_data.OS=os,\
         Game_data.Store=store",
        &page_filter,
    )
    .await?;

    let (save_path_windows, save_path_linux, config_path_windows, config_path_linux) =
        parse_game_data_paths(&gamedata_rows);

    // ------------------------------------------------------------------
    // Montagem do struct final
    // ------------------------------------------------------------------
    let fetched_at = Utc::now().to_rfc3339();

    Ok(PcgwData {
        steam_app_id: steam_app_id.to_string(),
        pcgw_page_id: Some(page_id),
        pcgw_page_name: page_name,
        engine,
        linux_support,
        windows_support,
        macos_support,
        ray_tracing,
        dlss,
        fsr,
        xess,
        frame_generation,
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
        win_min_os,
        win_min_cpu,
        win_min_ram,
        win_min_gpu,
        win_min_vram,
        win_min_dx,
        win_min_storage,
        win_rec_cpu,
        win_rec_ram,
        win_rec_gpu,
        win_rec_vram,
        win_rec_dx,
        linux_min_cpu,
        linux_min_ram,
        linux_min_gpu,
        linux_min_storage,
        linux_rec_cpu,
        linux_rec_ram,
        linux_rec_gpu,
        languages_interface,
        languages_audio,
        languages_subtitles,
        save_path_windows,
        save_path_linux,
        config_path_windows,
        config_path_linux,
        fetched_at: Some(fetched_at),
    })
}
