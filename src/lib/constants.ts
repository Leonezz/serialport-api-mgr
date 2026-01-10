/**
 * Application-wide constants
 * Centralized magic numbers and configuration values
 */

export const TIMING = {
  /** Timeout for framing override in milliseconds */
  FRAMING_OVERRIDE_TIMEOUT_MS: 5000,

  /** Default timeout for command validation in milliseconds */
  DEFAULT_VALIDATION_TIMEOUT_MS: 2000,

  /** Default delay between sequence steps in milliseconds */
  SEQUENCE_STEP_DELAY_MS: 500,
} as const;

export const BUFFER_SIZES = {
  /** Default log buffer size (number of entries) */
  DEFAULT_LOG_BUFFER: 1000,

  /** Maximum length for log preview display */
  MAX_PREVIEW_LENGTH: 50,
} as const;

export const FRAMING = {
  /** Default framing timeout in milliseconds */
  DEFAULT_TIMEOUT_MS: 50,

  /** Default prefix length size in bytes */
  DEFAULT_PREFIX_LENGTH_SIZE: 1,
} as const;

export const NETWORK = {
  /** Default network host */
  DEFAULT_HOST: 'localhost',

  /** Default network port */
  DEFAULT_PORT: 8080,
} as const;
