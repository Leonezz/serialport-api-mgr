//! ESC/POS thermal printer emulator
//!
//! Emulates a thermal receipt printer that accepts ESC/POS commands.
//! Primarily useful for testing printer communication without a physical device.

use crate::types::SimulatedData;

/// ESC/POS command bytes
const ESC: u8 = 0x1B;
const GS: u8 = 0x1D;
const DLE: u8 = 0x10;
const FS: u8 = 0x1C;

/// Printer status bits
const STATUS_ONLINE: u8 = 0x00;
const STATUS_DRAWER_OPEN: u8 = 0x04;
const STATUS_PAPER_PRESENT: u8 = 0x00;
const STATUS_PAPER_END: u8 = 0x0C;

/// ESC/POS Printer emulator state
pub struct EscPosEmulator {
    /// Print buffer (accumulated text)
    buffer: Vec<u8>,
    /// Current character set
    charset: u8,
    /// Bold mode enabled
    bold: bool,
    /// Underline mode
    underline: u8,
    /// Double width
    double_width: bool,
    /// Double height
    double_height: bool,
    /// Justification (0=left, 1=center, 2=right)
    justify: u8,
    /// Paper present
    paper_present: bool,
    /// Drawer open
    drawer_open: bool,
    /// Error state
    has_error: bool,
    /// Total bytes received
    bytes_received: u32,
    /// Total lines printed
    lines_printed: u32,
}

impl EscPosEmulator {
    pub fn new() -> Self {
        Self {
            buffer: Vec::new(),
            charset: 0,
            bold: false,
            underline: 0,
            double_width: false,
            double_height: false,
            justify: 0,
            paper_present: true,
            drawer_open: false,
            has_error: false,
            bytes_received: 0,
            lines_printed: 0,
        }
    }

    /// Process incoming ESC/POS data
    /// Returns response bytes if the command requires a response
    pub fn process(&mut self, data: &[u8], _sim_data: &SimulatedData) -> Option<Vec<u8>> {
        self.bytes_received += data.len() as u32;

        if data.is_empty() {
            return None;
        }

        let mut i = 0;
        let mut response: Option<Vec<u8>> = None;

        while i < data.len() {
            match data[i] {
                // DLE commands (real-time status)
                DLE => {
                    if i + 1 < data.len() {
                        response = self.handle_dle_command(data[i + 1]);
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                // ESC commands
                ESC => {
                    if i + 1 < data.len() {
                        let consumed = self.handle_esc_command(&data[i..]);
                        i += consumed.max(2);
                    } else {
                        i += 1;
                    }
                }
                // GS commands
                GS => {
                    if i + 1 < data.len() {
                        let (consumed, resp) = self.handle_gs_command(&data[i..]);
                        if resp.is_some() {
                            response = resp;
                        }
                        i += consumed.max(2);
                    } else {
                        i += 1;
                    }
                }
                // FS commands (kanji)
                FS => {
                    if i + 1 < data.len() {
                        i += 2; // Skip FS commands for now
                    } else {
                        i += 1;
                    }
                }
                // Line feed
                0x0A => {
                    self.print_line();
                    i += 1;
                }
                // Carriage return (ignored)
                0x0D => {
                    i += 1;
                }
                // Form feed / cut
                0x0C => {
                    self.cut_paper();
                    i += 1;
                }
                // Regular printable character
                _ => {
                    self.buffer.push(data[i]);
                    i += 1;
                }
            }
        }

        response
    }

    /// Handle DLE (real-time) commands
    fn handle_dle_command(&self, cmd: u8) -> Option<Vec<u8>> {
        match cmd {
            // DLE EOT n - Transmit real-time status
            0x04 => {
                // Return basic status
                Some(vec![self.get_status_byte(1)])
            }
            // DLE ENQ n - Send real-time request
            0x05 => Some(vec![STATUS_ONLINE]),
            // DLE DC4 - Generate pulse (drawer kick)
            0x14 => {
                log::info!("ESC/POS: Cash drawer kick");
                None
            }
            _ => None,
        }
    }

    /// Handle ESC commands
    fn handle_esc_command(&mut self, data: &[u8]) -> usize {
        if data.len() < 2 {
            return 1;
        }

        match data[1] {
            // ESC @ - Initialize printer
            b'@' => {
                self.initialize();
                log::info!("ESC/POS: Printer initialized");
                2
            }
            // ESC ! n - Select print mode
            b'!' => {
                if data.len() >= 3 {
                    self.set_print_mode(data[2]);
                    3
                } else {
                    2
                }
            }
            // ESC E n - Bold on/off
            b'E' => {
                if data.len() >= 3 {
                    self.bold = data[2] != 0;
                    3
                } else {
                    2
                }
            }
            // ESC - n - Underline on/off
            b'-' => {
                if data.len() >= 3 {
                    self.underline = data[2];
                    3
                } else {
                    2
                }
            }
            // ESC a n - Justification
            b'a' => {
                if data.len() >= 3 {
                    self.justify = data[2] % 3;
                    3
                } else {
                    2
                }
            }
            // ESC d n - Print and feed n lines
            b'd' => {
                if data.len() >= 3 {
                    let lines = data[2] as u32;
                    for _ in 0..lines {
                        self.print_line();
                    }
                    3
                } else {
                    2
                }
            }
            // ESC p m t1 t2 - Generate pulse
            b'p' => {
                log::info!("ESC/POS: Pulse generated");
                if data.len() >= 5 {
                    5
                } else {
                    2
                }
            }
            // ESC t n - Select character code table
            b't' => {
                if data.len() >= 3 {
                    self.charset = data[2];
                    3
                } else {
                    2
                }
            }
            // ESC R n - Select international character set
            b'R' => {
                if data.len() >= 3 {
                    3
                } else {
                    2
                }
            }
            // ESC c 5 n - Enable/disable panel buttons
            b'c' => {
                if data.len() >= 4 {
                    4
                } else {
                    2
                }
            }
            _ => 2,
        }
    }

    /// Handle GS commands
    fn handle_gs_command(&mut self, data: &[u8]) -> (usize, Option<Vec<u8>>) {
        if data.len() < 2 {
            return (1, None);
        }

        match data[1] {
            // GS V - Cut paper
            b'V' => {
                if data.len() >= 3 {
                    self.cut_paper();
                    log::info!("ESC/POS: Paper cut");
                    (3, None)
                } else {
                    (2, None)
                }
            }
            // GS ! n - Select character size
            b'!' => {
                if data.len() >= 3 {
                    let n = data[2];
                    self.double_width = (n & 0x10) != 0;
                    self.double_height = (n & 0x01) != 0;
                    (3, None)
                } else {
                    (2, None)
                }
            }
            // GS r n - Transmit status
            b'r' => {
                if data.len() >= 3 {
                    let status = self.get_status_byte(data[2]);
                    (3, Some(vec![status]))
                } else {
                    (2, None)
                }
            }
            // GS a n - Enable/disable ASB
            b'a' => {
                if data.len() >= 3 {
                    (3, None)
                } else {
                    (2, None)
                }
            }
            // GS ( A - Execute test print
            b'(' => {
                if data.len() >= 6 && data[2] == b'A' {
                    log::info!("ESC/POS: Test print executed");
                    (6, None)
                } else {
                    (2, None)
                }
            }
            // GS k - Print barcode
            b'k' => {
                // Variable length, just skip a reasonable amount
                log::info!("ESC/POS: Barcode print");
                (4, None)
            }
            // GS ( k - Print 2D barcode (QR, PDF417, etc.)
            // This is complex, simplified handling
            _ => (2, None),
        }
    }

    /// Initialize printer to default state
    fn initialize(&mut self) {
        self.buffer.clear();
        self.charset = 0;
        self.bold = false;
        self.underline = 0;
        self.double_width = false;
        self.double_height = false;
        self.justify = 0;
        self.has_error = false;
    }

    /// Set print mode from ESC ! command
    fn set_print_mode(&mut self, mode: u8) {
        self.bold = (mode & 0x08) != 0;
        self.double_height = (mode & 0x10) != 0;
        self.double_width = (mode & 0x20) != 0;
        self.underline = if (mode & 0x80) != 0 { 1 } else { 0 };
    }

    /// Simulate printing a line
    fn print_line(&mut self) {
        if !self.buffer.is_empty() {
            let text = String::from_utf8_lossy(&self.buffer);
            log::debug!(
                "ESC/POS Print: [{}] {}{}{}",
                match self.justify {
                    1 => "CENTER",
                    2 => "RIGHT",
                    _ => "LEFT",
                },
                if self.bold { "<B>" } else { "" },
                text,
                if self.bold { "</B>" } else { "" }
            );
            self.buffer.clear();
        }
        self.lines_printed += 1;
    }

    /// Simulate paper cut
    fn cut_paper(&mut self) {
        self.print_line(); // Flush buffer first
        log::info!("ESC/POS: --- PAPER CUT --- (Lines printed: {})", self.lines_printed);
    }

    /// Get status byte for status queries
    fn get_status_byte(&self, status_type: u8) -> u8 {
        match status_type {
            // Printer status
            1 => {
                let mut status = 0u8;
                if !self.paper_present {
                    status |= 0x20; // Paper end
                }
                if self.has_error {
                    status |= 0x40; // Error
                }
                status
            }
            // Offline status
            2 => {
                let mut status = 0u8;
                if !self.paper_present {
                    status |= 0x04; // Paper end
                }
                status
            }
            // Error status
            3 => {
                if self.has_error {
                    0x08
                } else {
                    0x00
                }
            }
            // Paper roll sensor status
            4 => {
                if self.paper_present {
                    STATUS_PAPER_PRESENT
                } else {
                    STATUS_PAPER_END
                }
            }
            _ => 0x00,
        }
    }

    /// Get emulator statistics
    pub fn get_stats(&self) -> (u32, u32) {
        (self.bytes_received, self.lines_printed)
    }

    /// Set paper present state (for testing paper-out scenarios)
    pub fn set_paper_present(&mut self, present: bool) {
        self.paper_present = present;
    }

    /// Set error state
    pub fn set_error(&mut self, error: bool) {
        self.has_error = error;
    }
}

impl Default for EscPosEmulator {
    fn default() -> Self {
        Self::new()
    }
}

/// Simple stateless processing (creates emulator per call)
pub fn process_escpos_data(data: &[u8], sim_data: &SimulatedData) -> Option<Vec<u8>> {
    let mut emulator = EscPosEmulator::new();
    emulator.process(data, sim_data)
}

/// Format a text line for ESC/POS printing (helper for testing)
pub fn format_receipt_line(text: &str, width: usize) -> String {
    if text.len() >= width {
        text[..width].to_string()
    } else {
        format!("{:width$}", text, width = width)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initialize() {
        let mut emu = EscPosEmulator::new();
        let sim_data = SimulatedData::default();

        // Send ESC @ (initialize)
        let data = [ESC, b'@'];
        let response = emu.process(&data, &sim_data);
        assert!(response.is_none()); // Initialize doesn't return data
    }

    #[test]
    fn test_status_query() {
        let mut emu = EscPosEmulator::new();
        let sim_data = SimulatedData::default();

        // Send DLE EOT 1 (query printer status)
        let data = [DLE, 0x04];
        let response = emu.process(&data, &sim_data);
        assert!(response.is_some());
        assert_eq!(response.unwrap().len(), 1);
    }

    #[test]
    fn test_print_and_cut() {
        let mut emu = EscPosEmulator::new();
        let sim_data = SimulatedData::default();

        // Print some text, then cut
        let data = b"Hello World\nTest Line\x1DV\x00";
        emu.process(data, &sim_data);

        let (bytes, lines) = emu.get_stats();
        assert!(bytes > 0);
        assert!(lines >= 2);
    }

    #[test]
    fn test_paper_status() {
        let mut emu = EscPosEmulator::new();
        let sim_data = SimulatedData::default();

        // Check paper present status
        emu.set_paper_present(true);
        let data = [GS, b'r', 4]; // Query paper sensor
        let response = emu.process(&data, &sim_data);
        assert!(response.is_some());
        assert_eq!(response.unwrap()[0], STATUS_PAPER_PRESENT);

        // Check paper out status
        emu.set_paper_present(false);
        let response = emu.process(&data, &sim_data);
        assert!(response.is_some());
        assert_eq!(response.unwrap()[0], STATUS_PAPER_END);
    }
}
