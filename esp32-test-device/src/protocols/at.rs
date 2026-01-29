//! AT Command processor (ESP32 style)

/// Process an AT command and return the response
pub fn process_at_command(line: &str) -> String {
    let cmd = line.trim().to_uppercase();

    match cmd.as_str() {
        "AT" => "OK".to_string(),
        "AT+GMR" => {
            "AT version:2.4.0.0\r\nSDK version:v5.2.2\r\ncompile time:Jan 2026\r\n\r\nOK".to_string()
        }
        "AT+RST" => "OK\r\n\r\nready".to_string(),
        "AT+CWMODE?" => "+CWMODE:1\r\n\r\nOK".to_string(),
        "AT+CWLAP" => {
            "+CWLAP:(3,\"TestNetwork\",-45,\"aa:bb:cc:dd:ee:ff\",1)\r\n\
             +CWLAP:(4,\"OtherWiFi\",-60,\"11:22:33:44:55:66\",6)\r\n\r\nOK"
                .to_string()
        }
        _ if cmd.starts_with("AT+") => "OK".to_string(),
        _ => "ERROR".to_string(),
    }
}
