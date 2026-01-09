
import { GenericPort } from './connection';

export type MockPortType = 'mock-echo' | 'mock-json-stream' | 'mock-timeout-stream' | 'mock-hex-stream' | 'mock-prefix-stream';

export class MockPort implements GenericPort {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    private controller?: ReadableStreamDefaultController<Uint8Array>;
    private active: boolean = true;
    // Fix: Use any instead of NodeJS.Timeout to avoid namespace errors in pure browser environments
    private interval?: any;

    constructor(private type: string) {
        this.readable = new ReadableStream({
            start: (controller) => {
                this.controller = controller;
                this.startGenerator();
            },
            cancel: () => {
                this.active = false;
                this.cleanup();
            }
        });

        this.writable = new WritableStream({
            write: async (chunk) => {
                // Handle incoming data (simulate device processing)
                if (this.type === 'mock-echo') {
                    // Echo back with slight delay
                    await new Promise(r => setTimeout(r, 10));
                    if (this.active && this.controller) {
                        this.controller.enqueue(chunk);
                    }
                }
                // Other mocks could respond to specific commands here if needed
            }
        });
    }

    private async startGenerator() {
        if (this.type === 'mock-json-stream') {
            // Fragmented JSON generator
            let counter = 0;
            this.interval = setInterval(() => {
                if (!this.active || !this.controller) return;
                counter++;
                const mode = Math.random();
                
                if (mode < 0.4) {
                    const msg = `{"id":${counter},"val":${(Math.random()*100).toFixed(1)}}\n`;
                    this.controller.enqueue(new TextEncoder().encode(msg));
                } else if (mode < 0.7) {
                    const msg = `{"id":${counter},"type":"frag","val":${(Math.random()*100).toFixed(1)}}\n`;
                    const bytes = new TextEncoder().encode(msg);
                    const split = Math.floor(bytes.length / 2);
                    this.controller.enqueue(bytes.slice(0, split));
                    setTimeout(() => {
                        if(this.active && this.controller) this.controller.enqueue(bytes.slice(split));
                    }, 20);
                } else {
                    const msg1 = `{"id":${counter},"t":"burst1"}\n`;
                    const msg2 = `{"id":${counter+1},"t":"burst2"}\n`;
                    counter++;
                    this.controller.enqueue(new TextEncoder().encode(msg1 + msg2));
                }
            }, 800);
        } 
        else if (this.type === 'mock-timeout-stream') {
            // Burst generator for Timeout Framing validation
            let counter = 0;
            const loop = async () => {
                while (this.active) {
                    counter = (counter + 1) % 100;
                    if (this.controller) this.controller.enqueue(new TextEncoder().encode(`{"seq":${counter},"part":1}`));
                    await new Promise(r => setTimeout(r, 20)); 
                    if (!this.active) break;
                    if (this.controller) this.controller.enqueue(new TextEncoder().encode(`{"seq":${counter},"part":2}`));
                    await new Promise(r => setTimeout(r, 20)); 
                    if (!this.active) break;
                    if (this.controller) this.controller.enqueue(new TextEncoder().encode(`{"seq":${counter},"part":3}`));
                    await new Promise(r => setTimeout(r, 1000));
                }
            };
            loop();
        }
        else if (this.type === 'mock-prefix-stream') {
            // Prefix Length Generator (2 Bytes Little Endian)
            // Generates: [Len_Low] [Len_High] [Payload...]
            let counter = 0;
            const loop = async () => {
                while (this.active) {
                    counter++;
                    // Create a random JSON payload
                    const jsonPayload = `{"id":${counter},"data":"random_${Math.floor(Math.random()*1000)}"}`;
                    const payloadBytes = new TextEncoder().encode(jsonPayload);
                    const length = payloadBytes.length;
                    
                    // Header: 2 Bytes LE
                    const header = new Uint8Array(2);
                    header[0] = length & 0xFF;
                    header[1] = (length >> 8) & 0xFF;
                    
                    // Strategy: Randomly fragment the packet to test robust framing
                    // 1. Clean Send
                    // 2. Split Header (1 byte, wait, 1 byte + body)
                    // 3. Split Body (Header + half body, wait, rest)
                    
                    const mode = Math.random();
                    
                    if (mode < 0.4) {
                        // Clean
                        const fullPacket = new Uint8Array(header.length + payloadBytes.length);
                        fullPacket.set(header);
                        fullPacket.set(payloadBytes, 2);
                        if (this.controller) this.controller.enqueue(fullPacket);
                    } else if (mode < 0.7) {
                        // Split Header
                        if (this.controller) this.controller.enqueue(header.slice(0, 1));
                        await new Promise(r => setTimeout(r, 15)); // Short lag
                        if (!this.active) break;
                        
                        const rest = new Uint8Array(1 + payloadBytes.length);
                        rest.set(header.slice(1), 0);
                        rest.set(payloadBytes, 1);
                        if (this.controller) this.controller.enqueue(rest);
                    } else {
                        // Split Body
                        const splitIdx = Math.floor(payloadBytes.length / 2);
                        const firstPart = new Uint8Array(2 + splitIdx);
                        firstPart.set(header);
                        firstPart.set(payloadBytes.slice(0, splitIdx), 2);
                        if (this.controller) this.controller.enqueue(firstPart);
                        
                        await new Promise(r => setTimeout(r, 20)); // Lag
                        if (!this.active) break;
                        
                        if (this.controller) this.controller.enqueue(payloadBytes.slice(splitIdx));
                    }
                    
                    await new Promise(r => setTimeout(r, 800));
                }
            };
            loop();
        }
    }

    private cleanup() {
        if (this.interval) clearInterval(this.interval);
    }

    async close() {
        this.active = false;
        this.cleanup();
    }
}
