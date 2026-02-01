/**
 * Command Builder Tests
 *
 * Tests for merging protocolLayer + commandLayer and parameter substitution
 */

import { describe, it, expect } from "vitest";
import {
  buildCommandForExecution,
  substituteParameters,
  getEffectivePayload,
} from "../commandBuilder";
import type { SavedCommand } from "../../types";

const now = Date.now();

describe("commandBuilder", () => {
  describe("CUSTOM source commands", () => {
    it("should use legacy fields for CUSTOM commands", () => {
      const command: SavedCommand = {
        id: "test-1",
        name: "Test Command",
        source: "CUSTOM",
        payload: "AT+GMR",
        mode: "TEXT",
        createdAt: now,
        updatedAt: now,
      };

      const result = buildCommandForExecution(command);

      expect(result.payload).toBe("AT+GMR");
      expect(result.mode).toBe("TEXT");
    });
  });

  describe("PROTOCOL source commands", () => {
    it("should merge protocolLayer and commandLayer", () => {
      const command: SavedCommand = {
        id: "test-2",
        name: "Show Help",
        source: "PROTOCOL",
        createdAt: now,
        updatedAt: now,

        protocolLayer: {
          protocolId: "proto-esp32-test-device",
          protocolCommandId: "tmpl-esp32-simple-cmd",
          protocolVersion: "1.0",
          protocolCommandUpdatedAt: now,
          payload: "{command}",
          mode: "TEXT",
          parameters: [
            {
              name: "command",
              type: "STRING",
              description: "Command name",
              required: true,
            },
          ],
        },

        commandLayer: {
          parameterEnhancements: {
            command: {
              customDefault: "HELP",
            },
          },
        },
      };

      const result = buildCommandForExecution(command);

      expect(result.payload).toBe("HELP");
      expect(result.mode).toBe("TEXT");
    });

    it("should substitute multiple parameters", () => {
      const command: SavedCommand = {
        id: "test-3",
        name: "Move to Position",
        source: "PROTOCOL",
        createdAt: now,
        updatedAt: now,

        protocolLayer: {
          protocolId: "proto-marlin",
          protocolCommandId: "tmpl-gcode-xyz",
          protocolVersion: "1.0",
          protocolCommandUpdatedAt: now,
          payload: "G{code} X{x} Y{y} Z{z}",
          mode: "TEXT",
          parameters: [
            { name: "code", type: "INTEGER", required: true },
            { name: "x", type: "FLOAT", required: false },
            { name: "y", type: "FLOAT", required: false },
            { name: "z", type: "FLOAT", required: false },
          ],
        },

        commandLayer: {
          parameterEnhancements: {
            code: { customDefault: 1 },
            x: { customDefault: 10.5 },
            y: { customDefault: 20.3 },
            z: { customDefault: 5.0 },
          },
        },
      };

      const result = buildCommandForExecution(command);

      expect(result.payload).toBe("G1 X10.5 Y20.3 Z5");
    });

    it("should handle optional parameters", () => {
      const command: SavedCommand = {
        id: "test-4",
        name: "Simple G-code",
        source: "PROTOCOL",
        createdAt: now,
        updatedAt: now,

        protocolLayer: {
          protocolId: "proto-marlin",
          protocolCommandId: "tmpl-gcode-xyz",
          protocolVersion: "1.0",
          protocolCommandUpdatedAt: now,
          payload: "G{code} X{x} Y{y} Z{z}",
          mode: "TEXT",
          parameters: [
            { name: "code", type: "INTEGER", required: true },
            { name: "x", type: "FLOAT", required: false },
            { name: "y", type: "FLOAT", required: false },
            { name: "z", type: "FLOAT", required: false },
          ],
        },

        commandLayer: {
          parameterEnhancements: {
            code: { customDefault: 28 },
            // x, y, z not provided - should remain as {x}, {y}, {z}
          },
        },
      };

      const result = buildCommandForExecution(command);

      // Only code should be substituted, others remain
      expect(result.payload).toBe("G28 X{x} Y{y} Z{z}");
    });

    it("should throw error for missing required parameter", () => {
      const command: SavedCommand = {
        id: "test-5",
        name: "Invalid Command",
        source: "PROTOCOL",
        createdAt: now,
        updatedAt: now,

        protocolLayer: {
          protocolId: "proto-at",
          protocolCommandId: "tmpl-at-simple",
          protocolVersion: "1.0",
          protocolCommandUpdatedAt: now,
          payload: "AT+{command}",
          mode: "TEXT",
          parameters: [{ name: "command", type: "STRING", required: true }],
        },

        commandLayer: {
          // No parameter value provided!
        },
      };

      expect(() => buildCommandForExecution(command)).toThrow(
        'Required parameter "command" has no value',
      );
    });
  });

  describe("substituteParameters", () => {
    it("should substitute single parameter", () => {
      const result = substituteParameters("AT+{command}", { command: "GMR" }, [
        { name: "command", type: "STRING" },
      ]);

      expect(result).toBe("AT+GMR");
    });

    it("should substitute multiple parameters", () => {
      const result = substituteParameters(
        "SET_{parameter}={value}",
        { parameter: "TEMP", value: "25.5" },
        [
          { name: "parameter", type: "STRING" },
          { name: "value", type: "STRING" },
        ],
      );

      expect(result).toBe("SET_TEMP=25.5");
    });

    it("should handle escaped braces", () => {
      const result = substituteParameters(
        "\\{literal\\} {param}",
        { param: "value" },
        [{ name: "param", type: "STRING" }],
      );

      expect(result).toBe("{literal} value");
    });

    it("should format INTEGER type", () => {
      const result = substituteParameters("G{code}", { code: 28.7 }, [
        { name: "code", type: "INTEGER" },
      ]);

      expect(result).toBe("G28");
    });

    it("should format FLOAT type", () => {
      const result = substituteParameters("X{x}", { x: 10.5 }, [
        { name: "x", type: "FLOAT" },
      ]);

      expect(result).toBe("X10.5");
    });
  });

  describe("getEffectivePayload", () => {
    it("should return legacy payload for CUSTOM commands", () => {
      const command: SavedCommand = {
        id: "test-6",
        name: "Custom",
        source: "CUSTOM",
        payload: "CUSTOM_PAYLOAD",
        createdAt: now,
        updatedAt: now,
      };

      expect(getEffectivePayload(command)).toBe("CUSTOM_PAYLOAD");
    });

    it("should return merged payload for PROTOCOL commands", () => {
      const command: SavedCommand = {
        id: "test-7",
        name: "Protocol",
        source: "PROTOCOL",
        createdAt: now,
        updatedAt: now,

        protocolLayer: {
          protocolId: "proto-test",
          protocolCommandId: "tmpl-test",
          protocolVersion: "1.0",
          protocolCommandUpdatedAt: now,
          payload: "{cmd}",
          mode: "TEXT",
          parameters: [{ name: "cmd", type: "STRING", required: true }],
        },

        commandLayer: {
          parameterEnhancements: {
            cmd: { customDefault: "TEST" },
          },
        },
      };

      expect(getEffectivePayload(command)).toBe("TEST");
    });
  });
});
