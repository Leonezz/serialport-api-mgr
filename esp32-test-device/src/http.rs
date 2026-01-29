//! HTTP server and web dashboard for device configuration

use esp_idf_svc::http::server::{Configuration as HttpConfig, EspHttpServer};
use esp_idf_svc::io::Write as EspWrite;
use log::*;

use crate::types::{DeviceState, ProtocolMode, SharedState, SimulatedData};

/// Start the HTTP server for the web dashboard
pub fn start_http_server(state: SharedState) -> anyhow::Result<EspHttpServer<'static>> {
    let config = HttpConfig {
        stack_size: 8192,
        ..Default::default()
    };

    let mut server = EspHttpServer::new(&config)?;

    // Main dashboard page
    let state_clone = state.clone();
    server.fn_handler("/", esp_idf_svc::http::Method::Get, move |req| {
        let state = state_clone.lock().unwrap();
        let html = generate_dashboard_html(&state);
        req.into_ok_response()?.write_all(html.as_bytes())?;
        Ok::<(), anyhow::Error>(())
    })?;

    // API: Get state
    let state_clone = state.clone();
    server.fn_handler("/api/state", esp_idf_svc::http::Method::Get, move |req| {
        let state = state_clone.lock().unwrap();
        let json = serde_json::to_string(&*state).unwrap_or_default();
        req.into_ok_response()?.write_all(json.as_bytes())?;
        Ok::<(), anyhow::Error>(())
    })?;

    // API: Set mode
    let state_clone = state.clone();
    server.fn_handler(
        "/api/mode",
        esp_idf_svc::http::Method::Post,
        move |mut req| {
            let mut buf = [0u8; 64];
            let len = req.read(&mut buf)?;
            if let Ok(mode_str) = std::str::from_utf8(&buf[..len]) {
                if let Some(new_mode) = ProtocolMode::from_str(mode_str.trim()) {
                    state_clone.lock().unwrap().mode = new_mode;
                    info!("Mode changed to: {:?}", new_mode);
                }
            }
            req.into_ok_response()?.write_all(b"OK")?;
            Ok::<(), anyhow::Error>(())
        },
    )?;

    // API: Set simulated data
    let state_clone = state.clone();
    server.fn_handler(
        "/api/data",
        esp_idf_svc::http::Method::Post,
        move |mut req| {
            let mut buf = [0u8; 512];
            let len = req.read(&mut buf)?;
            if let Ok(json_str) = std::str::from_utf8(&buf[..len]) {
                if let Ok(data) = serde_json::from_str::<SimulatedData>(json_str) {
                    state_clone.lock().unwrap().simulated_data = data;
                    info!("Simulated data updated");
                }
            }
            req.into_ok_response()?.write_all(b"OK")?;
            Ok::<(), anyhow::Error>(())
        },
    )?;

    info!("HTTP server started on port 80");
    Ok(server)
}

fn generate_dashboard_html(state: &DeviceState) -> String {
    format!(
        r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serial Protocol Tester</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; padding: 20px; }}
        h1 {{ color: #00d4ff; margin-bottom: 20px; }}
        .container {{ max-width: 900px; margin: 0 auto; }}
        .card {{ background: #16213e; border-radius: 12px; padding: 20px; margin-bottom: 20px; }}
        .card h2 {{ color: #00d4ff; font-size: 1.1em; margin-bottom: 15px; border-bottom: 1px solid #0f3460; padding-bottom: 10px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }}
        .stat {{ background: #0f3460; padding: 15px; border-radius: 8px; }}
        .stat-label {{ font-size: 0.8em; color: #888; margin-bottom: 5px; }}
        .stat-value {{ font-size: 1.4em; font-weight: bold; color: #00d4ff; }}
        select, input, button {{ background: #0f3460; border: 1px solid #00d4ff; color: #fff; padding: 10px 15px; border-radius: 6px; font-size: 1em; }}
        select:focus, input:focus {{ outline: none; border-color: #00ffaa; }}
        button {{ background: #00d4ff; color: #000; font-weight: bold; cursor: pointer; transition: all 0.2s; }}
        button:hover {{ background: #00ffaa; }}
        .mode-select {{ width: 100%; margin-bottom: 15px; }}
        .slider-group {{ margin-bottom: 15px; }}
        .slider-group label {{ display: block; margin-bottom: 5px; color: #888; }}
        .slider-group input[type="range"] {{ width: 100%; }}
        .status {{ display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }}
        .status.connected {{ background: #00ff88; }}
        .status.disconnected {{ background: #ff4444; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Serial Protocol Tester</h1>

        <div class="card">
            <h2>Device Status</h2>
            <div class="grid">
                <div class="stat">
                    <div class="stat-label">Current Mode</div>
                    <div class="stat-value" id="modeValue">{:?}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Messages</div>
                    <div class="stat-value" id="msgCount">{}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">WiFi</div>
                    <div class="stat-value"><span class="status connected"></span>{}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">IP Address</div>
                    <div class="stat-value">{}</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Protocol Mode</h2>
            <select class="mode-select" id="modeSelect" onchange="setMode(this.value)">
                <option value="SETUP" {}>Setup Mode</option>
                <option value="ECHO" {}>Echo (Loopback)</option>
                <option value="AT" {}>AT Commands (ESP32)</option>
                <option value="MODBUS" {}>Modbus RTU</option>
                <option value="GPS" {}>NMEA GPS</option>
                <option value="SCPI" {}>SCPI Instrument</option>
                <option value="MARLIN" {}>Marlin (3D Printer)</option>
                <option value="ELM327" {}>ELM327 (OBD-II)</option>
            </select>
        </div>

        <div class="card">
            <h2>Simulated Sensor Data</h2>
            <div class="slider-group">
                <label>Temperature: <span id="tempValue">{:.1}</span>°C</label>
                <input type="range" min="-20" max="100" value="{}" id="tempSlider" onchange="updateData()">
            </div>
            <div class="slider-group">
                <label>Humidity: <span id="humidValue">{:.1}</span>%</label>
                <input type="range" min="0" max="100" value="{}" id="humidSlider" onchange="updateData()">
            </div>
            <div class="slider-group">
                <label>Speed: <span id="speedValue">{:.1}</span> km/h</label>
                <input type="range" min="0" max="200" value="{}" id="speedSlider" onchange="updateData()">
            </div>
            <div class="slider-group">
                <label>RPM: <span id="rpmValue">{}</span></label>
                <input type="range" min="0" max="8000" step="100" value="{}" id="rpmSlider" onchange="updateData()">
            </div>
        </div>
    </div>

    <script>
        function setMode(mode) {{
            fetch('/api/mode', {{ method: 'POST', body: mode }});
            document.getElementById('modeValue').textContent = mode;
        }}

        function updateData() {{
            const data = {{
                temperature: parseFloat(document.getElementById('tempSlider').value),
                humidity: parseFloat(document.getElementById('humidSlider').value),
                pressure: 1013.25,
                latitude: 37.7749,
                longitude: -122.4194,
                altitude: 10.0,
                speed: parseFloat(document.getElementById('speedSlider').value),
                rpm: parseInt(document.getElementById('rpmSlider').value),
                voltage: 3.3,
                current: 0.1
            }};
            document.getElementById('tempValue').textContent = data.temperature.toFixed(1);
            document.getElementById('humidValue').textContent = data.humidity.toFixed(1);
            document.getElementById('speedValue').textContent = data.speed.toFixed(1);
            document.getElementById('rpmValue').textContent = data.rpm;
            fetch('/api/data', {{ method: 'POST', body: JSON.stringify(data) }});
        }}

        setInterval(() => {{
            fetch('/api/state').then(r => r.json()).then(s => {{
                document.getElementById('msgCount').textContent = s.message_count;
            }});
        }}, 2000);
    </script>
</body>
</html>"#,
        state.mode,
        state.message_count,
        state.wifi_ssid,
        state.wifi_ip,
        if state.mode == ProtocolMode::Setup { "selected" } else { "" },
        if state.mode == ProtocolMode::Echo { "selected" } else { "" },
        if state.mode == ProtocolMode::AtCommand { "selected" } else { "" },
        if state.mode == ProtocolMode::ModbusRtu { "selected" } else { "" },
        if state.mode == ProtocolMode::NmeaGps { "selected" } else { "" },
        if state.mode == ProtocolMode::Scpi { "selected" } else { "" },
        if state.mode == ProtocolMode::Marlin { "selected" } else { "" },
        if state.mode == ProtocolMode::Elm327 { "selected" } else { "" },
        state.simulated_data.temperature,
        state.simulated_data.temperature as i32,
        state.simulated_data.humidity,
        state.simulated_data.humidity as i32,
        state.simulated_data.speed,
        state.simulated_data.speed as i32,
        state.simulated_data.rpm,
        state.simulated_data.rpm,
    )
}
