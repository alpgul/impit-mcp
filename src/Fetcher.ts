import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { RequestPayload } from "./types.js";
import { Impit } from "impit";
import { HeaderGenerator } from "header-generator";

export class Fetcher {
  private static impit = new Impit({ browser: "chrome" });
  private static headerGenerator = new HeaderGenerator({
    browsers: [
      {
        name: "chrome",
        minVersion: 125,
        maxVersion: 125,
      },
    ],
    devices: ["desktop"],
    operatingSystems: ["windows"],
  });

  private static applyLengthLimits(
    text: string,
    maxLength: number,
    startIndex: number
  ): string {
    if (startIndex >= text.length) {
      return "";
    }

    const end =
      maxLength > 0
        ? Math.min(startIndex + maxLength, text.length)
        : text.length;
    return text.substring(startIndex, end);
  }

  private static async _fetch({ url, headers }: RequestPayload): Promise<any> {
    try {
      if (this.isPrivateIP(url)) {
        throw new Error(
          `Fetcher blocked an attempt to fetch a private IP ${url}. This is to prevent a security vulnerability where a local MCP could fetch privileged local IPs and exfiltrate data.`
        );
      }

      const fixedHeaders = new Map();
      for (const entry of Object.entries(this.headerGenerator.getHeaders())) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
      }
      const headersToRemove = [
        "sec-ch-ua",
        "sec-ch-ua-mobile",
        "sec-ch-ua-platform",
        "user-agent",
      ];
      const lowerHeadersToRemove = headersToRemove.map((h) => h.toLowerCase());
      for (const entry of Object.entries(headers || {})) {
        if (lowerHeadersToRemove.includes(entry[0].toLowerCase())) {
          continue;
        }
        fixedHeaders.set(entry[0].toLowerCase(), entry);
      }

      const response = await this.impit.fetch(url, {
        headers: Object.fromEntries(fixedHeaders.values()),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response;
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(`Failed to fetch ${url}: ${e.message}`);
      } else {
        throw new Error(`Failed to fetch ${url}: Unknown error`);
      }
    }
  }

  static async html(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      let html = await response.text();

      // Apply length limits
      html = this.applyLengthLimits(
        html,
        requestPayload.max_length ?? 5000,
        requestPayload.start_index ?? 0
      );

      return { content: [{ type: "text", text: html }], isError: false };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }

  private static isPrivateIP(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      // Handle IPv6 addresses (remove brackets)
      const host =
        hostname.startsWith("[") && hostname.endsWith("]")
          ? hostname.slice(1, -1)
          : hostname;

      // Check for localhost
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
        return true;
      }

      // Check for IPv4 private ranges
      const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const match = host.match(ipv4Pattern);
      if (match) {
        const [_, a, b, c] = match.map(Number);
        // 10.0.0.0/8
        if (a === 10) return true;
        // 172.16.0.0/12
        if (a === 172 && b >= 16 && b <= 31) return true;
        // 192.168.0.0/16
        if (a === 192 && b === 168) return true;
      }

      return false;
    } catch (e) {
      // If URL parsing fails, consider it not private
      return false;
    }
  }

  static async json(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      const json = await response.json();
      let jsonString = JSON.stringify(json);

      // Apply length limits
      jsonString = this.applyLengthLimits(
        jsonString,
        requestPayload.max_length ?? 5000,
        requestPayload.start_index ?? 0
      );

      return {
        content: [{ type: "text", text: jsonString }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }

  static async txt(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      const html = await response.text();

      const dom = new JSDOM(html);
      const document = dom.window.document;

      const scripts = document.getElementsByTagName("script");
      const styles = document.getElementsByTagName("style");
      Array.from(scripts).forEach((script) => script.remove());
      Array.from(styles).forEach((style) => style.remove());

      const text = document.body.textContent || "";
      let normalizedText = text.replace(/\s+/g, " ").trim();

      // Apply length limits
      normalizedText = this.applyLengthLimits(
        normalizedText,
        requestPayload.max_length ?? 5000,
        requestPayload.start_index ?? 0
      );

      return {
        content: [{ type: "text", text: normalizedText }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }

  static async markdown(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      const html = await response.text();
      const turndownService = new TurndownService();
      let markdown = turndownService.turndown(html);

      // Apply length limits
      markdown = this.applyLengthLimits(
        markdown,
        requestPayload.max_length ?? 5000,
        requestPayload.start_index ?? 0
      );

      return { content: [{ type: "text", text: markdown }], isError: false };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }
}
