
import { useState } from 'react';
import { SerialConfig, NetworkConfig, SerialPreset, SavedCommand, SerialSequence, ProjectContext } from '../../types';
import { generateId } from '../lib/utils';

// Defaults
const DEFAULT_CONFIG: SerialConfig = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none',
    bufferSize: 1000,
    lineEnding: 'CRLF',
    framing: {
        strategy: 'NONE',
        delimiter: '',
        timeout: 50,
        prefixLengthSize: 1,
        byteOrder: 'LE'
    }
};
  
const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
      host: 'localhost',
      port: 8080
};
  
const DEFAULT_PRESETS: SerialPreset[] = [
    { 
      id: 'p1', 
      name: 'ESP32 / Arduino (115200)', 
      type: 'SERIAL',
      config: { ...DEFAULT_CONFIG, baudRate: 115200, lineEnding: 'CRLF' } 
    },
    { 
      id: 'p2', 
      name: 'GPS Module (9600)', 
      type: 'SERIAL',
      config: { ...DEFAULT_CONFIG, baudRate: 9600, lineEnding: 'CRLF' } 
    },
    {
      id: 'p3', 
      name: 'Industrial RS485 (19200E)', 
      type: 'SERIAL',
      config: { ...DEFAULT_CONFIG, baudRate: 19200, parity: 'even', lineEnding: 'CRLF' } 
    },
    {
        id: 'p4',
        name: 'Local TCP Server (8080)',
        type: 'NETWORK',
        config: DEFAULT_CONFIG,
        network: { host: 'localhost', port: 8080 }
    }
];

const now = Date.now();
const DEFAULT_COMMANDS: SavedCommand[] = [
    { 
        id: '1', name: 'AT Check', group: 'ESP32', payload: 'AT', mode: 'TEXT', encoding: 'UTF-8',
        validation: { enabled: true, mode: 'PATTERN', matchType: 'CONTAINS', pattern: 'OK', timeout: 2000 },
        creator: 'System', createdAt: now, updatedAt: now, usedBy: []
    },
    { id: '2', name: 'Get Version', group: 'ESP32', payload: 'AT+GMR', mode: 'TEXT', encoding: 'UTF-8', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
    { id: '3', name: 'Reset', group: 'ESP32', payload: 'AT+RST', mode: 'TEXT', encoding: 'UTF-8', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
    { id: '4', name: 'Get Coordinates', group: 'GPS', payload: '$GPGGA', mode: 'TEXT', encoding: 'ASCII', creator: 'System', createdAt: now, updatedAt: now, usedBy: [] },
];

export const useProjectState = () => {
    const [config, setConfig] = useState<SerialConfig>(DEFAULT_CONFIG);
    const [networkConfig, setNetworkConfig] = useState<NetworkConfig>(DEFAULT_NETWORK_CONFIG);
    const [presets, setPresets] = useState<SerialPreset[]>(DEFAULT_PRESETS);
    const [commands, setCommands] = useState<SavedCommand[]>(DEFAULT_COMMANDS);
    const [sequences, setSequences] = useState<SerialSequence[]>([]);
    const [contexts, setContexts] = useState<ProjectContext[]>([]);

    const addCommand = (cmdData: Omit<SavedCommand, 'id'>) => {
        const timestamp = Date.now();
        const newCmd: SavedCommand = {
            id: generateId(),
            ...cmdData,
            creator: 'User',
            createdAt: timestamp,
            updatedAt: timestamp,
            usedBy: []
        };
        setCommands(prev => [...prev, newCmd]);
    };

    const updateCommand = (id: string, updates: Partial<SavedCommand>) => {
        setCommands(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c));
    };

    const deleteCommand = (id: string) => {
        setCommands(prev => prev.filter(c => c.id !== id));
    };

    const updateCommandUsage = (currentSequences: SerialSequence[]) => {
        const usageMap = new Map<string, string[]>();
        commands.forEach(c => usageMap.set(c.id, []));
  
        currentSequences.forEach(seq => {
            seq.steps.forEach(step => {
                if (usageMap.has(step.commandId)) {
                    const usedBy = usageMap.get(step.commandId)!;
                    if (!usedBy.includes(seq.id)) usedBy.push(seq.id);
                }
            });
        });
  
        setCommands(prevCmds => prevCmds.map(cmd => {
            const newUsedBy = usageMap.get(cmd.id) || [];
            if (JSON.stringify(cmd.usedBy) !== JSON.stringify(newUsedBy)) {
                return { ...cmd, usedBy: newUsedBy };
            }
            return cmd;
        }));
    };

    const addSequence = (seqData: Omit<SerialSequence, 'id'>) => {
        const timestamp = Date.now();
        const newSeq: SerialSequence = {
            id: generateId(),
            ...seqData,
            creator: 'User',
            createdAt: timestamp,
            updatedAt: timestamp
        };
        const newSequences = [...sequences, newSeq];
        setSequences(newSequences);
        updateCommandUsage(newSequences);
    };

    const updateSequence = (id: string, updates: Partial<SerialSequence>) => {
        const updatedSequences = sequences.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s);
        setSequences(updatedSequences);
        updateCommandUsage(updatedSequences);
    };

    const deleteSequence = (id: string) => {
        const filtered = sequences.filter(s => s.id !== id);
        setSequences(filtered);
        updateCommandUsage(filtered);
    };

    return {
        config, setConfig,
        networkConfig, setNetworkConfig,
        presets, setPresets,
        commands, setCommands,
        sequences, setSequences,
        contexts, setContexts,
        // Helpers
        addCommand, updateCommand, deleteCommand,
        addSequence, updateSequence, deleteSequence,
        // Default Constants
        DEFAULT_CONFIG, DEFAULT_NETWORK_CONFIG
    };
};
