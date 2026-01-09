
export interface GenericPort {
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    close: () => Promise<void>;
    setSignals?: (signals: any) => Promise<void>;
}

export class NetworkPort implements GenericPort {
    ws: WebSocket;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    closed: Promise<void>;
    
    constructor(url: string, onDisconnect: () => void) {
        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';
        
        let resolveClosed: () => void;
        this.closed = new Promise((resolve) => { resolveClosed = resolve; });

        this.readable = new ReadableStream({
            start: (controller) => {
                this.ws.onmessage = (event) => {
                    if (event.data instanceof ArrayBuffer) {
                        controller.enqueue(new Uint8Array(event.data));
                    } else if (typeof event.data === 'string') {
                        controller.enqueue(new TextEncoder().encode(event.data));
                    }
                };
                this.ws.onclose = () => {
                    onDisconnect();
                    controller.close();
                    resolveClosed();
                };
                this.ws.onerror = (e) => {
                    console.error("WebSocket Error", e);
                    controller.error(e);
                };
            }
        });

        this.writable = new WritableStream({
            write: (chunk) => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(chunk);
                }
            },
            close: () => {
                this.ws.close();
            }
        });
    }

    waitForOpen(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws.readyState === WebSocket.OPEN) return resolve();
            this.ws.onopen = () => resolve();
            this.ws.onerror = (e) => reject(e);
        });
    }

    async close() {
        this.ws.close();
        await this.closed;
    }
}
