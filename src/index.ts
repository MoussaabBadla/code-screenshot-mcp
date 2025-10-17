#!/usr/bin/env node

/**
 * Code Screenshot Generator MCP Server
 * Generates beautiful code screenshots directly from Claude
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { generateScreenshot, screenshotFromFile, screenshotGitDiff, batchScreenshot, closeBrowser } from "./generator.js";
import { themes } from "./templates.js";

// Server instance
const server = new Server(
  {
    name: "code-screenshot-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_code_screenshot",
        description: "Generate a beautiful screenshot of code with syntax highlighting and themes",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The code to screenshot",
            },
            language: {
              type: "string",
              description: "Programming language (e.g., javascript, python, rust)",
            },
            theme: {
              type: "string",
              description: "Color theme (dracula, nord, monokai, github-light, github-dark)",
              enum: ["dracula", "nord", "monokai", "github-light", "github-dark"],
            },
          },
          required: ["code", "language"],
        },
      },
      {
        name: "screenshot_from_file",
        description: "Screenshot code directly from a file path, with optional line range selection. Auto-detects language from file extension.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Path to the code file",
            },
            startLine: {
              type: "number",
              description: "Start line number (1-indexed, optional)",
            },
            endLine: {
              type: "number",
              description: "End line number (optional)",
            },
            theme: {
              type: "string",
              description: "Color theme (dracula, nord, monokai, github-light, github-dark)",
              enum: ["dracula", "nord", "monokai", "github-light", "github-dark"],
            },
          },
          required: ["filePath"],
        },
      },
      {
        name: "screenshot_git_diff",
        description: "Generate a screenshot of git diff output. Shows changes in your working directory or staged changes.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Optional: Specific file to diff. If not provided, shows diff for all changes.",
            },
            staged: {
              type: "boolean",
              description: "Show staged changes (git diff --staged) instead of unstaged changes",
            },
            theme: {
              type: "string",
              description: "Color theme (dracula, nord, monokai, github-light, github-dark)",
              enum: ["dracula", "nord", "monokai", "github-light", "github-dark"],
            },
          },
          required: [],
        },
      },
      {
        name: "batch_screenshot",
        description: "Generate screenshots for multiple files at once. Useful for documenting multiple code files quickly.",
        inputSchema: {
          type: "object",
          properties: {
            filePaths: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of file paths to screenshot",
            },
            theme: {
              type: "string",
              description: "Color theme to apply to all screenshots (dracula, nord, monokai, github-light, github-dark)",
              enum: ["dracula", "nord", "monokai", "github-light", "github-dark"],
            },
          },
          required: ["filePaths"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generate_code_screenshot") {
    if (!args) {
      throw new Error("Arguments are required");
    }

    try {
      const { code, language, theme = "dracula" } = args as {
        code: string;
        language: string;
        theme?: string;
      };

      if (!code || !language) {
        throw new Error("Both 'code' and 'language' are required");
      }

      // Generate the screenshot
      const result = await generateScreenshot({
        code,
        language,
        theme,
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Screenshot generated successfully!\n\nFile saved to: ${result.path}\n\nTheme: ${theme}\nLanguage: ${language}\n\nYou can view the image in your file browser.`,
          },
          {
            type: "image",
            data: result.base64,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating screenshot: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "screenshot_from_file") {
    if (!args) {
      throw new Error("Arguments are required");
    }

    try {
      const { filePath, startLine, endLine, theme = "dracula" } = args as {
        filePath: string;
        startLine?: number;
        endLine?: number;
        theme?: string;
      };

      if (!filePath) {
        throw new Error("filePath is required");
      }

      // Generate the screenshot from file
      const result = await screenshotFromFile({
        filePath,
        startLine,
        endLine,
        theme,
      });

      const lineInfo = startLine || endLine
        ? `\nLines: ${startLine || 1}-${endLine || 'end'}`
        : '\nFull file';

      return {
        content: [
          {
            type: "text",
            text: `✅ Screenshot from file generated successfully!\n\nFile: ${filePath}${lineInfo}\nSaved to: ${result.path}\n\nTheme: ${theme}\n\nYou can view the image in your file browser.`,
          },
          {
            type: "image",
            data: result.base64,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating screenshot from file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "screenshot_git_diff") {
    try {
      const { filePath, staged, theme = "dracula" } = (args || {}) as {
        filePath?: string;
        staged?: boolean;
        theme?: string;
      };

      // Generate the screenshot from git diff
      const result = await screenshotGitDiff({
        filePath,
        staged,
        theme,
      });

      const diffType = staged ? "Staged changes" : "Unstaged changes";
      const fileInfo = filePath ? `\nFile: ${filePath}` : "\nAll files";

      return {
        content: [
          {
            type: "text",
            text: `✅ Git diff screenshot generated successfully!\n\n${diffType}${fileInfo}\nSaved to: ${result.path}\n\nTheme: ${theme}\n\nYou can view the image in your file browser.`,
          },
          {
            type: "image",
            data: result.base64,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating git diff screenshot: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "batch_screenshot") {
    if (!args) {
      throw new Error("Arguments are required");
    }

    try {
      const { filePaths, theme = "dracula" } = args as {
        filePaths: string[];
        theme?: string;
      };

      if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
        throw new Error("filePaths array is required and must not be empty");
      }

      // Generate batch screenshots
      const batchResult = await batchScreenshot({
        filePaths,
        theme,
      });

      // Build response content
      const content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> = [
        {
          type: "text",
          text: `✅ Batch screenshot completed!\n\nTotal files: ${filePaths.length}\nSuccessful: ${batchResult.successCount}\nFailed: ${batchResult.failureCount}\n\nTheme: ${theme}\n\n`,
        },
      ];

      // Add each screenshot or error message
      for (const result of batchResult.results) {
        if (result.error) {
          content[0].text += `\n❌ ${result.filePath}: ${result.error}`;
        } else {
          content[0].text += `\n✅ ${result.filePath}: ${result.screenshot.path}`;
          content.push({
            type: "image",
            data: result.screenshot.base64,
            mimeType: "image/png",
          });
        }
      }

      return { content };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error in batch screenshot: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Code Screenshot MCP Server running on stdio");
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down...");
  await closeBrowser();
  process.exit(0);
});

main().catch(async (error) => {
  console.error("Fatal error:", error);
  await closeBrowser();
  process.exit(1);
});
