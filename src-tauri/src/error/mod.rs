use std::default;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub enum RustErrorType {
    NoError,
    ErrorAcquireRwLock,
    ChannelDisconnected,
    HashMapError,
}

#[derive(Debug, Clone)]
pub enum ErrorType {
    Serial(serialport5::ErrorKind),
    Rust(RustErrorType),
}
impl Default for ErrorType {
    fn default() -> Self {
        ErrorType::Rust(RustErrorType::NoError)
    }
}

#[derive(Debug, Clone, Default)]
pub struct InnerError {
    pub code: ErrorType,
    pub msg: String,
}

impl From<serialport5::Error> for InnerError {
    fn from(value: serialport5::Error) -> Self {
        InnerError {
            code: ErrorType::Serial(value.kind),
            msg: value.description,
        }
    }
}

pub type InnerResult<T> = Result<T, InnerError>;

#[derive(Debug, Serialize, Clone)]
pub enum CmdErrorCode {
    NoError,
    RustRwLock,
    RustChannelDisconnect,
    RustAsyncTimeout,
    RustHashMapError,
    RustCreateFileFailed,

    SerialNoDevice,
    SerialInvalidInput,
    SerialUnknown,
    SerialIoError,

    InvalidParam,
}

#[derive(Debug, Serialize, Clone)]
pub struct CmdError {
    pub code: CmdErrorCode,
    pub msg: String,
}

impl From<InnerError> for CmdError {
    fn from(value: InnerError) -> Self {
        let code = match value.code {
            ErrorType::Rust(rust_error) => match rust_error {
                RustErrorType::ErrorAcquireRwLock => CmdErrorCode::RustRwLock,
                RustErrorType::ChannelDisconnected => CmdErrorCode::RustChannelDisconnect,
                RustErrorType::NoError => CmdErrorCode::NoError,
                RustErrorType::HashMapError => CmdErrorCode::RustHashMapError,
            },
            ErrorType::Serial(serial_error) => match serial_error {
                serialport5::ErrorKind::InvalidInput => CmdErrorCode::SerialInvalidInput,
                serialport5::ErrorKind::NoDevice => CmdErrorCode::SerialNoDevice,
                serialport5::ErrorKind::Unknown => CmdErrorCode::SerialUnknown,
                serialport5::ErrorKind::Io(_) => CmdErrorCode::SerialIoError,
            },
        };
        CmdError {
            code: code,
            msg: value.msg,
        }
    }
}

pub type CmdResult<T> = Result<T, CmdError>;
