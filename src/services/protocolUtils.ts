
// Utility to calculate CRC16-MODBUS
const calculateModbusCRC = (buffer: Uint8Array): Uint8Array => {
    let crc = 0xFFFF;
    for (let i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];
        for (let j = 0; j < 8; j++) {
            if ((crc & 1) !== 0) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc = crc >> 1;
            }
        }
    }
    // Modbus is Little Endian for CRC (Low Byte, High Byte)
    return new Uint8Array([crc & 0xFF, (crc >> 8) & 0xFF]);
};

export interface ModbusParams {
    slaveId: number;
    functionCode: number;
    startAddress: number;
    quantityOrValue: number;
}

export const generateModbusFrame = (params: ModbusParams): string => {
    const { slaveId, functionCode, startAddress, quantityOrValue } = params;
    
    // Frame structure: [SlaveID] [Func] [AddrHi] [AddrLo] [QtyHi] [QtyLo]
    const frame = new Uint8Array(6);
    frame[0] = slaveId;
    frame[1] = functionCode;
    
    // Big Endian for Data
    frame[2] = (startAddress >> 8) & 0xFF;
    frame[3] = startAddress & 0xFF;
    
    frame[4] = (quantityOrValue >> 8) & 0xFF;
    frame[5] = quantityOrValue & 0xFF;

    const crc = calculateModbusCRC(frame);
    
    // Convert to Hex String for the App
    const fullFrame = new Uint8Array(8);
    fullFrame.set(frame);
    fullFrame.set(crc, 6);

    return Array.from(fullFrame)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
};

export const MODBUS_FUNCTIONS = [
    { code: 1, name: '01 - Read Coils' },
    { code: 2, name: '02 - Read Discrete Inputs' },
    { code: 3, name: '03 - Read Holding Registers' },
    { code: 4, name: '04 - Read Input Registers' },
    { code: 5, name: '05 - Write Single Coil' },
    { code: 6, name: '06 - Write Single Register' },
];

export const AT_COMMAND_LIBRARY = {
    'General': [
        { cmd: 'AT', desc: 'Test communication' },
        { cmd: 'ATI', desc: 'Get module information' },
        { cmd: 'AT+RST', desc: 'Soft Reset' },
        { cmd: 'AT+GMR', desc: 'Get firmware version' },
        { cmd: 'ATE0', desc: 'Echo Off' },
        { cmd: 'ATE1', desc: 'Echo On' },
    ],
    'ESP8266 / ESP32': [
        { cmd: 'AT+CWMODE=1', desc: 'Set Station Mode (WiFi Client)' },
        { cmd: 'AT+CWJAP="SSID","PASSWORD"', desc: 'Connect to Access Point' },
        { cmd: 'AT+CIFSR', desc: 'Get IP Address' },
        { cmd: 'AT+CIPSTART="TCP","host",80', desc: 'Start TCP connection' },
    ],
    'GSM (SIM800/900)': [
        { cmd: 'AT+CPIN?', desc: 'Check SIM status' },
        { cmd: 'AT+CSQ', desc: 'Signal Quality' },
        { cmd: 'AT+CREG?', desc: 'Network Registration' },
        { cmd: 'AT+CMGF=1', desc: 'Set SMS Text Mode' },
        { cmd: 'AT+CMGS="+123456789"', desc: 'Send SMS (Requires Ctrl+Z after)' },
    ]
};
