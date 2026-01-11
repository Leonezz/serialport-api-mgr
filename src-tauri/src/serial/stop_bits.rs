use std::{fmt, str::FromStr};

use rootcause::{report, Report};

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum StopBits {
    One,
    Two,
}

impl FromStr for StopBits {
    type Err = Report;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "one" | "One" => Ok(Self::One),
            "two" | "Two" => Ok(Self::Two),
            _ => Err(report!("unknown stop bits: {}", s)),
        }
    }
}

impl fmt::Display for StopBits {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::One => "one",
            Self::Two => "two",
        };
        f.write_str(s)
    }
}
