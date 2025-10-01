import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { writeFile } from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const { fileContent, fileName } = await req.json();

    if (!fileContent || !fileName) {
      return NextResponse.json(
        { error: "No file data provided" },
        { status: 400 }
      );
    }

    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create temporary file paths
    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `${timestamp}_${fileName}`);
    const outputPath = inputPath + ".huff";

    // Convert base64 back to buffer and save temporarily
    const buffer = Buffer.from(fileContent, "base64");
    await writeFile(inputPath, buffer);

    return new Promise<NextResponse>((resolve) => {
      exec(
        `"${path.join(
          process.cwd(),
          "../huffman-core/huffman.exe"
        )}" compress "${inputPath}" "${outputPath}"`,
        (error, stdout, stderr) => {
          // Clean up input file
          fs.unlink(inputPath, () => {});

          if (error) {
            return resolve(
              NextResponse.json(
                { error: stderr || error.message },
                { status: 500 }
              )
            );
          }

          try {
            const fileBuffer = fs.readFileSync(outputPath);
            const base64Result = fileBuffer.toString("base64");

            // Clean up output file
            fs.unlink(outputPath, () => {});

            return resolve(
              NextResponse.json({
                fileContent: base64Result,
                fileName: path.basename(outputPath),
                originalSize: buffer.length,
                compressedSize: fileBuffer.length,
              })
            );
          } catch {
            return resolve(
              NextResponse.json(
                { error: "Failed to read compressed file" },
                { status: 500 }
              )
            );
          }
        }
      );
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process compression request" },
      { status: 500 }
    );
  }
}

export interface FileData {
  content: string; // base64
  name: string;
  size: number;
  type: string;
}

export class LocalFileManager {
  private static STORAGE_KEY = "zipster_files";

  // Convert File to base64 string
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:text/plain;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // Convert base64 string back to downloadable blob
  static base64ToBlob(
    base64: string,
    type: string = "application/octet-stream"
  ): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

  // Save file data to local storage
  static saveFile(key: string, fileData: FileData): void {
    const files = this.getAllFiles();
    files[key] = {
      ...fileData,
      timestamp: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
  }

  // Get file data from local storage
  static getFile(key: string): FileData | null {
    const files = this.getAllFiles();
    return files[key] || null;
  }

  // Get all files from local storage
  static getAllFiles(): Record<string, FileData & { timestamp: number }> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Remove file from local storage
  static removeFile(key: string): void {
    const files = this.getAllFiles();
    delete files[key];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
  }

  // Clear all files from local storage
  static clearAllFiles(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Download file from base64 data
  static downloadFile(
    base64Content: string,
    fileName: string,
    type?: string
  ): void {
    const blob = this.base64ToBlob(base64Content, type);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  }

  // Get storage usage in bytes
  static getStorageUsage(): { used: number; total: number } {
    const files = this.getAllFiles();
    const used = JSON.stringify(files).length;

    // Estimate total available localStorage (usually ~5-10MB)
    let total = 5 * 1024 * 1024; // 5MB default estimate

    try {
      // Try to detect actual storage limit
      const testKey = "__test__";
      let testData = "";

      while (true) {
        try {
          testData += "0".repeat(1024); // Add 1KB at a time
          localStorage.setItem(testKey, testData);
          total = testData.length;
        } catch {
          localStorage.removeItem(testKey);
          break;
        }
      }
    } catch {
      // Fallback to default estimate
    }

    return { used, total };
  }
}
