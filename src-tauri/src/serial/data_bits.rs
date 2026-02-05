use std::{fmt, str::FromStr};

use rootcause::{report, Report};

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, specta::Type)]
pub enum DataBits {
    Five,
    Six,
    Seven,
    Eight,
}

impl FromStr for DataBits {
    type Err = Report;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "five" | "Five" => Ok(Self::Five),
            "six" | "Six" => Ok(Self::Six),
            "seven" | "Seven" => Ok(Self::Seven),
            "eight" | "Eight" => Ok(Self::Eight),
            _ => Err(report!("unknown data bits: {}", s)),
        }
    }
}

impl fmt::Display for DataBits {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("DataBits: ")?;
        let str = match self {
            Self::Five => "five",
            Self::Six => "six",
            Self::Seven => "seven",
            Self::Eight => "eight",
        };
        f.write_str(str)
    }
}
