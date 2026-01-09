
import { SerialOptions, SerialPortInfo } from '../types';
import { GenericPort } from './connection';

export interface ISerialPort extends GenericPort {
    open(options: SerialOptions): Promise<void>;
    getInfo(): Partial<SerialPortInfo>;
    getSignals(): Promise<any>;
}

export interface ISerialProvider {
    isSupported(): boolean;
    getPorts(): Promise<ISerialPort[]>;
    requestPort(): Promise<ISerialPort | null>;
    addEventListener(type: string, listener: (e: Event) => void): void;
    removeEventListener(type: string, listener: (e: Event) => void): void;
}

class WebSerialProvider implements ISerialProvider {
    isSupported() { 
        return typeof navigator !== 'undefined' && 'serial' in navigator; 
    }
    
    async getPorts() {
        if (!this.isSupported()) return [];
        try {
            const ports = await navigator.serial.getPorts();
            return ports as unknown as ISerialPort[];
        } catch (e) {
            // Handle cases where Feature Policy/Permissions Policy blocks 'serial'
            // This prevents the app from crashing if running in a restricted iframe
            console.warn("Web Serial API getPorts blocked or failed:", e);
            return [];
        }
    }

    async requestPort() {
        if (!this.isSupported()) return null;
        try {
            const port = await navigator.serial.requestPort();
            return port as unknown as ISerialPort;
        } catch (e) {
            // User cancelled or error
            console.debug('Request port cancelled or failed', e);
            return null;
        }
    }

    addEventListener(type: string, listener: (e: Event) => void) {
        if (this.isSupported()) navigator.serial.addEventListener(type, listener);
    }

    removeEventListener(type: string, listener: (e: Event) => void) {
        if (this.isSupported()) navigator.serial.removeEventListener(type, listener);
    }
}

// Singleton export - can be swapped for Electron/Native provider in the future
export const serialService = new WebSerialProvider();
