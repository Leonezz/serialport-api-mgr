# Serial Protocol Tester - ESP32-S3

A configurable serial device emulator for testing the serialport-api-mgr application. This firmware allows the ESP32-S3 to emulate various serial protocols and provides a web dashboard for configuration and monitoring.

## Features

- **Multiple Protocol Modes:**
  - Echo (loopback)
  - AT Commands (ESP32 style)
  - Modbus RTU (slave)
  - NMEA GPS simulator
  - SCPI instrument emulator
  - Marlin (3D printer)
  - ELM327 (OBD-II)
  - ESC/POS printer

- **Web Dashboard:**
  - Real-time protocol mode switching
  - Simulated sensor data controls
  - Message logging
  - Status monitoring

- **Configurable Parameters:**
  - Baud rate, data bits, parity, stop bits
  - Simulated sensor values (temperature, humidity, GPS, etc.)

## Hardware Requirements

- ESP32-S3 development board
- USB cable for flashing and power
- Optional: USB-UART adapter for testing (if using USB for programming)

## Pin Configuration

| Function | GPIO |
|----------|------|
| UART TX  | 17   |
| UART RX  | 18   |
| LED      | 2    |

## Prerequisites

### 1. Install Rust and ESP Toolchain

```bash
# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install espup (ESP Rust toolchain manager)
cargo install espup

# Install the ESP toolchain
espup install

# Source the export file (add to your shell profile)
source ~/export-esp.sh

# Install additional tools
cargo install espflash
cargo install ldproxy
```

### 2. Set Environment Variables

Create a `.env` file or set these environment variables:

```bash
export WIFI_SSID="YourWiFiNetwork"
export WIFI_PASS="YourWiFiPassword"
```

## Building

```bash
cd esp32-test-device

# Build the project
cargo build --release

# Or build and flash directly
cargo run --release
```

## Flashing

```bash
# Flash the firmware
espflash flash --monitor target/xtensa-esp32s3-espidf/release/serial-protocol-tester
```

## Usage

1. **Connect to WiFi:** The device will attempt to connect to the configured WiFi network.

2. **Access Dashboard:** Open a web browser and navigate to the device's IP address (shown in serial output).

3. **Select Protocol Mode:** Use the dropdown to switch between protocol emulation modes.

4. **Connect Serial:** Connect your serial cable to GPIO17 (TX) and GPIO18 (RX).

5. **Test with serialport-api-mgr:** Use the corresponding preset in the application.

## Protocol Details

### AT Commands (ESP32)
- Responds to standard AT commands: `AT`, `AT+GMR`, `AT+RST`, `AT+CWLAP`, etc.
- Default baud: 115200

### Modbus RTU
- Slave address: 1
- Supports FC03 (Read Holding), FC04 (Read Input), FC06 (Write Single)
- Returns simulated sensor data in registers
- Default baud: 9600, Even parity

### NMEA GPS
- Generates GPGGA sentences with configurable coordinates
- Default baud: 4800

### SCPI
- Responds to `*IDN?`, `*RST`, `:MEAS:VOLT:DC?`, etc.
- Default baud: 9600

### Marlin (3D Printer)
- Responds to G-code: `G28`, `M105`, `M114`, `M503`
- Returns simulated temperatures
- Default baud: 115200

### ELM327 (OBD-II)
- Responds to ELM AT commands and OBD PIDs
- Simulates engine RPM, speed, coolant temp
- Default baud: 38400

### ESC/POS
- Accepts standard ESC/POS commands
- Status query support
- Default baud: 19200

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web dashboard |
| `/api/state` | GET | Current device state (JSON) |
| `/api/mode` | POST | Set protocol mode |
| `/api/data` | POST | Update simulated sensor data |

## Troubleshooting

### Build Errors
- Ensure `source ~/export-esp.sh` has been run
- Check that ESP-IDF version matches (v5.2.2)

### Flash Errors
- Hold BOOT button while connecting USB
- Check USB cable supports data transfer

### WiFi Connection
- Verify SSID and password in environment variables
- Check 2.4GHz network (ESP32 doesn't support 5GHz)

## Testing Presets

Use these presets from serialport-api-mgr:

| Protocol | Preset Name |
|----------|-------------|
| AT Commands | "ESP32 / Arduino (115200)" |
| Modbus RTU | "Modbus RTU (9600, Even Parity)" |
| NMEA GPS | "GPS NMEA 0183 (4800)" |
| SCPI | "SCPI Instrument (9600)" |
| Marlin | "3D Printer / Marlin (115200)" |
| ELM327 | "OBD-II / ELM327 (38400)" |
| ESC/POS | "ESC/POS Printer (19200)" |
