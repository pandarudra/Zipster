// Wrapper for huffman.js to fix module resolution issues in Next.js
import HuffmanModuleFactory from "./huffman.js";

// Create a wrapper that provides a safe environment for the Emscripten module
export default async function createHuffmanModule(moduleOverrides = {}) {
  // Provide enhanced module configuration to prevent URL resolution issues
  const safeModuleOverrides = {
    // Always provide a locateFile function to control file resolution
    locateFile: (path, prefix) => {
      // If a custom locateFile is provided, use it first
      if (moduleOverrides.locateFile) {
        try {
          return moduleOverrides.locateFile(path, prefix);
        } catch (e) {
          console.warn("Custom locateFile failed, using fallback:", e);
        }
      }

      // Default behavior for WASM files
      if (path.endsWith(".wasm")) {
        return path.startsWith("/") ? path : `/${path}`;
      }

      // For other files, return as-is or with prefix
      return prefix ? prefix + path : path;
    },

    // Override print and printErr to reduce noise in development
    print: (text) => {
      if (!text.includes("warning:")) {
        console.log(text);
      }
    },
    printErr: (text) => {
      if (!text.includes("warning:")) {
        console.error(text);
      }
    },

    // Merge with provided overrides
    ...moduleOverrides,
  };

  try {
    return await HuffmanModuleFactory(safeModuleOverrides);
  } catch (error) {
    console.error("Failed to initialize Huffman module:", error);
    throw error;
  }
}
