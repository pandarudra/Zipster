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

    // For decompression, remove .huff extension for output
    let outputPath = inputPath;
    if (fileName.endsWith(".huff")) {
      outputPath = inputPath.slice(0, -fileName.length) + fileName.slice(0, -5);
    } else {
      outputPath = inputPath + ".decompressed";
    }

    // Convert base64 back to buffer and save temporarily
    const buffer = Buffer.from(fileContent, "base64");
    await writeFile(inputPath, buffer);

    return new Promise<NextResponse>((resolve) => {
      exec(
        `"${path.join(
          process.cwd(),
          "../huffman-core/huffman.exe"
        )}" decompress "${inputPath}" "${outputPath}"`,
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
                decompressedSize: fileBuffer.length,
              })
            );
          } catch {
            return resolve(
              NextResponse.json(
                { error: "Failed to read decompressed file" },
                { status: 500 }
              )
            );
          }
        }
      );
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process decompression request" },
      { status: 500 }
    );
  }
}
