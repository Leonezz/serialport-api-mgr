import { http, HttpResponse } from "msw";

/**
 * MSW request handlers for mocking external API calls in tests.
 * Add handlers here for any external APIs that need to be mocked.
 */
export const handlers = [
  // Example: Mock Gemini API
  http.post("https://generativelanguage.googleapis.com/*", () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [{ text: "Mock AI response" }],
          },
        },
      ],
    });
  }),
];
