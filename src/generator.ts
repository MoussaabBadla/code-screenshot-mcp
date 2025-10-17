/**
 * Screenshot generator using Playwright
 */

import { chromium, Browser, Page } from "playwright";
import { generateHTML, ScreenshotOptions } from "./templates.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Language detection from file extensions
const extensionToLanguage: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.dart': 'dart',
  '.sql': 'sql',
  '.sh': 'bash',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.json': 'json',
  '.xml': 'xml',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.md': 'markdown',
};

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export interface GenerateScreenshotResult {
  path: string;
  base64: string;
}

export async function generateScreenshot(
  options: ScreenshotOptions
): Promise<GenerateScreenshotResult> {
  const html = generateHTML(options);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport for better rendering
    await page.setViewportSize({
      width: 1920,
      height: 1080,
    });

    // Load the HTML content
    await page.setContent(html, {
      waitUntil: "networkidle",
    });

    // Wait for syntax highlighting to apply
    await page.waitForTimeout(500);

    // Find the container element
    const container = await page.locator(".container");

    // Take screenshot of just the container
    const screenshot = await container.screenshot({
      type: "png",
    });

    // Save to temp file
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-screenshot-"));
    const tempFile = path.join(tempDir, "screenshot.png");
    await fs.writeFile(tempFile, screenshot);

    // Convert to base64
    const base64 = screenshot.toString("base64");

    return {
      path: tempFile,
      base64: base64,
    };
  } finally {
    await page.close();
  }
}

export interface ScreenshotFromFileOptions {
  filePath: string;
  startLine?: number;
  endLine?: number;
  theme?: string;
}

export async function screenshotFromFile(
  options: ScreenshotFromFileOptions
): Promise<GenerateScreenshotResult> {
  // Read the file
  const fileContent = await fs.readFile(options.filePath, 'utf-8');

  // Detect language from extension
  const ext = path.extname(options.filePath).toLowerCase();
  const language = extensionToLanguage[ext] || 'plaintext';

  // Extract lines if specified
  let code = fileContent;
  if (options.startLine !== undefined || options.endLine !== undefined) {
    const lines = fileContent.split('\n');
    const start = (options.startLine || 1) - 1;
    const end = options.endLine || lines.length;
    code = lines.slice(start, end).join('\n');
  }

  // Generate screenshot
  return generateScreenshot({
    code,
    language,
    theme: options.theme,
  });
}

export interface ScreenshotGitDiffOptions {
  filePath?: string;
  staged?: boolean;
  theme?: string;
}

export async function screenshotGitDiff(
  options: ScreenshotGitDiffOptions
): Promise<GenerateScreenshotResult> {
  try {
    // Build git diff command
    let command = "git diff";

    if (options.staged) {
      command += " --staged";
    }

    if (options.filePath) {
      command += ` -- "${options.filePath}"`;
    }

    // Execute git diff
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stdout) {
      throw new Error(`Git diff error: ${stderr}`);
    }

    if (!stdout || stdout.trim().length === 0) {
      throw new Error("No changes to display");
    }

    // Generate screenshot with diff language
    return generateScreenshot({
      code: stdout,
      language: "diff",
      theme: options.theme,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate git diff screenshot: ${error.message}`);
    }
    throw error;
  }
}

export interface BatchScreenshotOptions {
  filePaths: string[];
  theme?: string;
}

export interface BatchScreenshotResult {
  results: Array<{
    filePath: string;
    screenshot: GenerateScreenshotResult;
    error?: string;
  }>;
  successCount: number;
  failureCount: number;
}

export async function batchScreenshot(
  options: BatchScreenshotOptions
): Promise<BatchScreenshotResult> {
  const results: BatchScreenshotResult["results"] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const filePath of options.filePaths) {
    try {
      const screenshot = await screenshotFromFile({
        filePath,
        theme: options.theme,
      });

      results.push({
        filePath,
        screenshot,
      });
      successCount++;
    } catch (error) {
      results.push({
        filePath,
        screenshot: { path: "", base64: "" },
        error: error instanceof Error ? error.message : String(error),
      });
      failureCount++;
    }
  }

  return {
    results,
    successCount,
    failureCount,
  };
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});
