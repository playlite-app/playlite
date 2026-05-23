//! This module contains functions for scraping game catalogs from various platforms.
//! Each platform has its own submodule that implements the specific scraping logic for that platform.

pub mod amazon_luna;

pub use amazon_luna::{fetch_amazon_luna_catalog, LunaGame};
