use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "logs")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub device_fingerprint: String,
    pub session_id: String,
    pub vid: Option<String>,
    pub pid: Option<String>,
    pub serial_number: Option<String>,
    pub port_name: String,
    pub direction: String,
    pub timestamp: i64,
    pub data: Vec<u8>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
