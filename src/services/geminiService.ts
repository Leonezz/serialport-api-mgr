
import { GoogleGenAI, Tool, FunctionDeclaration, Type } from "@google/genai";
import { SavedCommand, SerialConfig, LogEntry, ProjectContext, SerialSequence, SerialPreset, DashboardWidget } from "../types";
import { formatContent } from "../lib/utils";
import { useStore } from "../lib/store";
import { AIProjectResultSchema } from "../lib/schemas"; // Import Zod schema

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Function Declarations (Tools) ---

const updateConfigTool: FunctionDeclaration = {
  name: 'update_serial_configuration',
  description: 'Update the serial port configuration settings (Baud rate, parity, etc). Use this when the user mentions connection parameters.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      baudRate: { type: Type.INTEGER, description: 'Baud rate (e.g. 9600, 115200)' },
      dataBits: { type: Type.INTEGER, description: 'Data bits (7 or 8)' },
      stopBits: { type: Type.INTEGER, description: 'Stop bits (1 or 2)' },
      parity: { type: Type.STRING, description: 'Parity: "none", "even", or "odd"' },
      lineEnding: { type: Type.STRING, description: 'Line Ending: "NONE", "LF", "CR", "CRLF"' }
    },
    required: []
  }
};

const sendCommandTool: FunctionDeclaration = {
  name: 'send_serial_command',
  description: 'Send a text or hex string to the connected serial device. Use this when the user asks to send data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      payload: { type: Type.STRING, description: 'The content to send. If hex, provide string like "AA BB"' },
      mode: { type: Type.STRING, description: 'Format of the payload: "TEXT" or "HEX". Default to TEXT.' }
    },
    required: ['payload']
  }
};

const executeSavedCommandTool: FunctionDeclaration = {
  name: 'execute_saved_command',
  description: 'Execute a pre-saved command by its ID. Prefer this over sending raw data if a matching command exists.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      commandId: { type: Type.STRING, description: 'The ID of the saved command to execute' }
    },
    required: ['commandId']
  }
};

const runSequenceTool: FunctionDeclaration = {
  name: 'run_sequence',
  description: 'Run a pre-defined sequence of commands by its ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sequenceId: { type: Type.STRING, description: 'The ID of the sequence to run' }
    },
    required: ['sequenceId']
  }
};

const loadPresetTool: FunctionDeclaration = {
    name: 'load_preset',
    description: 'Load a saved configuration preset by ID.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            presetId: { type: Type.STRING, description: 'The ID of the preset to load' }
        },
        required: ['presetId']
    }
};

const readLogsTool: FunctionDeclaration = {
  name: 'read_recent_logs',
  description: 'Read the most recent logs from the serial console to analyze traffic.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      count: { type: Type.INTEGER, description: 'Number of recent log entries to retrieve. Default 50.' }
    }
  }
};

const configureDeviceTool: FunctionDeclaration = {
  name: 'configure_device',
  description: 'Setup the workspace with a complete profile. Capable of generating complex commands with parameters and scripts.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      config: {
        type: Type.OBJECT,
        description: 'Serial Port Configuration',
        properties: {
           baudRate: { type: Type.INTEGER },
           dataBits: { type: Type.INTEGER },
           stopBits: { type: Type.INTEGER },
           parity: { type: Type.STRING },
           lineEnding: { type: Type.STRING }
        }
      },
      commands: {
        type: Type.ARRAY,
        description: 'List of commands to add',
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                payload: { type: Type.STRING, description: "Static payload or placeholder if scripting is used" },
                mode: { type: Type.STRING, enum: ['TEXT', 'HEX'] },
                group: { type: Type.STRING },
                description: { type: Type.STRING },
                parameters: {
                    type: Type.ARRAY,
                    description: "Dynamic parameters for this command",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Variable name used in script" },
                            label: { type: Type.STRING, description: "Human readable label" },
                            type: { type: Type.STRING, enum: ['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'ENUM'] },
                            min: { type: Type.NUMBER },
                            max: { type: Type.NUMBER },
                            defaultValue: { type: Type.STRING },
                            description: { type: Type.STRING },
                            options: {
                                type: Type.ARRAY,
                                description: "For ENUM type only",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        label: { type: Type.STRING },
                                        value: { type: Type.STRING } // API expects string or number, simplifying to string for JSON schema
                                    }
                                }
                            }
                        },
                        required: ['name', 'type', 'label']
                    }
                },
                scripting: {
                    type: Type.OBJECT,
                    description: "Required if parameters are present. Logic to build the payload.",
                    properties: {
                        enabled: { type: Type.BOOLEAN },
                        preRequestScript: { type: Type.STRING, description: "JS code. EXECUTION ENV: `params` and `payload` are passed as arguments. DO NOT redeclare them. Return string/array." }
                    }
                },
                validation: {
                    type: Type.OBJECT,
                    properties: {
                        enabled: { type: Type.BOOLEAN },
                        mode: { type: Type.STRING },
                        matchType: { type: Type.STRING },
                        pattern: { type: Type.STRING },
                        timeout: { type: Type.INTEGER }
                    }
                }
            },
            required: ['name', 'mode']
        }
      },
      sequences: {
          type: Type.ARRAY,
          description: 'List of sequences (macros)',
          items: {
              type: Type.OBJECT,
              properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  steps: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              commandName: { type: Type.STRING, description: 'Must match a name in the commands list' },
                              delay: { type: Type.INTEGER },
                              stopOnError: { type: Type.BOOLEAN }
                          }
                      }
                  }
              }
          }
      }
    }
  }
};

const manageDashboardTool: FunctionDeclaration = {
  name: 'manage_dashboard',
  description: 'Manage the telemetry dashboard widgets. Use this to visualize variables (create charts, gauges, cards) or remove them.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['CREATE', 'DELETE', 'LIST'], description: 'Action to perform: CREATE, DELETE, or LIST.' },
      variableName: { type: Type.STRING, description: 'The data variable key to visualize (e.g. "Temperature"). Required for CREATE.' },
      title: { type: Type.STRING, description: 'Display title for the widget. Optional.' },
      widgetType: { type: Type.STRING, enum: ['CARD', 'LINE', 'GAUGE'], description: 'Type of widget. Defaults to CARD.' },
      min: { type: Type.NUMBER, description: 'Minimum value for Gauge/Chart.' },
      max: { type: Type.NUMBER, description: 'Maximum value for Gauge/Chart.' },
      unit: { type: Type.STRING, description: 'Unit label (e.g. "V", "RPM").' }
    },
    required: ['action']
  }
};

const TOOLS: Tool[] = [
  {
    functionDeclarations: [
        updateConfigTool, 
        sendCommandTool, 
        executeSavedCommandTool,
        runSequenceTool,
        loadPresetTool,
        readLogsTool, 
        configureDeviceTool,
        manageDashboardTool
    ]
  }
];

// --- Helper to record tokens ---
const recordUsage = (response: any) => {
    if (response?.usageMetadata) {
        useStore.getState().addTokenUsage({
            prompt: response.usageMetadata.promptTokenCount || 0,
            response: response.usageMetadata.candidatesTokenCount || 0
        });
    }
    return {
        prompt: response?.usageMetadata?.promptTokenCount || 0,
        response: response?.usageMetadata?.candidatesTokenCount || 0,
        total: (response?.usageMetadata?.promptTokenCount || 0) + (response?.usageMetadata?.candidatesTokenCount || 0)
    };
};

// --- API Methods ---

export interface ProjectSummary {
    commands: SavedCommand[];
    sequences: SerialSequence[];
    presets: SerialPreset[];
    widgets?: DashboardWidget[]; // Optional widgets from active session
}

export interface AIProjectResult {
  deviceName?: string;
  config?: Partial<SerialConfig>;
  sourceText?: string;
  commands: any[];
  sequences: any[];
  usage?: { prompt: number; response: number; total: number };
}

export const getGeminiChatModel = () => {
  return 'gemini-3-flash-preview';
};

export const createChatSession = (projectState?: ProjectSummary) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  
  let resourceContext = "";
  if (projectState) {
      resourceContext = `
      **EXISTING PROJECT RESOURCES:**
      The user has the following saved items. REFER to them by ID when calling tools.
      
      Commands:
      ${projectState.commands.map(c => `- [ID: ${c.id}] Name: "${c.name}", Group: "${c.group || 'None'}", Mode: ${c.mode}`).join('\n')}
      
      Sequences:
      ${projectState.sequences.map(s => `- [ID: ${s.id}] Name: "${s.name}"`).join('\n')}
      
      Presets (Configs):
      ${projectState.presets.map(p => `- [ID: ${p.id}] Name: "${p.name}" (${p.type})`).join('\n')}

      Dashboard Widgets (Active Session):
      ${projectState.widgets?.map(w => `- Title: "${w.title}", Var: "${w.variableName}", Type: ${w.config.type}`).join('\n') || 'None'}
      `;
  }

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      tools: TOOLS,
      systemInstruction: `
        You are "SerialMan AI", an expert Embedded Systems Engineer and Assistant.
        
        **Capabilities:**
        - Analyze serial logs and explain protocols (Modbus, AT Commands, Binary, etc.).
        - Control the serial port: Open, Configure, Send Data.
        - Manage the project: Create/Edit Commands and Sequences.
        - **Dashboard:** Create charts and gauges to visualize variable data (using \`manage_dashboard\`).
        
        **Project Awareness:**
        ${resourceContext}

        **Rules for Interaction:**
        1. **Resource Priority**: If a user asks to "send the reset command" and you see a saved command named "Reset" in the list above, use the \`execute_saved_command\` tool with its ID. Do NOT use \`send_serial_command\` with raw bytes unless no saved command matches.
        2. **Pre-condition Checks**: 
           - Before sending data, assume the port might be closed. If you attempt to send and get an error, advise the user to connect.
           - To change settings, use \`update_serial_configuration\` or \`load_preset\`.
        3. **Command Generation**:
           - If a command supports dynamic input (like "Set Voltage to X"), suggest creating a command with **Parameters** using \`configure_device\`.
           - **Do NOT** show raw JSON configuration in the chat text unless explicitly asked. Instead, say "I can create a command for that..." and call the tool.
        4. **Visualizations**:
           - If the user asks to "graph temperature", first ensure there is a variable for it (or create one implicitly by creating a widget for it). Use \`manage_dashboard\` to create widgets.
        
        **Scripting Rules (JavaScript for Commands):**
        - **Execution Environment**: The script runs inside a function where \`params\` and \`payload\` are ALREADY defined.
        - **Input**: \`params\` (Object), \`payload\` (String).
        - **Output**: Return a string (TEXT mode) or array of numbers (HEX mode).
        - Example: \`const high = (params.val >> 8) & 0xFF; return [0x06, high, low];\`
      `
    }
  });
};

export const analyzeSerialLog = async (
    logs: LogEntry[], 
    contexts: Map<string, ProjectContext>
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not configured. Please check your environment variables.";
  }

  try {
    // 1. Format Logs
    const logLines = logs.map(l => {
        let line = `[${new Date(l.timestamp).toISOString().split('T')[1]}] ${l.direction}: ${formatContent(l.data, l.format)}`;
        if (l.contextId && contexts.has(l.contextId)) {
            line += ` [Ref: Context_${l.contextId}]`;
        }
        return line;
    }).join('\n');

    // 2. Extract unique referenced contexts
    const referencedContextIds = new Set(logs.map(l => l.contextId).filter(Boolean) as string[]);
    let contextBlock = "";
    
    if (referencedContextIds.size > 0) {
        contextBlock = "\n\nReferenced Contexts/Documentation:\n";
        referencedContextIds.forEach(id => {
            const ctx = contexts.get(id);
            if (ctx) {
                // Truncate large contexts to avoid token limits, prioritizing the beginning
                const contentSnippet = ctx.content.length > 500 ? ctx.content.substring(0, 500) + "...(truncated)" : ctx.content;
                contextBlock += `--- Context_${id} (${ctx.title}) ---\n${contentSnippet}\n\n`;
            }
        });
    }

    const prompt = `
      You are an expert Embedded Systems Engineer. 
      Analyze the following serial port log data.
      
      Context Info:
      - 'TX' is data sent to the device.
      - 'RX' is data received from the device.
      - Some logs reference "Context" IDs. These map to the documentation provided below. Use this documentation to decode specific commands or error codes.
      
      Task:
      1. Identify the protocol.
      2. Spot errors/warnings.
      3. Explain the communication flow using the provided Context documentation.
      4. If binary (HEX), decode it using the Context if applicable.
      
      ${contextBlock}

      Log Data:
      ${logLines}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    recordUsage(response);

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to analyze logs. The model might be overloaded or the logs are too large.";
  }
};

export const generateProjectFromDescription = async (
  text: string, 
  attachment?: { name: string; mimeType: string; data: string }
): Promise<AIProjectResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not configured.");
  }

  const promptText = `
    You are an expert embedded systems engineer.
    Extract a complete Serial Port Project Configuration from the provided content (text description, manual, or datasheet).
    
    **CRITICAL FEATURE: DYNAMIC PARAMETERS**
    The system supports dynamic commands. If a command in the manual has variable parts (e.g. "Set Frequency to [X]", "Read Register [Y]"), do NOT create static payloads.
    Instead, define \`parameters\` and a \`preRequestScript\` to generate the payload dynamically.

    **Scripting Guide (JavaScript):**
    - **Execution Environment**: The script runs inside a function where \`params\` and \`payload\` are ALREADY defined as arguments.
    - **Rules**:
      1. **DO NOT redeclare** \`params\` or \`payload\` (e.g. NO \`const params = ...\`).
      2. **Input**:
         - \`params\` (Object): Contains user inputs (e.g. \`params.freq\`).
         - \`payload\` (String): The static payload field.
      3. **Output**: 
         - For TEXT mode: Return a string (e.g. \`return "FREQ " + params.freq;\`).
         - For HEX mode: Return an array of numbers (e.g. \`return [0x01, 0x03, params.reg];\`).
    - You can use \`Math\`, bitwise operators, etc.

    **Input Context:**
    "${text}"

    **Output Schema (JSON Only):**
    {
      "deviceName": "Short Device Name",
      "config": {
         "baudRate": 115200, 
         "lineEnding": "CRLF" // "NONE", "LF", "CR", "CRLF"
         // ... include other serial settings if found
      },
      "commands": [
        {
          "name": "Set Frequency",
          "group": "Control",
          "mode": "TEXT", // or "HEX"
          "description": "Sets device frequency in Hz",
          "parameters": [
             {
               "name": "freq",
               "label": "Frequency (Hz)",
               "type": "INTEGER", // STRING, INTEGER, FLOAT, BOOLEAN, ENUM
               "min": 100,
               "max": 1000,
               "defaultValue": 500
             }
          ],
          "scripting": {
             "enabled": true,
             "preRequestScript": "return 'SETF ' + params.freq;"
          },
          "validation": { "enabled": true, "mode": "PATTERN", "pattern": "OK" }
        }
      ],
      "sequences": [
         // ... sequences if applicable
      ]
    }
  `;

  const parts: any[] = [{ text: promptText }];

  if (attachment) {
    parts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    const usage = recordUsage(response);

    const jsonStr = response.text?.trim() || "{}";
    const cleanJson = jsonStr.replace(/^```json/, '').replace(/```$/, '');
    
    const rawResult = JSON.parse(cleanJson);
    
    // Validate with Zod
    const validatedResult = AIProjectResultSchema.parse(rawResult);
    
    // Hydrate result with usage and source (which Zod strips or doesn't know about from AI raw)
    return {
        ...validatedResult,
        sourceText: text + (attachment ? ` [Attached File: ${attachment.name}]` : ''),
        usage
    } as AIProjectResult;

  } catch (error: any) {
    console.error("Gemini Project Gen Error:", error);
    if (error.issues) {
        // Zod Error
        throw new Error(`AI generated invalid configuration structure: ${error.issues.map((i: any) => i.message).join(', ')}`);
    }
    throw new Error("Failed to generate project configuration. Please check the input/file and try again.");
  }
};
