import { setupServer } from "msw/node";
import { beforeAll, afterAll, afterEach } from "vitest";
import { handlers } from "./handlers";

/**
 * MSW server for Node.js test environment.
 * Import and call setupMSW() in test files that need network mocking.
 *
 * @example
 * import { setupMSW, server } from "@/tests/mocks/server";
 *
 * setupMSW();
 *
 * describe("MyApiTests", () => {
 *   it("mocks network request", async () => {
 *     // server is active, requests are intercepted
 *   });
 * });
 */
export const server = setupServer(...handlers);

/**
 * Call this at the top of test files that need MSW.
 * This is opt-in to avoid interfering with tests that mock WebSocket/fetch manually.
 */
export function setupMSW() {
  beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
