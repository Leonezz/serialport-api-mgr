import {
  SerialConfig,
  NetworkConfig,
  SavedCommand,
  SerialPreset,
} from "../types";

export const DEFAULT_CONFIG: SerialConfig = {
  baudRate: 115200,
  dataBits: "Eight",
  stopBits: "One",
  parity: "None",
  flowControl: "None",
  bufferSize: 1000,
  lineEnding: "CRLF",
  framing: {
    strategy: "NONE",
    delimiter: "",
    timeout: 50,
    prefixLengthSize: 1,
    byteOrder: "LE",
  },
};

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  host: "localhost",
  port: 8080,
};

const now = Date.now();
export const DEFAULT_COMMANDS: SavedCommand[] = [
  // ============================================================================
  // ESP32 TEST DEVICE (Serial Protocol Tester)
  // ============================================================================
  // WiFi Configuration
  {
    id: "tester_help",
    name: "Show Help",
    group: "Test Device/Setup",
    payload: "HELP",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Display all available commands",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_status",
    name: "Device Status",
    group: "Test Device/Setup",
    payload: "STATUS",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Show current mode, WiFi status, and sensor values",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_wifi_status",
    name: "WiFi Status",
    group: "Test Device/WiFi",
    payload: "WIFI_STATUS",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Show WiFi connection status and IP address",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_wifi_ssid",
    name: "Set WiFi SSID",
    group: "Test Device/WiFi",
    payload: "WIFI_SSID=${ssid}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set the WiFi network name",
    parameters: [
      {
        id: "ssid_p",
        name: "ssid",
        type: "STRING",
        label: "Network Name (SSID)",
        defaultValue: "MyNetwork",
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_wifi_pass",
    name: "Set WiFi Password",
    group: "Test Device/WiFi",
    payload: "WIFI_PASS=${password}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set the WiFi password",
    parameters: [
      {
        id: "pass_p",
        name: "password",
        type: "STRING",
        label: "Password",
        defaultValue: "",
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_wifi_connect",
    name: "Connect WiFi",
    group: "Test Device/WiFi",
    payload: "WIFI_CONNECT",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Connect to WiFi using configured SSID and password",
    validation: {
      enabled: true,
      mode: "PATTERN",
      matchType: "CONTAINS",
      pattern: "Connected",
      timeout: 15000,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_wifi_scan",
    name: "Scan Networks",
    group: "Test Device/WiFi",
    payload: "WIFI_SCAN",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Scan for available WiFi networks",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_wifi_clear",
    name: "Clear WiFi Credentials",
    group: "Test Device/WiFi",
    payload: "WIFI_CLEAR",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Clear stored WiFi credentials from NVS",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  // Mode Switching
  {
    id: "tester_mode_setup",
    name: "Setup Mode",
    group: "Test Device/Mode",
    payload: "MODE=SETUP",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to WiFi setup mode",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_mode_echo",
    name: "Echo Mode",
    group: "Test Device/Mode",
    payload: "MODE=ECHO",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to echo/loopback mode",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_mode_at",
    name: "AT Command Mode",
    group: "Test Device/Mode",
    payload: "MODE=AT",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to ESP32-style AT command mode",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_mode_modbus",
    name: "Modbus RTU Mode",
    group: "Test Device/Mode",
    payload: "MODE=MODBUS",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to Modbus RTU slave emulation",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_mode_gps",
    name: "GPS/NMEA Mode",
    group: "Test Device/Mode",
    payload: "MODE=GPS",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to NMEA GPS sentence generator",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_mode_scpi",
    name: "SCPI Mode",
    group: "Test Device/Mode",
    payload: "MODE=SCPI",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to SCPI instrument emulation",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_mode_marlin",
    name: "Marlin Mode",
    group: "Test Device/Mode",
    payload: "MODE=MARLIN",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to 3D printer Marlin G-code emulation",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_mode_elm327",
    name: "ELM327/OBD-II Mode",
    group: "Test Device/Mode",
    payload: "MODE=ELM327",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Switch to ELM327 OBD-II adapter emulation",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  // Simulation Data
  {
    id: "tester_set_temp",
    name: "Set Temperature",
    group: "Test Device/Simulation",
    payload: "SET_TEMP=${temp}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set simulated temperature value (°C)",
    parameters: [
      {
        id: "temp_sim_p",
        name: "temp",
        type: "FLOAT",
        label: "Temperature (°C)",
        min: -40,
        max: 100,
        defaultValue: 25.0,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_set_humid",
    name: "Set Humidity",
    group: "Test Device/Simulation",
    payload: "SET_HUMID=${humid}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set simulated humidity value (%)",
    parameters: [
      {
        id: "humid_sim_p",
        name: "humid",
        type: "FLOAT",
        label: "Humidity (%)",
        min: 0,
        max: 100,
        defaultValue: 50.0,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_set_rpm",
    name: "Set RPM",
    group: "Test Device/Simulation",
    payload: "SET_RPM=${rpm}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set simulated engine RPM value",
    parameters: [
      {
        id: "rpm_sim_p",
        name: "rpm",
        type: "INTEGER",
        label: "RPM",
        min: 0,
        max: 10000,
        defaultValue: 3000,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "tester_set_speed",
    name: "Set Speed",
    group: "Test Device/Simulation",
    payload: "SET_SPEED=${speed}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set simulated vehicle speed (km/h)",
    parameters: [
      {
        id: "speed_sim_p",
        name: "speed",
        type: "FLOAT",
        label: "Speed (km/h)",
        min: 0,
        max: 300,
        defaultValue: 60.0,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // --- ESP32 / Generic AT ---
  {
    id: "1",
    name: "AT Check",
    group: "ESP32/AT",
    payload: "AT",
    mode: "TEXT",
    encoding: "UTF-8",
    validation: {
      enabled: true,
      mode: "PATTERN",
      matchType: "CONTAINS",
      pattern: "OK",
      timeout: 2000,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "2",
    name: "Get Version",
    group: "ESP32/AT",
    payload: "AT+GMR",
    mode: "TEXT",
    encoding: "UTF-8",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "3",
    name: "Reset Device",
    group: "ESP32/AT",
    payload: "AT+RST",
    mode: "TEXT",
    encoding: "UTF-8",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "scan_wifi",
    name: "Scan WiFi",
    group: "ESP32/AT",
    payload: "AT+CWLAP",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Lists available Access Points",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // --- HC-05 Bluetooth ---
  {
    id: "hc05_state",
    name: "Check State",
    group: "HC-05",
    payload: "AT+STATE?",
    mode: "TEXT",
    encoding: "UTF-8",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "hc05_ver",
    name: "Firmware Ver",
    group: "HC-05",
    payload: "AT+VERSION?",
    mode: "TEXT",
    encoding: "UTF-8",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // --- GPS ---
  {
    id: "4",
    name: "Get Coordinates",
    group: "GPS",
    payload: "$GPGGA",
    mode: "TEXT",
    encoding: "ASCII",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // --- Modbus ---
  {
    id: "mb_read_reg",
    name: "Read Holding Regs",
    group: "Modbus",
    payload: "01 03 00 00 00 02 C4 0B",
    mode: "HEX",
    description:
      "Read 2 registers starting at address 0 from Slave 1 (Static Example)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // --- Advanced / Scripting Examples ---
  {
    id: "script_frame_test",
    name: "Custom Framer Test",
    group: "Scripting Examples",
    payload: "START_STREAM",
    mode: "TEXT",
    description:
      "Demonstrates a custom framing script that combines all chunks into one frame.",
    responseFraming: {
      strategy: "SCRIPT",
      delimiter: "",
      timeout: 0,
      prefixLengthSize: 1,
      byteOrder: "LE",
      script: `// Simple Accumulator
// Merge all chunks into one frame if forceFlush is true, else wait.
if (forceFlush) {
    const totalLen = chunks.reduce((acc, c) => acc + c.data.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for(const c of chunks) {
        merged.set(c.data, offset);
        offset += c.data.length;
    }
    return { 
        frames: [{ data: merged, timestamp: Date.now() }], 
        remaining: [] 
    };
}
return { frames: [], remaining: chunks };`,
    },
    framingPersistence: "TRANSIENT",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "bin_parser",
    name: "Binary Parser",
    group: "Scripting Examples",
    payload: "AA 55 01",
    mode: "HEX",
    description:
      "Parses a binary response [HEAD] [VAL] [TAIL] and extracts VAL.",
    scripting: {
      enabled: true,
      postResponseScript: `// Expecting AA 55 XX
if (raw.length >= 3 && raw[0] === 0xAA && raw[1] === 0x55) {
    const val = raw[2];
    setVar("Sensor", val);
    return true; // Success
}
// Keep waiting if not enough bytes
if (raw.length < 3) return undefined;
return "Invalid Header";`,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "json_extract",
    name: "JSON Extractor",
    group: "Scripting Examples",
    payload: "GET_DATA",
    mode: "TEXT",
    description:
      'Parses JSON response like {"temp": 25.5} and updates dashboard.',
    scripting: {
      enabled: true,
      postResponseScript: `try {
    const json = JSON.parse(data);
    if (json.temp) setVar("Temp", json.temp);
    if (json.humid) setVar("Humidity", json.humid);
    return true;
} catch(e) {
    // Partial JSON? Wait more
    if (data.trim().endsWith('}')) return "Invalid JSON";
    return undefined;
}`,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "param_math",
    name: "Parameter Math",
    group: "Scripting Examples",
    payload: "",
    mode: "HEX",
    description: "Calculates high/low bytes from a single integer parameter.",
    parameters: [
      {
        id: "p1",
        name: "val",
        type: "INTEGER",
        label: "Value (0-65535)",
        min: 0,
        max: 65535,
        defaultValue: 1024,
      },
    ],
    scripting: {
      enabled: true,
      preRequestScript: `const val = params.val;
const hi = (val >> 8) & 0xFF;
const lo = val & 0xFF;
return [0xAA, 0x02, hi, lo, 0x55];`,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // GPS / NMEA COMMANDS
  // ============================================================================
  {
    id: "nmea_gprmc",
    name: "Request RMC (Position/Velocity)",
    group: "GPS/NMEA",
    payload: "$GPRMC",
    mode: "TEXT",
    encoding: "ASCII",
    description: "Recommended Minimum Specific GPS/Transit Data",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "nmea_gpgsa",
    name: "Request GSA (DOP/Active Sats)",
    group: "GPS/NMEA",
    payload: "$GPGSA",
    mode: "TEXT",
    encoding: "ASCII",
    description: "GPS DOP and Active Satellites",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "ublox_poll_nav",
    name: "u-blox Poll NAV-PVT",
    group: "GPS/u-blox",
    payload: "B5 62 01 07 00 00 08 19",
    mode: "HEX",
    description: "Poll Position/Velocity/Time solution (UBX protocol)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // MODBUS COMMANDS
  // ============================================================================
  {
    id: "mb_read_input",
    name: "Read Input Registers",
    group: "Modbus RTU",
    payload: "01 04 00 00 00 02 71 CB",
    mode: "HEX",
    description: "FC04: Read 2 input registers from Slave 1 at address 0",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "mb_write_coil",
    name: "Write Single Coil",
    group: "Modbus RTU",
    payload: "01 05 00 00 FF 00 8C 3A",
    mode: "HEX",
    description: "FC05: Write coil ON at address 0 on Slave 1",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "mb_write_reg",
    name: "Write Single Register",
    group: "Modbus RTU",
    payload: "01 06 00 00 00 64 89 D7",
    mode: "HEX",
    description: "FC06: Write value 100 to register 0 on Slave 1",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // 3D PRINTER / MARLIN COMMANDS
  // ============================================================================
  {
    id: "marlin_home",
    name: "Home All Axes",
    group: "3D Printer/Marlin",
    payload: "G28",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Home X, Y, and Z axes",
    validation: {
      enabled: true,
      mode: "PATTERN",
      matchType: "CONTAINS",
      pattern: "ok",
      timeout: 60000,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "marlin_temp",
    name: "Report Temperatures",
    group: "3D Printer/Marlin",
    payload: "M105",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Get current extruder and bed temperatures",
    validation: {
      enabled: true,
      mode: "PATTERN",
      matchType: "REGEX",
      pattern: "T:\\d+",
      timeout: 2000,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "marlin_set_hotend",
    name: "Set Hotend Temp",
    group: "3D Printer/Marlin",
    payload: "M104 S${temp}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set hotend temperature (no wait)",
    parameters: [
      {
        id: "temp_p",
        name: "temp",
        type: "INTEGER",
        label: "Temperature (°C)",
        min: 0,
        max: 300,
        defaultValue: 200,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "marlin_set_bed",
    name: "Set Bed Temp",
    group: "3D Printer/Marlin",
    payload: "M140 S${temp}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set bed temperature (no wait)",
    parameters: [
      {
        id: "bed_temp_p",
        name: "temp",
        type: "INTEGER",
        label: "Temperature (°C)",
        min: 0,
        max: 120,
        defaultValue: 60,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "marlin_position",
    name: "Report Position",
    group: "3D Printer/Marlin",
    payload: "M114",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Get current position",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "marlin_settings",
    name: "Report Settings",
    group: "3D Printer/Marlin",
    payload: "M503",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Report current EEPROM settings",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "marlin_fan",
    name: "Set Fan Speed",
    group: "3D Printer/Marlin",
    payload: "M106 S${speed}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set part cooling fan speed (0-255)",
    parameters: [
      {
        id: "fan_speed_p",
        name: "speed",
        type: "INTEGER",
        label: "Speed (0-255)",
        min: 0,
        max: 255,
        defaultValue: 255,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // OBD-II / ELM327 COMMANDS
  // ============================================================================
  {
    id: "elm_reset",
    name: "Reset",
    group: "OBD-II/ELM327",
    payload: "ATZ",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Reset ELM327 adapter",
    validation: {
      enabled: true,
      mode: "PATTERN",
      matchType: "CONTAINS",
      pattern: "ELM327",
      timeout: 3000,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "elm_echo_off",
    name: "Echo Off",
    group: "OBD-II/ELM327",
    payload: "ATE0",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Disable command echo",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "elm_auto_proto",
    name: "Auto Protocol",
    group: "OBD-II/ELM327",
    payload: "ATSP0",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set automatic protocol detection",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "obd_rpm",
    name: "Engine RPM",
    group: "OBD-II/ELM327",
    payload: "010C",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "PID 0C: Engine RPM",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "obd_speed",
    name: "Vehicle Speed",
    group: "OBD-II/ELM327",
    payload: "010D",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "PID 0D: Vehicle Speed (km/h)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "obd_coolant",
    name: "Coolant Temp",
    group: "OBD-II/ELM327",
    payload: "0105",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "PID 05: Engine Coolant Temperature",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "obd_throttle",
    name: "Throttle Position",
    group: "OBD-II/ELM327",
    payload: "0111",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "PID 11: Throttle Position (%)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // SCPI INSTRUMENT COMMANDS
  // ============================================================================
  {
    id: "scpi_idn",
    name: "Identify",
    group: "SCPI/Instrument",
    payload: "*IDN?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query instrument identification",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "scpi_rst",
    name: "Reset",
    group: "SCPI/Instrument",
    payload: "*RST",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Reset instrument to default state",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "scpi_opc",
    name: "Operation Complete?",
    group: "SCPI/Instrument",
    payload: "*OPC?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query operation complete status",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "scpi_error",
    name: "Query Error",
    group: "SCPI/Instrument",
    payload: ":SYST:ERR?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query system error queue",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "scpi_meas_vdc",
    name: "Measure DC Voltage",
    group: "SCPI/Instrument",
    payload: ":MEAS:VOLT:DC?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Measure DC voltage (DMM)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "scpi_meas_curr",
    name: "Measure Current",
    group: "SCPI/Instrument",
    payload: ":MEAS:CURR:DC?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Measure DC current (DMM)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // GSM/CELLULAR MODEM COMMANDS
  // ============================================================================
  {
    id: "gsm_at",
    name: "Test AT",
    group: "GSM/Cellular",
    payload: "AT",
    mode: "TEXT",
    encoding: "UTF-8",
    validation: {
      enabled: true,
      mode: "PATTERN",
      matchType: "CONTAINS",
      pattern: "OK",
      timeout: 2000,
    },
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gsm_sim_status",
    name: "SIM Status",
    group: "GSM/Cellular",
    payload: "AT+CPIN?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Check SIM card status",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gsm_signal",
    name: "Signal Quality",
    group: "GSM/Cellular",
    payload: "AT+CSQ",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query signal strength (RSSI)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gsm_operator",
    name: "Current Operator",
    group: "GSM/Cellular",
    payload: "AT+COPS?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query current network operator",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gsm_registration",
    name: "Network Registration",
    group: "GSM/Cellular",
    payload: "AT+CREG?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query network registration status",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gsm_imei",
    name: "Get IMEI",
    group: "GSM/Cellular",
    payload: "AT+GSN",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query modem IMEI number",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // ESC/POS PRINTER COMMANDS
  // ============================================================================
  {
    id: "escpos_init",
    name: "Initialize Printer",
    group: "ESC/POS Printer",
    payload: "1B 40",
    mode: "HEX",
    description: "ESC @ - Initialize printer",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "escpos_cut",
    name: "Cut Paper",
    group: "ESC/POS Printer",
    payload: "1D 56 42 00",
    mode: "HEX",
    description: "GS V B - Cut paper with feed",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "escpos_center",
    name: "Center Align",
    group: "ESC/POS Printer",
    payload: "1B 61 01",
    mode: "HEX",
    description: "ESC a 1 - Center alignment",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "escpos_double",
    name: "Double Size Text",
    group: "ESC/POS Printer",
    payload: "1D 21 11",
    mode: "HEX",
    description: "GS ! - Double height and width",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "escpos_normal",
    name: "Normal Size Text",
    group: "ESC/POS Printer",
    payload: "1D 21 00",
    mode: "HEX",
    description: "GS ! - Normal character size",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // PROJECTOR / AV COMMANDS
  // ============================================================================
  {
    id: "pjlink_power_on",
    name: "Power On",
    group: "Projector/PJLink",
    payload: "%1POWR 1",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Turn projector on (PJLink Class 1)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "pjlink_power_off",
    name: "Power Off",
    group: "Projector/PJLink",
    payload: "%1POWR 0",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Turn projector off (PJLink Class 1)",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "pjlink_power_query",
    name: "Power Status",
    group: "Projector/PJLink",
    payload: "%1POWR ?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query power status",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "pjlink_lamp",
    name: "Lamp Hours",
    group: "Projector/PJLink",
    payload: "%1LAMP ?",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Query lamp usage hours",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },

  // ============================================================================
  // CNC / G-CODE COMMANDS
  // ============================================================================
  {
    id: "gcode_home",
    name: "Home All",
    group: "CNC/G-code",
    payload: "G28",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Return to home position",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gcode_abs",
    name: "Absolute Mode",
    group: "CNC/G-code",
    payload: "G90",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set absolute positioning mode",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gcode_rel",
    name: "Relative Mode",
    group: "CNC/G-code",
    payload: "G91",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Set relative (incremental) positioning mode",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gcode_spindle_on",
    name: "Spindle On CW",
    group: "CNC/G-code",
    payload: "M03 S${speed}",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Start spindle clockwise at specified RPM",
    parameters: [
      {
        id: "spindle_speed_p",
        name: "speed",
        type: "INTEGER",
        label: "RPM",
        min: 0,
        max: 30000,
        defaultValue: 1000,
      },
    ],
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
  {
    id: "gcode_spindle_off",
    name: "Spindle Off",
    group: "CNC/G-code",
    payload: "M05",
    mode: "TEXT",
    encoding: "UTF-8",
    description: "Stop spindle",
    creator: "System",
    createdAt: now,
    updatedAt: now,
    usedBy: [],
  },
];

export const DEFAULT_PRESETS: SerialPreset[] = [
  // ============================================================================
  // ESP32 TEST DEVICE (Serial Protocol Tester)
  // ============================================================================
  {
    id: "p_test_device",
    name: "ESP32 Test Device (Setup)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // IoT & EMBEDDED SYSTEMS
  // ============================================================================
  {
    id: "p1",
    name: "ESP32 / Arduino (115200)",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 115200, lineEnding: "CRLF" },
    widgets: [],
  },
  {
    id: "p_esp32_debug",
    name: "ESP32 Debug Console",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_arduino_9600",
    name: "Arduino Uno (9600)",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 9600, lineEnding: "CRLF" },
    widgets: [],
  },
  {
    id: "p_hc05",
    name: "HC-05 Bluetooth (38400)",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 38400, lineEnding: "CRLF" },
    widgets: [],
  },
  {
    id: "p_rpi_pico",
    name: "Raspberry Pi Pico",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 115200, lineEnding: "LF" },
    widgets: [],
  },

  // ============================================================================
  // INDUSTRIAL AUTOMATION
  // ============================================================================
  {
    id: "p_modbus_9600",
    name: "Modbus RTU (9600, Even Parity)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      parity: "Even",
      lineEnding: "NONE",
      framing: { ...DEFAULT_CONFIG.framing, strategy: "TIMEOUT", timeout: 50 },
    },
    widgets: [],
  },
  {
    id: "p_modbus_19200",
    name: "Modbus RTU (19200, Even Parity)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 19200,
      parity: "Even",
      lineEnding: "NONE",
      framing: { ...DEFAULT_CONFIG.framing, strategy: "TIMEOUT", timeout: 35 },
    },
    widgets: [],
  },
  {
    id: "p_plc_siemens",
    name: "Siemens PLC (MPI)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 19200,
      parity: "Even",
      lineEnding: "NONE",
    },
    widgets: [],
  },

  // ============================================================================
  // GPS & NAVIGATION
  // ============================================================================
  {
    id: "p_gps_nmea",
    name: "GPS NMEA 0183 (4800)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 4800,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_gps_ublox",
    name: "u-blox GPS (9600)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_gps_high_speed",
    name: "GPS High-Speed (115200)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // SCIENTIFIC & LABORATORY
  // ============================================================================
  {
    id: "p_scpi",
    name: "SCPI Instrument (9600)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "LF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_scpi_fast",
    name: "SCPI Instrument (115200)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "LF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_balance",
    name: "Laboratory Balance (9600, 7E1)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      dataBits: "Seven",
      parity: "Even",
      lineEnding: "CRLF",
    },
    widgets: [],
  },

  // ============================================================================
  // RETAIL & POS
  // ============================================================================
  {
    id: "p_escpos",
    name: "ESC/POS Printer (19200)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 19200,
      flowControl: "Hardware",
      lineEnding: "NONE",
    },
    widgets: [],
  },
  {
    id: "p_barcode",
    name: "Barcode Scanner (9600)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // 3D PRINTING & CNC
  // ============================================================================
  {
    id: "p_3dprinter",
    name: "3D Printer / Marlin (115200)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "LF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_3dprinter_250k",
    name: "3D Printer (250000)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 250000,
      lineEnding: "LF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_cnc_legacy",
    name: "CNC Legacy (9600, 7E2, XON/XOFF)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      dataBits: "Seven",
      parity: "Even",
      stopBits: "Two",
      flowControl: "Software",
      lineEnding: "CRLF",
    },
    widgets: [],
  },
  {
    id: "p_cnc_modern",
    name: "CNC Modern (115200)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "LF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\n",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // TELECOMMUNICATIONS
  // ============================================================================
  {
    id: "p_gsm_modem",
    name: "GSM/LTE Modem (115200)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      flowControl: "Hardware",
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_sim800",
    name: "SIM800 GSM (9600)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // AUTOMOTIVE
  // ============================================================================
  {
    id: "p_obd2_elm327",
    name: "OBD-II / ELM327 (38400)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 38400,
      lineEnding: "CR",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: ">",
      },
    },
    widgets: [],
  },
  {
    id: "p_obd2_stn",
    name: "OBD-II / STN1110 (115200)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "CR",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: ">",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // BUILDING AUTOMATION
  // ============================================================================
  {
    id: "p_bacnet_mstp",
    name: "BACnet MS/TP (38400)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 38400,
      lineEnding: "NONE",
      framing: { ...DEFAULT_CONFIG.framing, strategy: "TIMEOUT", timeout: 20 },
    },
    widgets: [],
  },

  // ============================================================================
  // MARINE & MARITIME
  // ============================================================================
  {
    id: "p_nmea_marine",
    name: "Marine NMEA 0183 (4800)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 4800,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },
  {
    id: "p_ais",
    name: "AIS Transponder (38400)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 38400,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r\n",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // ROBOTICS
  // ============================================================================
  {
    id: "p_dynamixel",
    name: "Dynamixel Servos (1000000)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 1000000,
      lineEnding: "NONE",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 1,
        byteOrder: "LE",
      },
    },
    widgets: [],
  },
  {
    id: "p_pololu",
    name: "Pololu Servo Controller",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "NONE",
    },
    widgets: [],
  },

  // ============================================================================
  // SECURITY & ACCESS CONTROL
  // ============================================================================
  {
    id: "p_rfid_pn532",
    name: "PN532 RFID/NFC",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 115200,
      lineEnding: "NONE",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 1,
      },
    },
    widgets: [],
  },

  // ============================================================================
  // AV & PRODUCTION
  // ============================================================================
  {
    id: "p_projector",
    name: "Projector Control (9600)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "CR",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\r",
      },
    },
    widgets: [],
  },
  {
    id: "p_av_switcher",
    name: "AV Matrix/Switcher (9600)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "CRLF",
    },
    widgets: [],
  },

  // ============================================================================
  // ENERGY & UTILITIES
  // ============================================================================
  {
    id: "p_smart_meter",
    name: "Smart Meter IEC 62056 (9600, 7E1)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      dataBits: "Seven",
      parity: "Even",
      lineEnding: "CRLF",
    },
    widgets: [],
  },

  // ============================================================================
  // WEATHER & ENVIRONMENT
  // ============================================================================
  {
    id: "p_weather",
    name: "Weather Station (9600)",
    type: "SERIAL",
    config: {
      ...DEFAULT_CONFIG,
      baudRate: 9600,
      lineEnding: "CRLF",
      framing: {
        ...DEFAULT_CONFIG.framing,
        strategy: "DELIMITER",
        delimiter: "\n",
      },
    },
    widgets: [],
  },

  // ============================================================================
  // GENERIC / DEBUGGING
  // ============================================================================
  {
    id: "p_generic_9600",
    name: "Generic 9600 8N1",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 9600 },
    widgets: [],
  },
  {
    id: "p_generic_19200",
    name: "Generic 19200 8N1",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 19200 },
    widgets: [],
  },
  {
    id: "p_generic_57600",
    name: "Generic 57600 8N1",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 57600 },
    widgets: [],
  },
  {
    id: "p_generic_230400",
    name: "Generic 230400 8N1",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 230400 },
    widgets: [],
  },
  {
    id: "p_generic_460800",
    name: "Generic 460800 8N1",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 460800 },
    widgets: [],
  },
  {
    id: "p_generic_921600",
    name: "Generic 921600 8N1",
    type: "SERIAL",
    config: { ...DEFAULT_CONFIG, baudRate: 921600 },
    widgets: [],
  },
];

// ============================================================================
// RE-EXPORT MODULAR DEFAULTS (Protocol System)
// ============================================================================
// These are the new Device/Protocol/Command entity system defaults
export {
  DEFAULT_PROTOCOLS,
  PROTOCOL_AT_COMMANDS,
  PROTOCOL_ELM327,
  PROTOCOL_ESP32_TEST_DEVICE,
  PROTOCOL_GPS_NMEA,
  PROTOCOL_MARLIN,
  PROTOCOL_MODBUS_RTU,
  PROTOCOL_SCPI,
} from "./defaults/protocols";

export {
  DEFAULT_DEVICES,
  DEVICE_3D_PRINTER_MARLIN,
  DEVICE_AT_GENERIC,
  DEVICE_ESP32_TEST,
  DEVICE_GPS_RECEIVER,
  DEVICE_MODBUS_GENERIC,
  DEVICE_OBD2_ELM327,
  DEVICE_SCPI_INSTRUMENT,
} from "./defaults/devices";
