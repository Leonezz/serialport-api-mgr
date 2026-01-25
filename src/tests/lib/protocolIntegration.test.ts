import { describe, it, expect } from "vitest";
import {
  getEffectiveCommand,
  instantiateFromProtocol,
  syncProtocolLayer,
  commandNeedsSync,
  getCommandsSyncStatus,
  detachFromProtocol,
  migrateCommand,
} from "@/lib/protocolIntegration";
import type { SavedCommand, ProtocolLayer, CommandLayer } from "@/types";
import type {
  Protocol,
  CommandTemplate,
  SimpleCommand,
  StructuredCommand,
  MessageStructure,
} from "@/lib/protocolTypes";

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

const createMockProtocol = (overrides: Partial<Protocol> = {}): Protocol => ({
  id: "proto-1",
  name: "Test Protocol",
  version: "1.0.0",
  description: "Test protocol",
  commands: [],
  messageStructures: [],
  createdAt: Date.now() - 10000,
  updatedAt: Date.now() - 10000,
  tags: [],
  ...overrides,
});

const createMockSimpleCommand = (
  overrides: Partial<SimpleCommand> = {},
): SimpleCommand => ({
  id: "cmd-1",
  name: "Test Command",
  type: "SIMPLE",
  description: "A test command",
  payload: "AT+TEST",
  mode: "TEXT",
  encoding: "UTF-8",
  parameters: [],
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  tags: [],
  ...overrides,
});

const createMockStructuredCommand = (
  overrides: Partial<StructuredCommand> = {},
): StructuredCommand => ({
  id: "struct-cmd-1",
  name: "Structured Command",
  type: "STRUCTURED",
  description: "A structured command",
  messageStructureId: "msg-struct-1",
  parameters: [],
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  tags: [],
  ...overrides,
});

const createMockSavedCommand = (
  overrides: Partial<SavedCommand> = {},
): SavedCommand => ({
  id: "saved-cmd-1",
  name: "Saved Command",
  source: "CUSTOM",
  creator: "USER",
  payload: "AT+HELLO",
  mode: "TEXT",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createMockMessageStructure = (
  overrides: Partial<MessageStructure> = {},
): MessageStructure => ({
  id: "msg-struct-1",
  name: "Test Structure",
  description: "A test message structure",
  byteOrder: "BE",
  encoding: "BINARY",
  elements: [],
  ...overrides,
});

// ============================================================================
// getEffectiveCommand TESTS
// ============================================================================

describe("getEffectiveCommand", () => {
  describe("CUSTOM source commands", () => {
    it("should return legacy fields directly for CUSTOM commands", () => {
      const command = createMockSavedCommand({
        source: "CUSTOM",
        name: "My Custom Command",
        description: "Custom description",
        payload: "CUSTOM_PAYLOAD",
        mode: "HEX",
        encoding: "ASCII",
        parameters: [
          {
            id: "p1",
            name: "freq",
            type: "INTEGER",
            defaultValue: 100,
          },
        ],
        validation: {
          enabled: true,
          mode: "PATTERN",
          pattern: "OK",
          matchType: "CONTAINS",
          timeout: 3000,
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.name).toBe("My Custom Command");
      expect(result.description).toBe("Custom description");
      expect(result.payload).toBe("CUSTOM_PAYLOAD");
      expect(result.mode).toBe("HEX");
      expect(result.encoding).toBe("ASCII");
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("freq");
      expect(result.validation?.enabled).toBe(true);
      expect(result.validation?.pattern).toBe("OK");
    });

    it("should use commandLayer customName if present", () => {
      const command = createMockSavedCommand({
        source: "CUSTOM",
        name: "Original Name",
        commandLayer: {
          customName: "Overridden Name",
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.name).toBe("Overridden Name");
    });

    it("should handle missing optional fields", () => {
      const command = createMockSavedCommand({
        source: "CUSTOM",
        name: "Minimal Command",
        payload: "",
        mode: "TEXT",
      });

      const result = getEffectiveCommand(command);

      expect(result.name).toBe("Minimal Command");
      expect(result.payload).toBe("");
      expect(result.mode).toBe("TEXT");
      expect(result.parameters).toEqual([]);
    });
  });

  describe("PROTOCOL source commands", () => {
    it("should merge L1 and L2 for PROTOCOL commands", () => {
      const command = createMockSavedCommand({
        source: "PROTOCOL",
        name: "Protocol Command",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-1",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: Date.now() - 5000,
          payload: "AT+FROM_PROTOCOL",
          mode: "TEXT",
          encoding: "UTF-8",
          parameters: [
            {
              name: "param1",
              type: "STRING",
              defaultValue: "default",
            },
          ],
        },
        commandLayer: {
          customName: "User Name",
          customDescription: "User Description",
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.name).toBe("User Name");
      expect(result.description).toBe("User Description");
      expect(result.payload).toBe("AT+FROM_PROTOCOL");
      expect(result.mode).toBe("TEXT");
      expect(result.parameters).toHaveLength(1);
    });

    it("should apply parameter enhancements from L2", () => {
      const command = createMockSavedCommand({
        source: "PROTOCOL",
        name: "Protocol Command",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-1",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: Date.now(),
          payload: "SET ${value}",
          mode: "TEXT",
          parameters: [
            {
              name: "value",
              type: "INTEGER",
              defaultValue: 100,
              label: "Original Label",
            },
          ],
        },
        commandLayer: {
          parameterEnhancements: {
            value: {
              customDefault: 500,
              customLabel: "Enhanced Label",
            },
          },
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.parameters[0].defaultValue).toBe(500);
      expect(result.parameters[0].label).toBe("Enhanced Label");
    });

    it("should concatenate L1 and L2 scripts", () => {
      const command = createMockSavedCommand({
        source: "PROTOCOL",
        name: "Script Command",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-1",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: Date.now(),
          payload: "TEST",
          mode: "TEXT",
          parameters: [],
          protocolPreRequestScript: "// L1 pre-request",
          protocolPostResponseScript: "// L1 post-response",
        },
        commandLayer: {
          userPreRequestScript: "// L2 pre-request",
          userPostResponseScript: "// L2 post-response",
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.scripting?.enabled).toBe(true);
      expect(result.scripting?.preRequestScript).toContain("// L1 pre-request");
      expect(result.scripting?.preRequestScript).toContain("// L2 pre-request");
      expect(result.scripting?.postResponseScript).toContain(
        "// L1 post-response",
      );
      expect(result.scripting?.postResponseScript).toContain(
        "// L2 post-response",
      );
    });

    it("should merge extraction rules from L1 and L2", () => {
      const command = createMockSavedCommand({
        source: "PROTOCOL",
        name: "Extraction Command",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-1",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: Date.now(),
          payload: "GET",
          mode: "TEXT",
          parameters: [],
          extractVariables: [
            {
              pattern: "temp=(\\d+)",
              variableName: "Temperature",
            },
          ],
        },
        commandLayer: {
          additionalExtractions: [
            {
              id: "ext-1",
              variableName: "Humidity",
              pattern: "hum=(\\d+)",
              captureGroup: 1,
            },
          ],
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.extractionRules).toHaveLength(2);
      expect(result.extractionRules?.map((r) => r.variableName)).toContain(
        "Temperature",
      );
      expect(result.extractionRules?.map((r) => r.variableName)).toContain(
        "Humidity",
      );
    });

    it("should use L2 timeout override over L1 validation timeout", () => {
      const command = createMockSavedCommand({
        source: "PROTOCOL",
        name: "Timeout Command",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-1",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: Date.now(),
          payload: "TEST",
          mode: "TEXT",
          parameters: [],
          validation: {
            enabled: true,
            timeout: 2000,
          },
        },
        commandLayer: {
          timeoutOverride: 5000,
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.validation?.timeout).toBe(5000);
    });

    it("should use L2 framing override over L1 default framing", () => {
      const command = createMockSavedCommand({
        source: "PROTOCOL",
        name: "Framing Command",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-1",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: Date.now(),
          payload: "TEST",
          mode: "TEXT",
          parameters: [],
          defaultFraming: {
            strategy: "DELIMITER",
            delimiter: "\\n",
          },
        },
        commandLayer: {
          framingOverride: {
            strategy: "TIMEOUT",
            timeout: 100,
          },
        },
      });

      const result = getEffectiveCommand(command);

      expect(result.framing?.strategy).toBe("TIMEOUT");
    });
  });
});

// ============================================================================
// instantiateFromProtocol TESTS
// ============================================================================

describe("instantiateFromProtocol", () => {
  describe("SIMPLE templates", () => {
    it("should create a SavedCommand from a SIMPLE template", () => {
      const protocol = createMockProtocol();
      const template = createMockSimpleCommand({
        id: "simple-1",
        name: "AT Check",
        payload: "AT",
        mode: "TEXT",
        encoding: "UTF-8",
      });

      const result = instantiateFromProtocol(template, protocol);

      expect(result.name).toBe("AT Check");
      expect(result.source).toBe("PROTOCOL");
      expect(result.creator).toBe("PROTOCOL");
      expect(result.protocolLayer).toBeDefined();
      expect(result.protocolLayer?.protocolId).toBe(protocol.id);
      expect(result.protocolLayer?.protocolCommandId).toBe(template.id);
      expect(result.protocolLayer?.payload).toBe("AT");
      expect(result.protocolLayer?.mode).toBe("TEXT");
      expect(result.commandLayer).toEqual({});
    });

    it("should copy parameters from template", () => {
      const protocol = createMockProtocol();
      const template = createMockSimpleCommand({
        parameters: [
          {
            name: "frequency",
            type: "INTEGER",
            defaultValue: 1000,
            min: 100,
            max: 10000,
          },
          {
            name: "mode",
            type: "ENUM",
            options: [
              { value: "A", label: "Mode A" },
              { value: "B", label: "Mode B" },
            ],
          },
        ],
      });

      const result = instantiateFromProtocol(template, protocol);

      expect(result.protocolLayer?.parameters).toHaveLength(2);
      expect(result.protocolLayer?.parameters[0].name).toBe("frequency");
      expect(result.protocolLayer?.parameters[0].min).toBe(100);
      expect(result.protocolLayer?.parameters[1].name).toBe("mode");
      expect(result.protocolLayer?.parameters[1].options).toHaveLength(2);
    });

    it("should copy validation from template", () => {
      const protocol = createMockProtocol();
      const template = createMockSimpleCommand({
        validation: {
          enabled: true,
          successPattern: "^OK$",
          successPatternType: "REGEX",
          timeout: 3000,
        },
      });

      const result = instantiateFromProtocol(template, protocol);

      expect(result.protocolLayer?.validation?.enabled).toBe(true);
      expect(result.protocolLayer?.validation?.successPattern).toBe("^OK$");
      expect(result.protocolLayer?.validation?.successPatternType).toBe(
        "REGEX",
      );
      expect(result.protocolLayer?.validation?.timeout).toBe(3000);
    });

    it("should copy hooks as protocol scripts", () => {
      const protocol = createMockProtocol();
      const template = createMockSimpleCommand({
        hooks: {
          preRequest: "return payload.toUpperCase();",
          postResponse: "console.log('Done');",
        },
      });

      const result = instantiateFromProtocol(template, protocol);

      expect(result.protocolLayer?.protocolPreRequestScript).toBe(
        "return payload.toUpperCase();",
      );
      expect(result.protocolLayer?.protocolPostResponseScript).toBe(
        "console.log('Done');",
      );
    });

    it("should assign to device if deviceId provided", () => {
      const protocol = createMockProtocol();
      const template = createMockSimpleCommand();

      const result = instantiateFromProtocol(template, protocol, "device-123");

      expect(result.deviceId).toBe("device-123");
    });

    it("should copy protocol framing to defaultFraming", () => {
      const protocol = createMockProtocol({
        framing: {
          strategy: "DELIMITER",
          delimiter: {
            sequence: "\\r\\n",
          },
        },
      });
      const template = createMockSimpleCommand();

      const result = instantiateFromProtocol(template, protocol);

      // defaultFraming is cast to FramingConfig which uses simpler delimiter format
      expect(result.protocolLayer?.defaultFraming?.strategy).toBe("DELIMITER");
      expect(result.protocolLayer?.defaultFraming).toBeDefined();
    });
  });

  describe("STRUCTURED templates", () => {
    it("should create a SavedCommand from a STRUCTURED template", () => {
      const protocol = createMockProtocol();
      const template = createMockStructuredCommand({
        id: "struct-1",
        name: "Modbus Read",
        messageStructureId: "modbus-frame",
      });

      const result = instantiateFromProtocol(template, protocol);

      expect(result.name).toBe("Modbus Read");
      expect(result.source).toBe("PROTOCOL");
      expect(result.protocolLayer?.messageStructureId).toBe("modbus-frame");
      expect(result.protocolLayer?.mode).toBe("HEX");
      expect(result.protocolLayer?.payload).toBe("");
    });

    it("should copy element bindings from STRUCTURED template", () => {
      const protocol = createMockProtocol();
      const template = createMockStructuredCommand({
        bindings: [
          {
            elementId: "addr-elem",
            parameterName: "address",
            transform: "value * 2",
          },
          {
            elementId: "data-elem",
            parameterName: "data",
          },
        ],
      });

      const result = instantiateFromProtocol(template, protocol);

      expect(result.protocolLayer?.elementBindings).toHaveLength(2);
      expect(result.protocolLayer?.elementBindings?.[0].elementId).toBe(
        "addr-elem",
      );
      expect(result.protocolLayer?.elementBindings?.[0].parameterName).toBe(
        "address",
      );
      expect(result.protocolLayer?.elementBindings?.[0].transform).toBe(
        "value * 2",
      );
    });

    it("should extract variables from response patterns", () => {
      const protocol = createMockProtocol();
      const template = createMockStructuredCommand({
        response: {
          structureId: "response-struct",
          patterns: [
            {
              type: "SUCCESS",
              condition: "true",
              extractElements: [
                {
                  elementId: "temp-field",
                  variableName: "Temperature",
                  transform: "value / 10",
                },
                {
                  elementId: "status-field",
                  variableName: "Status",
                },
              ],
            },
          ],
        },
      });

      const result = instantiateFromProtocol(template, protocol);

      expect(result.protocolLayer?.extractVariables).toHaveLength(2);
      expect(result.protocolLayer?.extractVariables?.[0].variableName).toBe(
        "Temperature",
      );
      expect(result.protocolLayer?.extractVariables?.[0].transform).toBe(
        "value / 10",
      );
    });
  });
});

// ============================================================================
// syncProtocolLayer TESTS
// ============================================================================

describe("syncProtocolLayer", () => {
  it("should return unchanged command for CUSTOM source", () => {
    const command = createMockSavedCommand({
      source: "CUSTOM",
      name: "Custom Command",
    });
    const protocol = createMockProtocol();

    const result = syncProtocolLayer(command, protocol);

    expect(result).toBe(command);
  });

  it("should return unchanged command when template is up-to-date", () => {
    const templateUpdatedAt = Date.now() - 10000;
    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "cmd-1",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: templateUpdatedAt,
        payload: "TEST",
        mode: "TEXT",
        parameters: [],
      },
    });

    const protocol = createMockProtocol({
      id: "proto-1",
      commands: [
        createMockSimpleCommand({
          id: "cmd-1",
          updatedAt: templateUpdatedAt, // Same as command's protocolCommandUpdatedAt
        }),
      ],
    });

    const result = syncProtocolLayer(command, protocol);

    expect(result).toBe(command);
  });

  it("should update L1 when template is newer", () => {
    const oldTime = Date.now() - 20000;
    const newTime = Date.now() - 5000;

    const command = createMockSavedCommand({
      source: "PROTOCOL",
      name: "Old Name",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "cmd-1",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: oldTime,
        payload: "OLD_PAYLOAD",
        mode: "TEXT",
        parameters: [],
      },
      commandLayer: {
        customName: "User Custom Name",
      },
    });

    const protocol = createMockProtocol({
      id: "proto-1",
      version: "1.1.0",
      commands: [
        createMockSimpleCommand({
          id: "cmd-1",
          payload: "NEW_PAYLOAD",
          updatedAt: newTime, // Newer than command's protocolCommandUpdatedAt
        }),
      ],
    });

    const result = syncProtocolLayer(command, protocol);

    expect(result).not.toBe(command);
    expect(result.protocolLayer?.payload).toBe("NEW_PAYLOAD");
    expect(result.protocolLayer?.protocolCommandUpdatedAt).toBe(newTime);
    expect(result.commandLayer?.customName).toBe("User Custom Name"); // L2 preserved
  });

  it("should preserve L2 customizations during sync", () => {
    const oldTime = Date.now() - 20000;
    const newTime = Date.now() - 5000;

    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "cmd-1",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: oldTime,
        payload: "OLD",
        mode: "TEXT",
        parameters: [],
      },
      commandLayer: {
        customName: "My Custom Name",
        customDescription: "My Description",
        timeoutOverride: 5000,
        userPreRequestScript: "// My script",
      },
    });

    const protocol = createMockProtocol({
      id: "proto-1",
      commands: [
        createMockSimpleCommand({
          id: "cmd-1",
          payload: "NEW",
          updatedAt: newTime,
        }),
      ],
    });

    const result = syncProtocolLayer(command, protocol);

    expect(result.protocolLayer?.payload).toBe("NEW");
    expect(result.commandLayer?.customName).toBe("My Custom Name");
    expect(result.commandLayer?.customDescription).toBe("My Description");
    expect(result.commandLayer?.timeoutOverride).toBe(5000);
    expect(result.commandLayer?.userPreRequestScript).toBe("// My script");
  });

  it("should return unchanged command when template is deleted", () => {
    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "deleted-cmd",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: Date.now() - 10000,
        payload: "TEST",
        mode: "TEXT",
        parameters: [],
      },
    });

    const protocol = createMockProtocol({
      id: "proto-1",
      commands: [], // Template was deleted
    });

    const result = syncProtocolLayer(command, protocol);

    expect(result).toBe(command); // No change - command becomes orphaned
  });
});

// ============================================================================
// commandNeedsSync TESTS
// ============================================================================

describe("commandNeedsSync", () => {
  it("should return false for CUSTOM commands", () => {
    const command = createMockSavedCommand({ source: "CUSTOM" });
    const protocols = [createMockProtocol()];

    expect(commandNeedsSync(command, protocols)).toBe(false);
  });

  it("should return false when protocol is not found", () => {
    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "unknown-proto",
        protocolCommandId: "cmd-1",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: Date.now(),
        payload: "",
        mode: "TEXT",
        parameters: [],
      },
    });

    expect(commandNeedsSync(command, [])).toBe(false);
  });

  it("should return false when template is not found", () => {
    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "unknown-cmd",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: Date.now(),
        payload: "",
        mode: "TEXT",
        parameters: [],
      },
    });
    const protocols = [createMockProtocol({ id: "proto-1", commands: [] })];

    expect(commandNeedsSync(command, protocols)).toBe(false);
  });

  it("should return true when template is newer", () => {
    const oldTime = Date.now() - 10000;
    const newTime = Date.now();

    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "cmd-1",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: oldTime,
        payload: "",
        mode: "TEXT",
        parameters: [],
      },
    });

    const protocols = [
      createMockProtocol({
        id: "proto-1",
        commands: [
          createMockSimpleCommand({ id: "cmd-1", updatedAt: newTime }),
        ],
      }),
    ];

    expect(commandNeedsSync(command, protocols)).toBe(true);
  });

  it("should return false when command is up-to-date", () => {
    const sameTime = Date.now() - 5000;

    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "cmd-1",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: sameTime,
        payload: "",
        mode: "TEXT",
        parameters: [],
      },
    });

    const protocols = [
      createMockProtocol({
        id: "proto-1",
        commands: [
          createMockSimpleCommand({ id: "cmd-1", updatedAt: sameTime }),
        ],
      }),
    ];

    expect(commandNeedsSync(command, protocols)).toBe(false);
  });
});

// ============================================================================
// getCommandsSyncStatus TESTS
// ============================================================================

describe("getCommandsSyncStatus", () => {
  it("should categorize commands correctly", () => {
    const now = Date.now();
    const old = now - 10000;

    const commands: SavedCommand[] = [
      createMockSavedCommand({
        id: "custom-1",
        source: "CUSTOM",
      }),
      createMockSavedCommand({
        id: "synced-1",
        source: "PROTOCOL",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-1",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: now,
          payload: "",
          mode: "TEXT",
          parameters: [],
        },
      }),
      createMockSavedCommand({
        id: "outdated-1",
        source: "PROTOCOL",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "cmd-2",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: old,
          payload: "",
          mode: "TEXT",
          parameters: [],
        },
      }),
      createMockSavedCommand({
        id: "orphaned-1",
        source: "PROTOCOL",
        protocolLayer: {
          protocolId: "proto-1",
          protocolCommandId: "deleted-cmd",
          protocolVersion: "1.0.0",
          protocolCommandUpdatedAt: now,
          payload: "",
          mode: "TEXT",
          parameters: [],
        },
      }),
    ];

    const protocols = [
      createMockProtocol({
        id: "proto-1",
        commands: [
          createMockSimpleCommand({ id: "cmd-1", updatedAt: now }),
          createMockSimpleCommand({ id: "cmd-2", updatedAt: now }), // Newer than command
        ],
      }),
    ];

    const status = getCommandsSyncStatus(commands, protocols);

    expect(status.custom).toContain("custom-1");
    expect(status.synced).toContain("synced-1");
    expect(status.outdated).toContain("outdated-1");
    expect(status.orphaned).toContain("orphaned-1");
  });
});

// ============================================================================
// detachFromProtocol TESTS
// ============================================================================

describe("detachFromProtocol", () => {
  it("should return unchanged command for CUSTOM source", () => {
    const command = createMockSavedCommand({ source: "CUSTOM" });
    const result = detachFromProtocol(command, []);
    expect(result).toBe(command);
  });

  it("should convert PROTOCOL command to CUSTOM", () => {
    const command = createMockSavedCommand({
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: "proto-1",
        protocolCommandId: "cmd-1",
        protocolVersion: "1.0.0",
        protocolCommandUpdatedAt: Date.now(),
        payload: "PROTOCOL_PAYLOAD",
        mode: "HEX",
        parameters: [],
      },
      commandLayer: {
        customName: "My Name",
      },
    });

    const result = detachFromProtocol(command, []);

    expect(result.source).toBe("CUSTOM");
    expect(result.protocolLayer).toBeUndefined();
    expect(result.payload).toBe("PROTOCOL_PAYLOAD");
    expect(result.mode).toBe("HEX");
  });
});

// ============================================================================
// migrateCommand TESTS
// ============================================================================

describe("migrateCommand", () => {
  it("should return unchanged command if already has source", () => {
    const command = createMockSavedCommand({
      source: "CUSTOM",
    });

    const result = migrateCommand(command);

    expect(result).toBe(command);
  });

  it("should migrate command without source to CUSTOM", () => {
    const command = {
      id: "old-cmd",
      name: "Old Command",
      payload: "TEST",
      mode: "TEXT" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      creator: "USER" as const,
    } as SavedCommand;

    const result = migrateCommand(command);

    expect(result.source).toBe("CUSTOM");
    expect(result.commandLayer).toEqual({});
  });

  it("should migrate old protocol-linked command to PROTOCOL source", () => {
    const command = {
      id: "old-proto-cmd",
      name: "Old Protocol Command",
      payload: "FROM_PROTO",
      mode: "TEXT",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      creator: "USER",
      protocolId: "proto-1",
      protocolCommandId: "cmd-1",
      sourceProtocolVersion: "1.0.0",
      sourceCommandUpdatedAt: Date.now() - 10000,
    } as unknown as SavedCommand;

    const result = migrateCommand(command);

    expect(result.source).toBe("PROTOCOL");
    expect(result.protocolLayer).toBeDefined();
    expect(result.protocolLayer?.protocolId).toBe("proto-1");
    expect(result.protocolLayer?.protocolCommandId).toBe("cmd-1");
    expect(result.commandLayer?.customName).toBe("Old Protocol Command");
  });
});
