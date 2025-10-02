import { NextRequest, NextResponse } from "next/server";
import { decompressData } from "@/lib/loadHuffman";

export async function POST(req: NextRequest) {
  try {
    const { fileContent, fileName } = await req.json();

    if (!fileContent || !fileName) {
      return NextResponse.json(
        { error: "No file data provided" },
        { status: 400 }
      );
    }

    // Convert base64 back to buffer for decompression
    const inputBuffer = Buffer.from(fileContent, "base64");
    const inputData = new Uint8Array(inputBuffer);

    // Decompress the data using WASM
    const decompressedData = await decompressData(inputData);

    // Convert decompressed data back to base64
    const decompressedBuffer = Buffer.from(decompressedData);
    const base64Result = decompressedBuffer.toString("base64");

    // Generate output filename (remove .huff extension if present)
    let outputFileName = fileName;
    if (fileName.endsWith(".huff")) {
      outputFileName = fileName.slice(0, -5);
    } else {
      outputFileName = fileName + ".decompressed";
    }

    return NextResponse.json({
      fileContent: base64Result,
      fileName: outputFileName,
      originalSize: inputBuffer.length,
      decompressedSize: decompressedData.length,
    });
  } catch (error) {
    console.error("Decompression error:", error);
    return NextResponse.json(
      { error: "Failed to process decompression request" },
      { status: 500 }
    );
  }
}
