//! WiFi management and NVS credential storage

use esp_idf_svc::{
    nvs::{EspNvs, NvsDefault},
    wifi::{AuthMethod, BlockingWifi, ClientConfiguration, Configuration, EspWifi},
};
use log::*;

use crate::types::WifiConfig;

/// NVS namespace for storing WiFi credentials
pub const NVS_NAMESPACE: &str = "wifi_config";
const NVS_KEY_SSID: &str = "ssid";
const NVS_KEY_PASS: &str = "password";

/// WiFi manager that handles connection and credential storage
pub struct WifiManager<'a> {
    pub wifi: BlockingWifi<EspWifi<'a>>,
    pub nvs: EspNvs<NvsDefault>,
    pub pending_ssid: String,
    pub pending_pass: String,
}

/// Load WiFi credentials from NVS
pub fn load_wifi_config(nvs: &EspNvs<NvsDefault>) -> WifiConfig {
    let mut config = WifiConfig::default();

    let mut buf = [0u8; 64];
    if let Ok(Some(ssid)) = nvs.get_str(NVS_KEY_SSID, &mut buf) {
        config.ssid = ssid.to_string();
    }

    let mut buf = [0u8; 64];
    if let Ok(Some(pass)) = nvs.get_str(NVS_KEY_PASS, &mut buf) {
        config.password = pass.to_string();
    }

    config
}

/// Save WiFi credentials to NVS
pub fn save_wifi_config(
    nvs: &mut EspNvs<NvsDefault>,
    ssid: &str,
    password: &str,
) -> anyhow::Result<()> {
    nvs.set_str(NVS_KEY_SSID, ssid)?;
    nvs.set_str(NVS_KEY_PASS, password)?;
    info!("WiFi credentials saved to NVS");
    Ok(())
}

/// Clear WiFi credentials from NVS
pub fn clear_wifi_config(nvs: &mut EspNvs<NvsDefault>) -> anyhow::Result<()> {
    let _ = nvs.remove(NVS_KEY_SSID);
    let _ = nvs.remove(NVS_KEY_PASS);
    info!("WiFi credentials cleared from NVS");
    Ok(())
}

/// Attempt to connect to WiFi with the given credentials
pub fn try_connect_wifi(
    wifi_mgr: &mut WifiManager,
    ssid: &str,
    password: &str,
) -> Result<String, String> {
    info!("Connecting to WiFi: {}", ssid);

    wifi_mgr
        .wifi
        .set_configuration(&Configuration::Client(ClientConfiguration {
            ssid: ssid.try_into().map_err(|_| "Invalid SSID")?,
            password: password.try_into().map_err(|_| "Invalid password")?,
            auth_method: AuthMethod::WPA2Personal,
            ..Default::default()
        }))
        .map_err(|e| format!("Config error: {:?}", e))?;

    wifi_mgr
        .wifi
        .start()
        .map_err(|e| format!("Start error: {:?}", e))?;
    wifi_mgr
        .wifi
        .connect()
        .map_err(|e| format!("Connect error: {:?}", e))?;
    wifi_mgr
        .wifi
        .wait_netif_up()
        .map_err(|e| format!("Network error: {:?}", e))?;

    let ip_info = wifi_mgr
        .wifi
        .wifi()
        .sta_netif()
        .get_ip_info()
        .map_err(|e| format!("IP error: {:?}", e))?;

    let ip = format!("{}", ip_info.ip);
    info!("WiFi connected! IP: {}", ip);
    Ok(ip)
}
