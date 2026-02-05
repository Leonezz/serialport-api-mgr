use std::{fmt, str::FromStr};

use rootcause::{report, Report};

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, specta::Type)]
pub enum FlowControl {
    Hardware,
    Software,
    None,
}

impl FromStr for FlowControl {
    type Err = Report;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "hardware" | "Hardware" => Ok(Self::Hardware),
            "software" | "Software" => Ok(Self::Software),
            "none" | "None" => Ok(Self::None),
            _ => Err(report!("unknown flow control: {}", s)),
        }
    }
}

impl fmt::Display for FlowControl {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::Hardware => "hardware",
            Self::Software => "software",
            Self::None => "none",
        };
        f.write_str(s)
    }
}
