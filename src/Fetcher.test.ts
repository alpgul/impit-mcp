import { Fetcher } from "./Fetcher";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { Impit } from "impit";

jest.mock("jsdom");
jest.mock("turndown");
jest.mock("impit", () => {
  const mockFetch = jest.fn();
  
  return {
    Impit: jest.fn().mockImplementation(() => {
      return {
        fetch: mockFetch
      };
    }),
    mockFetch // Export for test access
  };
});

// TypeScript için mockFetch'e erişim
const mockFetch = (require("impit") as any).mockFetch as jest.Mock;

describe("Fetcher", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  const mockRequest = {
    url: "https://example.com",
    headers: { "Custom-Header": "Value" },
  };

  const mockHtml = `
    <html>
      <head>
        <title>Test Page</title>
        <script>console.log('This should be removed');</script>
        <style>body { color: red; }</style>
      </head>
      <body>
        <h1>Hello World</h1>
        <p>This is a test paragraph.</p>
      </body>
    </html>
  `;

  describe("html", () => {
    it("should return the raw HTML content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(mockHtml),
      });

      const result = await Fetcher.html(mockRequest);
      expect(result).toEqual({
        content: [{ type: "text", text: mockHtml }],
        isError: false,
      });
    });

    it("should handle errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await Fetcher.html(mockRequest);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Failed to fetch https://example.com: Network error",
          },
        ],
        isError: true,
      });
    });
  });

  describe("json", () => {
    it("should parse and return JSON content", async () => {
      const mockJson = { key: "value" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockJson),
      });

      const result = await Fetcher.json(mockRequest);
      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockJson) }],
        isError: false,
      });
    });

    it("should handle errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Invalid JSON"));

      const result = await Fetcher.json(mockRequest);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Failed to fetch https://example.com: Invalid JSON",
          },
        ],
        isError: true,
      });
    });
  });

  describe("txt", () => {
    it("should return plain text content without HTML tags, scripts, and styles", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(mockHtml),
      });

      const mockTextContent = "Hello World This is a test paragraph.";
      // @ts-expect-error Mocking JSDOM
      (JSDOM as jest.Mock).mockImplementationOnce(() => ({
        window: {
          document: {
            body: {
              textContent: mockTextContent,
            },
            getElementsByTagName: jest.fn().mockReturnValue([]),
          },
        },
      }));

      const result = await Fetcher.txt(mockRequest);
      expect(result).toEqual({
        content: [{ type: "text", text: mockTextContent }],
        isError: false,
      });
    });

    it("should handle errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Parsing error"));

      const result = await Fetcher.txt(mockRequest);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Failed to fetch https://example.com: Parsing error",
          },
        ],
        isError: true,
      });
    });
  });

  describe("markdown", () => {
    it("should convert HTML to markdown", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(mockHtml),
      });

      const mockMarkdown = "# Hello World\n\nThis is a test paragraph.";
      (TurndownService as jest.Mock).mockImplementationOnce(() => ({
        turndown: jest.fn().mockReturnValueOnce(mockMarkdown),
      }));

      const result = await Fetcher.markdown(mockRequest);
      expect(result).toEqual({
        content: [{ type: "text", text: mockMarkdown }],
        isError: false,
      });
    });

    it("should handle errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Conversion error"));

      const result = await Fetcher.markdown(mockRequest);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Failed to fetch https://example.com: Conversion error",
          },
        ],
        isError: true,
      });
    });
  });

  describe("error handling", () => {
    it("should handle non-OK responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await Fetcher.html(mockRequest);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Failed to fetch https://example.com: HTTP error: 404",
          },
        ],
        isError: true,
      });
    });

    it("should handle unknown errors", async () => {
      mockFetch.mockRejectedValueOnce("Unknown error");

      const result = await Fetcher.html(mockRequest);
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Failed to fetch https://example.com: Unknown error",
          },
        ],
        isError: true,
      });
    });
  });
});
