use rootcause::Report;

pub type AckSender<T> = tokio::sync::mpsc::Sender<(T, Option<tokio::sync::oneshot::Sender<()>>)>;
pub type AckReceiver<T> =
    tokio::sync::mpsc::Receiver<(T, Option<tokio::sync::oneshot::Sender<()>>)>;

pub async fn acked_send<T: Send + Sync + 'static>(
    message: T,
    sender: &AckSender<T>,
) -> Result<(), Report> {
    let (ack_tx, ack_rs) = tokio::sync::oneshot::channel();
    sender.send((message, Some(ack_tx))).await?;
    let _ = ack_rs.await?;
    Ok(())
}

pub type InterruptSender = tokio::sync::broadcast::Sender<()>;
pub type InterruptReceiver = tokio::sync::broadcast::Receiver<()>;
