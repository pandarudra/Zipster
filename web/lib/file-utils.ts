export interface FileData {
  content: string; // base64
  name: string;
  size: number;
  type: string;
}

export class LocalFileManager {
  private static STORAGE_KEY = "huffman_files";

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
    const total = 5 * 1024 * 1024; // 5MB default estimate

    return { used, total };
  }
}
