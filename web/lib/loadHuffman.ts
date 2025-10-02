let wasmModule: HuffmanModule | null = null;

interface HuffmanModule {
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  _compress: (inputPtr: number, inputSize: number, outputPtr: number) => number;
  _decompress: (
    inputPtr: number,
    inputSize: number,
    outputPtr: number
  ) => number;
  HEAPU8: Uint8Array;
}

export async function loadHuffman(): Promise<HuffmanModule> {
  if (!wasmModule) {
    try {
      // Different handling for server vs browser
      const isServer = typeof window === "undefined";

      let wasmPath: string;
      let moduleObj: {
        locateFile: (fileName: string) => string;
        noNodeJS?: boolean;
      };

      if (isServer) {
        // Server-side: Load WASM from file system
        const path = await import("path");
        const fs = await import("fs");

        wasmPath = path.join(process.cwd(), "public", "huffman.wasm");

        // Check if WASM file exists
        if (!fs.existsSync(wasmPath)) {
          throw new Error(`WASM file not found at ${wasmPath}`);
        }

        moduleObj = {
          locateFile: (fileName: string) => {
            if (fileName.endsWith(".wasm")) {
              return wasmPath;
            }
            return fileName;
          },
          // Disable node-specific features that might conflict
          noNodeJS: false,
        };
      } else {
        // Browser-side: Load WASM from public URL
        wasmPath = "/huffman.wasm";

        moduleObj = {
          locateFile: (path: string) => {
            if (path.endsWith(".wasm")) {
              return wasmPath;
            }
            return path;
          },
          // Disable Node.js-specific features in browser
          noNodeJS: true,
        };
      }

      // Import and initialize the Emscripten module
      const createHuffmanModule = (await import("./huffman-wrapper.js"))
        .default;
      wasmModule = (await createHuffmanModule(moduleObj)) as HuffmanModule;

      console.log(
        `WASM module loaded successfully on ${isServer ? "server" : "client"}`
      );
    } catch (error) {
      console.error("Failed to load WASM module:", error);
      throw new Error(`WASM module loading failed: ${error}`);
    }
  }
  return wasmModule!;
}

export async function compressData(inputData: Uint8Array): Promise<Uint8Array> {
  const wasm = await loadHuffman();

  // Allocate memory for input
  const inputPtr = wasm._malloc(inputData.length);
  wasm.HEAPU8.set(inputData, inputPtr);

  // Allocate memory for output (assume worst case: 2x input size)
  const maxOutputSize = inputData.length * 2;
  const outputPtr = wasm._malloc(maxOutputSize);

  try {
    // Call the compress function
    const compressedSize = wasm._compress(
      inputPtr,
      inputData.length,
      outputPtr
    );

    if (compressedSize <= 0) {
      throw new Error("Compression failed");
    }

    // Copy the compressed data
    const compressedData = new Uint8Array(compressedSize);
    compressedData.set(
      wasm.HEAPU8.subarray(outputPtr, outputPtr + compressedSize)
    );

    return compressedData;
  } finally {
    // Clean up allocated memory
    wasm._free(inputPtr);
    wasm._free(outputPtr);
  }
}

export async function decompressData(
  inputData: Uint8Array
): Promise<Uint8Array> {
  const wasm = await loadHuffman();

  // Allocate memory for input
  const inputPtr = wasm._malloc(inputData.length);
  wasm.HEAPU8.set(inputData, inputPtr);

  // Allocate memory for output (estimate: 4x input size for decompression)
  const maxOutputSize = inputData.length * 4;
  const outputPtr = wasm._malloc(maxOutputSize);

  try {
    // Call the decompress function
    const decompressedSize = wasm._decompress(
      inputPtr,
      inputData.length,
      outputPtr
    );

    if (decompressedSize <= 0) {
      throw new Error("Decompression failed");
    }

    // Copy the decompressed data
    const decompressedData = new Uint8Array(decompressedSize);
    decompressedData.set(
      wasm.HEAPU8.subarray(outputPtr, outputPtr + decompressedSize)
    );

    return decompressedData;
  } finally {
    // Clean up allocated memory
    wasm._free(inputPtr);
    wasm._free(outputPtr);
  }
}
