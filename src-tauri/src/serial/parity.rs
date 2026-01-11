use std::{fmt, str::FromStr};

use rootcause::{report, Report};

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum Parity {
    Odd,
    Even,
    None,
}

impl FromStr for Parity {
    type Err = Report;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "odd" | "Odd" => Ok(Self::Odd),
            "even" | "Even" => Ok(Self::Even),
            "none" | "None" => Ok(Self::None),
            _ => Err(report!("unknown parity: {}", s)),
        }
    }
}

impl fmt::Display for Parity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::Odd => "odd",
            Self::Even => "even",
            Self::None => "none",
        };
        f.write_str(s)
    }
}
