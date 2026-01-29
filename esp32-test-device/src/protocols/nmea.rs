//! NMEA GPS sentence generator

use crate::types::SimulatedData;

/// Generate a GPGGA NMEA sentence from simulated data
pub fn generate_nmea_sentence(sim_data: &SimulatedData) -> Vec<u8> {
    let lat_deg = sim_data.latitude.abs() as u32;
    let lat_min = (sim_data.latitude.abs() - lat_deg as f64) * 60.0;
    let lat_dir = if sim_data.latitude >= 0.0 { 'N' } else { 'S' };

    let lon_deg = sim_data.longitude.abs() as u32;
    let lon_min = (sim_data.longitude.abs() - lon_deg as f64) * 60.0;
    let lon_dir = if sim_data.longitude >= 0.0 { 'E' } else { 'W' };

    let sentence = format!(
        "$GPGGA,120000.00,{:02}{:07.4},{},{:03}{:07.4},{},1,08,0.9,{:.1},M,0.0,M,,",
        lat_deg, lat_min, lat_dir, lon_deg, lon_min, lon_dir, sim_data.altitude
    );

    let checksum: u8 = sentence[1..].bytes().fold(0, |acc, b| acc ^ b);
    format!("{}*{:02X}", sentence, checksum).into_bytes()
}
