
import { SerialConfig, NetworkConfig, SavedCommand, SerialPreset } from '../types';

export const DEFAULT_CONFIG: SerialConfig = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none',
    bufferSize: 1000,
    lineEnding: 'CRLF',
    framing: {
        strategy: 'NONE',
        delimiter: '',
        timeout: 50,
        prefixLengthSize: 1,
        byteOrder: 'LE'
    }
};
  
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
      host: 'localhost',
      port: 8080
};

const now = Date.now();
export const DEFAULT_COMMANDS: SavedCommand[] = [
    // --- ESP32 / Generic AT ---
    { 
        id: '1', name: 'AT Check', group: 'ESP32/AT', payload: 'AT', mode: 'TEXT', encoding: 'UTF-8',
        validation: { enabled: true, mode: 'PATTERN', matchType: 'CONTAINS', pattern: 'OK', timeout: 2000 },
        creator: 'System', createdAt: now, updatedAt: now, usedBy: []
    },
    { id: '2', name: 'Get Version', group: 'ESP32/AT', payload: 'AT+GMR', mode: 'TEXT', encoding: 'UTF-8', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
    { id: '3', name: 'Reset Device', group: 'ESP32/AT', payload: 'AT+RST', mode: 'TEXT', encoding: 'UTF-8', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
    { id: 'scan_wifi', name: 'Scan WiFi', group: 'ESP32/AT', payload: 'AT+CWLAP', mode: 'TEXT', encoding: 'UTF-8', description: 'Lists available Access Points', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },

    // --- HC-05 Bluetooth ---
    { id: 'hc05_state', name: 'Check State', group: 'HC-05', payload: 'AT+STATE?', mode: 'TEXT', encoding: 'UTF-8', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
    { id: 'hc05_ver', name: 'Firmware Ver', group: 'HC-05', payload: 'AT+VERSION?', mode: 'TEXT', encoding: 'UTF-8', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
    
    // --- GPS ---
    { id: '4', name: 'Get Coordinates', group: 'GPS', payload: '$GPGGA', mode: 'TEXT', encoding: 'ASCII', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
    
    // --- Modbus ---
    { 
        id: 'mb_read_reg', 
        name: 'Read Holding Regs', 
        group: 'Modbus', 
        payload: '01 03 00 00 00 02 C4 0B', 
        mode: 'HEX', 
        description: 'Read 2 registers starting at address 0 from Slave 1 (Static Example)', 
        creator: 'System', createdAt: now, updatedAt: now, usedBy: [] 
    },

    // --- Advanced / Scripting Examples ---
    { 
        id: 'script_frame_test', 
        name: 'Custom Framer Test', 
        group: 'Scripting Examples', 
        payload: 'START_STREAM', 
        mode: 'TEXT', 
        description: 'Demonstrates a custom framing script that combines all chunks into one frame.',
        responseFraming: {
            strategy: 'SCRIPT',
            delimiter: '', timeout: 0, prefixLengthSize: 1, byteOrder: 'LE',
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
return { frames: [], remaining: chunks };`
        },
        framingPersistence: 'TRANSIENT',
        creator: 'System', createdAt: now, updatedAt: now, usedBy: [] 
    },
    {
        id: 'bin_parser',
        name: 'Binary Parser',
        group: 'Scripting Examples', 
        payload: 'AA 55 01',
        mode: 'HEX',
        description: 'Parses a binary response [HEAD] [VAL] [TAIL] and extracts VAL.',
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
return "Invalid Header";`
        },
        creator: 'System', createdAt: now, updatedAt: now, usedBy: []
    },
    {
        id: 'json_extract',
        name: 'JSON Extractor',
        group: 'Scripting Examples', 
        payload: 'GET_DATA',
        mode: 'TEXT',
        description: 'Parses JSON response like {"temp": 25.5} and updates dashboard.',
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
}`
        },
        creator: 'System', createdAt: now, updatedAt: now, usedBy: []
    },
    {
        id: 'param_math',
        name: 'Parameter Math',
        group: 'Scripting Examples', 
        payload: '',
        mode: 'HEX',
        description: 'Calculates high/low bytes from a single integer parameter.',
        parameters: [
            { id: 'p1', name: 'val', type: 'INTEGER', label: 'Value (0-65535)', min: 0, max: 65535, defaultValue: 1024 }
        ],
        scripting: {
            enabled: true,
            preRequestScript: `const val = params.val;
const hi = (val >> 8) & 0xFF;
const lo = val & 0xFF;
return [0xAA, 0x02, hi, lo, 0x55];`
        },
        creator: 'System', createdAt: now, updatedAt: now, usedBy: []
    }
];

export const DEFAULT_PRESETS: SerialPreset[] = [
    { 
        id: 'p1', 
        name: 'ESP32 / Arduino (115200)', 
        type: 'SERIAL', 
        config: { ...DEFAULT_CONFIG, baudRate: 115200, lineEnding: 'CRLF' },
        widgets: []
    }
];
