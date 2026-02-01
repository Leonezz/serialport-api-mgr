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

### Setup Commands (All Modes)

These commands work regardless of the current protocol mode:

| Command | Description | Example Response |
|---------|-------------|------------------|
| `HELP` | Show all available commands | Help text |
| `STATUS` | Show device status | Mode, WiFi status, sensor values |
| `MODE=<mode>` | Switch protocol mode | `OK - Mode set to: AtCommand` |
| `WIFI_SSID=<name>` | Set WiFi SSID | `OK - SSID set to: MyNetwork` |
| `WIFI_PASS=<pass>` | Set WiFi password | `OK - Password set (hidden)` |
| `WIFI_CONNECT` | Connect to WiFi | `OK - Connected! IP: 192.168.1.100` |
| `WIFI_STATUS` | Show WiFi status | Connection info or pending SSID |
| `WIFI_SCAN` | Scan for networks | Triggers async scan |
| `WIFI_CLEAR` | Clear stored credentials | `OK - WiFi credentials cleared` |
| `SET_TEMP=<val>` | Set simulated temperature (°C) | `OK - Temperature set to: 25°C` |
| `SET_HUMID=<val>` | Set simulated humidity (%) | `OK - Humidity set to: 50%` |
| `SET_RPM=<val>` | Set simulated RPM | `OK - RPM set to: 3000` |
| `SET_SPEED=<val>` | Set simulated speed (km/h) | `OK - Speed set to: 60 km/h` |

**Available modes:** `SETUP`, `ECHO`, `AT`, `MODBUS`, `GPS`, `SCPI`, `MARLIN`, `ELM327`, `ESCPOS`

### AT Commands (MODE=AT)
Default baud: 115200

| Command | Description | Response |
|---------|-------------|----------|
| `AT` | Check connection | `OK` |
| `AT+GMR` | Get firmware version | Version info + `OK` |
| `AT+RST` | Reset device | `OK` then `ready` |
| `AT+CWMODE?` | Query WiFi mode | `+CWMODE:1` + `OK` |
| `AT+CWLAP` | List available networks | Network list + `OK` |
| `AT+*` | Other AT commands | `OK` |

### Modbus RTU (MODE=MODBUS)
Default baud: 9600, Even parity

**⚠️ Binary Protocol:** This mode uses binary Modbus RTU frames, not text commands.

- **Slave address:** 1 (broadcast address 0 also accepted)
- **CRC:** Standard Modbus CRC-16 (polynomial 0xA001)

**Supported Function Codes:**

| FC | Name | Description |
|----|------|-------------|
| 0x01 | Read Coils | Read digital outputs (coils 0-2) |
| 0x02 | Read Discrete Inputs | Read digital inputs (discretes 0-1) |
| 0x03 | Read Holding Registers | Read/write registers (0-7) |
| 0x04 | Read Input Registers | Read-only sensor data (0-7) |
| 0x05 | Write Single Coil | Write single digital output |
| 0x06 | Write Single Register | Write single holding register |
| 0x0F | Write Multiple Coils | Write multiple digital outputs |
| 0x10 | Write Multiple Registers | Write multiple holding registers |

**Register Map (Input & Holding):**

| Address | Description | Scaling | Example |
|---------|-------------|---------|---------|
| 0x0000 | Temperature | ×10 | 255 = 25.5°C |
| 0x0001 | Humidity | ×10 | 500 = 50.0% |
| 0x0002 | RPM | raw | 3000 = 3000 RPM |
| 0x0003 | Speed | ×10 | 555 = 55.5 km/h |
| 0x0004 | Voltage | ×100 | 330 = 3.30V |
| 0x0005 | Current | ×1000 | 150 = 0.150A |
| 0x0006 | Pressure | ×10 | 10132 = 1013.2 hPa |
| 0x0007 | Altitude | ×10 | 1000 = 100.0m |

**Coil Map:**

| Address | Description | Default |
|---------|-------------|---------|
| 0x0000 | Device online | ON |
| 0x0001 | Alarm status | OFF |
| 0x0002 | Sensor ready | ON |

**Discrete Input Map:**

| Address | Description | Default |
|---------|-------------|---------|
| 0x0000 | Input 1 state | ON |
| 0x0001 | Input 2 state | OFF |

**Example Frame (Read 4 Holding Registers from address 0):**
```
TX: 01 03 00 00 00 04 44 09  (addr=1, FC03, start=0, count=4, CRC)
RX: 01 03 08 00 FF 01 F4 0B B8 02 2B [CRC]  (8 bytes: temp, humid, rpm, speed)
```

### NMEA GPS (MODE=GPS)
Default baud: 4800

Generates GPGGA sentences automatically when data is requested:
```
$GPGGA,120000.00,3746.4940,N,12225.1640,W,1,08,0.9,10.0,M,0.0,M,,*XX
```

Configure position with `SET_` commands for latitude, longitude, altitude.

### SCPI (MODE=SCPI)
Default baud: 9600

| Command | Description | Response |
|---------|-------------|----------|
| `*IDN?` | Query identification | `ESP32-SCPI-SIM,SerialTester,001,1.0.0` |
| `*RST` | Reset device | (no response) |
| `*OPC?` | Operation complete query | `1` |
| `:SYST:ERR?` | Query error | `0,"No error"` |
| `:MEAS:VOLT:DC?` | Measure DC voltage | Simulated voltage |
| `:MEAS:CURR:DC?` | Measure DC current | Simulated current |
| `:MEAS:TEMP?` | Measure temperature | Simulated temperature |

### Marlin G-code (MODE=MARLIN)
Default baud: 115200

| Command | Description | Response |
|---------|-------------|----------|
| `G28` | Home all axes | Position info + `ok` |
| `M105` | Report temperatures | `ok T:200.0 /0.0 B:60.0 /0.0 @:0 B@:0` |
| `M114` | Report current position | `X:100.00 Y:100.00 Z:10.00 E:0.00...` + `ok` |
| `M503` | Report EEPROM settings | Settings dump + `ok` |
| `G*` / `M*` | Other G/M codes | `ok` |

### ELM327 OBD-II (MODE=ELM327)
Default baud: 38400

| Command | Description | Response |
|---------|-------------|----------|
| `ATZ` | Reset adapter | `ELM327 v1.5` + `>` |
| `ATE0` | Echo off | `OK` + `>` |
| `ATL1` | Linefeeds on | `OK` + `>` |
| `ATSP0` | Auto protocol | `OK` + `>` |
| `0100` | Supported PIDs 01-20 | `41 00 BE 3F A8 13` + `>` |
| `010C` | Engine RPM | `41 0C XX XX` + `>` (from SET_RPM) |
| `010D` | Vehicle speed | `41 0D XX` + `>` (from SET_SPEED) |
| `0105` | Coolant temperature | `41 05 XX` + `>` (from SET_TEMP) |
| `01XX` | Other Mode 01 PIDs | `NO DATA` + `>` |

### ESC/POS Thermal Printer (MODE=ESCPOS)
Default baud: 19200

**⚠️ Binary Protocol:** This mode uses binary ESC/POS commands, not text.

Emulates a thermal receipt printer for testing printer communication.

**Supported Command Groups:**

| Prefix | Name | Description |
|--------|------|-------------|
| `0x10` (DLE) | Real-time commands | Status queries, drawer kick |
| `0x1B` (ESC) | Escape commands | Initialization, formatting |
| `0x1D` (GS) | Group separator commands | Paper cut, character size, status |
| `0x1C` (FS) | Field separator commands | Kanji mode (acknowledged) |

**DLE Commands (Real-time):**

| Command | Hex | Description | Response |
|---------|-----|-------------|----------|
| DLE EOT | `10 04` | Transmit printer status | 1 byte status |
| DLE ENQ | `10 05` | Send real-time request | `0x00` (online) |
| DLE DC4 | `10 14` | Generate pulse (drawer kick) | None (logs action) |

**ESC Commands:**

| Command | Hex | Description |
|---------|-----|-------------|
| ESC @ | `1B 40` | Initialize printer |
| ESC ! n | `1B 21 n` | Select print mode (bold, double, underline) |
| ESC E n | `1B 45 n` | Bold on (n≠0) / off (n=0) |
| ESC - n | `1B 2D n` | Underline mode (0=off, 1=1dot, 2=2dot) |
| ESC a n | `1B 61 n` | Justification (0=left, 1=center, 2=right) |
| ESC d n | `1B 64 n` | Print and feed n lines |
| ESC p m t1 t2 | `1B 70 m t1 t2` | Generate pulse (drawer) |
| ESC t n | `1B 74 n` | Select character code table |
| ESC R n | `1B 52 n` | Select international character set |

**GS Commands:**

| Command | Hex | Description | Response |
|---------|-----|-------------|----------|
| GS V n | `1D 56 n` | Cut paper (0=full, 1=partial) | None |
| GS ! n | `1D 21 n` | Select character size | None |
| GS r n | `1D 72 n` | Transmit status | 1 byte status |
| GS a n | `1D 61 n` | Enable/disable ASB | None |
| GS ( A | `1D 28 41...` | Execute test print | None |
| GS k | `1D 6B...` | Print barcode | None (logs action) |

**Status Byte Format (GS r n):**

| n | Status Type | Bit Meanings |
|---|-------------|--------------|
| 1 | Printer | bit5: paper end, bit6: error |
| 2 | Offline | bit2: paper end |
| 3 | Error | bit3: recoverable error |
| 4 | Paper sensor | 0x00: present, 0x0C: paper end |

**Control Characters:**

| Char | Hex | Action |
|------|-----|--------|
| LF | `0x0A` | Print line and feed |
| CR | `0x0D` | Ignored (carriage return) |
| FF | `0x0C` | Form feed / cut paper |

**Example - Print and cut:**
```
TX: 1B 40                    (Initialize)
TX: 1B 61 01                 (Center justify)
TX: 1B 45 01                 (Bold on)
TX: 48 65 6C 6C 6F 0A        (Print "Hello\n")
TX: 1B 45 00                 (Bold off)
TX: 1D 56 00                 (Full cut)
```

**Simulating Paper Out:**
Use the web dashboard or internal API to set paper status for testing paper-out scenarios.

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
