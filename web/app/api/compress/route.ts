import { NextRequest, NextResponse } from "next/server";
import { compressData } from "@/lib/loadHuffman";

export async function POST(req: NextRequest) {
  try {
    console.log("Starting compression request...");
    const { fileContent, fileName } = await req.json();

    if (!fileContent || !fileName) {
      return NextResponse.json(
        { error: "No file data provided" },
        { status: 400 }
      );
    }

    console.log(
      "Processing file:",
      fileName,
      "Content length:",
      fileContent.length
    );

    // Convert base64 back to buffer for compression
    const inputBuffer = Buffer.from(fileContent, "base64");
    const inputData = new Uint8Array(inputBuffer);

    console.log("Input data size:", inputData.length);

    // Compress the data using WASM
    console.log("Loading WASM module...");
    const compressedData = await compressData(inputData);
    console.log("Compression completed, size:", compressedData.length);

    // Convert compressed data back to base64
    const compressedBuffer = Buffer.from(compressedData);
    const base64Result = compressedBuffer.toString("base64");

    // Generate output filename
    const outputFileName = fileName + ".huff";

    return NextResponse.json({
      fileContent: base64Result,
      fileName: outputFileName,
      originalSize: inputBuffer.length,
      compressedSize: compressedData.length,
    });
  } catch (error) {
    console.error("Compression error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        error: "Failed to process compression request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
