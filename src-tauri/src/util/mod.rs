use serialport5::{ DataBits, FlowControl, Parity, StopBits };

use crate::error::{ CmdError, CmdErrorCode, CmdResult };

pub fn parse_data_bits(value: &str) -> CmdResult<DataBits> {
    match value {
        "Five" => Ok(DataBits::Five),
        "Six" => Ok(DataBits::Six),
        "Seven" => Ok(DataBits::Seven),
        "Eight" => Ok(DataBits::Eight),
        _ =>
            Err(CmdError {
                code: CmdErrorCode::InvalidParam,
                msg: "the data_bits param must be one of: Five, Six, Seven, Eight".to_string(),
            }),
    }
}

pub fn parse_flow_control(value: &str) -> CmdResult<FlowControl> {
    match value {
        "None" => Ok(FlowControl::None),
        "Software" => Ok(FlowControl::Software),
        "Hardware" => Ok(FlowControl::Hardware),
        _ =>
            Err(CmdError {
                code: CmdErrorCode::InvalidParam,
                msg: "the flow_control param must be one of: None, Software, Hardware".to_string(),
            }),
    }
}

pub fn parse_parity(value: &str) -> CmdResult<Parity> {
    match value {
        "None" => Ok(Parity::None),
        "Odd" => Ok(Parity::Odd),
        "Even" => Ok(Parity::Even),
        _ =>
            Err(CmdError {
                code: CmdErrorCode::InvalidParam,
                msg: "the parity param must be one of: None, Odd, Even".to_string(),
            }),
    }
}

pub fn parse_stop_bits(value: &str) -> CmdResult<StopBits> {
    match value {
        "One" => Ok(StopBits::One),
        "Two" => Ok(StopBits::Two),
        _ =>
            Err(CmdError {
                code: CmdErrorCode::InvalidParam,
                msg: "the stop_bits param must be one of: One, Two".to_string(),
            }),
    }
}
