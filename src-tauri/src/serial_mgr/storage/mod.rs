mod entity;

use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectOptions, Database, DatabaseConnection, EntityTrait,
    QueryFilter, QueryOrder, QuerySelect, Set,
};
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// Re-export the entity Model as LogEntry for external use
pub use entity::Model as LogEntry;

/// Storage for serial port logs using SeaORM with SQLite.
#[derive(Clone)]
pub struct Storage {
    #[allow(dead_code)]
    db_path: PathBuf,
    connection: Arc<DatabaseConnection>,
}

impl Storage {
    pub async fn new<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let db_path = path.as_ref().to_path_buf();
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let mut opt = ConnectOptions::new(&db_url);
        opt.sqlx_logging(false);

        let connection = Database::connect(opt)
            .await
            .map_err(|e| format!("Failed to connect to database: {}", e))?;

        // Create table if not exists
        Self::init_schema(&connection).await?;

        Ok(Storage {
            db_path,
            connection: Arc::new(connection),
        })
    }

    pub async fn new_in_memory() -> Self {
        let db_url = "sqlite::memory:";
        let mut opt = ConnectOptions::new(db_url);
        opt.sqlx_logging(false);

        let connection = Database::connect(opt)
            .await
            .expect("Failed to connect to in-memory database");

        Self::init_schema(&connection)
            .await
            .expect("Failed to initialize in-memory database schema");

        Storage {
            db_path: PathBuf::from(":memory:"),
            connection: Arc::new(connection),
        }
    }

    async fn init_schema(conn: &DatabaseConnection) -> Result<(), String> {
        use sea_orm::ConnectionTrait;

        conn.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_fingerprint TEXT NOT NULL,
                session_id TEXT NOT NULL,
                vid TEXT,
                pid TEXT,
                serial_number TEXT,
                port_name TEXT NOT NULL,
                direction TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                data BLOB NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_session_id ON logs(session_id);
            CREATE INDEX IF NOT EXISTS idx_device_fingerprint ON logs(device_fingerprint);
            "#,
        )
        .await
        .map_err(|e| format!("Failed to initialize schema: {}", e))?;

        Ok(())
    }

    pub async fn insert(
        &self,
        device_fingerprint: &str,
        session_id: &str,
        vid: Option<&str>,
        pid: Option<&str>,
        serial_number: Option<&str>,
        port_name: &str,
        direction: &str,
        data: &[u8],
    ) -> Result<i64, String> {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        let model = entity::ActiveModel {
            id: sea_orm::ActiveValue::NotSet,
            device_fingerprint: Set(device_fingerprint.to_string()),
            session_id: Set(session_id.to_string()),
            vid: Set(vid.map(|s| s.to_string())),
            pid: Set(pid.map(|s| s.to_string())),
            serial_number: Set(serial_number.map(|s| s.to_string())),
            port_name: Set(port_name.to_string()),
            direction: Set(direction.to_string()),
            timestamp: Set(timestamp),
            data: Set(data.to_vec()),
        };

        let result = model
            .insert(self.connection.as_ref())
            .await
            .map_err(|e| format!("Failed to insert log: {}", e))?;

        Ok(result.id)
    }

    pub async fn get_by_session(
        &self,
        session_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<LogEntry>, String> {
        entity::Entity::find()
            .filter(entity::Column::SessionId.eq(session_id))
            .order_by_desc(entity::Column::Timestamp)
            .limit(Some(limit as u64))
            .offset(Some(offset as u64))
            .all(self.connection.as_ref())
            .await
            .map_err(|e| format!("Failed to query logs by session: {}", e))
    }

    #[allow(dead_code)]
    pub async fn get_by_device(
        &self,
        fingerprint: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<LogEntry>, String> {
        entity::Entity::find()
            .filter(entity::Column::DeviceFingerprint.eq(fingerprint))
            .order_by_desc(entity::Column::Timestamp)
            .limit(Some(limit as u64))
            .offset(Some(offset as u64))
            .all(self.connection.as_ref())
            .await
            .map_err(|e| format!("Failed to query logs by device: {}", e))
    }
}

impl Default for Storage {
    fn default() -> Self {
        // For Default, we need a synchronous way to create storage
        // This creates a placeholder that should be replaced with proper async initialization
        // In practice, AppState initialization should use Storage::new_in_memory().await

        // Use tokio's block_in_place if we're in a tokio runtime, otherwise panic
        let rt = tokio::runtime::Handle::try_current();
        match rt {
            Ok(handle) => handle.block_on(async { Storage::new_in_memory().await }),
            Err(_) => {
                // Create a temporary runtime for initialization
                let rt = tokio::runtime::Runtime::new().expect("Failed to create runtime");
                rt.block_on(async { Storage::new_in_memory().await })
            }
        }
    }
}

pub fn generate_device_fingerprint(
    port_name: &str,
    port_type: &crate::serial::port_type::PortType,
) -> String {
    match port_type {
        crate::serial::port_type::PortType::UsbPort(usb) => {
            let serial = usb.serial_number.as_deref().unwrap_or("unknown");
            format!("usb:{:04X}:{:04X}:{}", usb.vid, usb.pid, serial)
        }
        _ => format!("port:{}", port_name),
    }
}
