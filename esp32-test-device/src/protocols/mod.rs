//! Protocol emulators for various serial device types

pub mod at;
pub mod elm327;
pub mod marlin;
pub mod nmea;
pub mod scpi;

pub use at::process_at_command;
pub use elm327::process_elm327_command;
pub use marlin::process_marlin_gcode;
pub use nmea::generate_nmea_sentence;
pub use scpi::process_scpi_command;
