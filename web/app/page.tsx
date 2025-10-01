"use client";

import { useState } from "react";
import { HeroSection } from "../components/hero-section";
import { FileUpload } from "../components/file-upload";
import { CompressionModeSelector } from "../components/compression-mode-selector";
import { ProcessingCard } from "../components/processing-card";
import { StorageManager } from "../components/storage-manager";
import { Separator } from "../components/ui/separator";
import { LocalFileManager } from "../lib/file-utils";
import { toast } from "sonner";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"compress" | "decompress">("compress");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    fileName: string;
    originalSize: number;
    processedSize: number;
    compressionRatio?: number;
  } | null>(null);

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Convert file to base64
      setProgress(25);
      const base64Content = await LocalFileManager.fileToBase64(file);

      // Save original file to localStorage for reference
      const fileKey = `original_${Date.now()}`;
      LocalFileManager.saveFile(fileKey, {
        content: base64Content,
        name: file.name,
        size: file.size,
        type: file.type,
      });

      setProgress(50);

      // Send to API
      const response = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileContent: base64Content,
          fileName: file.name,
        }),
      });

      setProgress(75);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Unknown error occurred",
        }));
        throw new Error(
          errorData.error || `Server returned ${response.status}`
        );
      }

      const data = await response.json();
      setProgress(100);

      // Save processed file to localStorage
      const processedKey = `processed_${Date.now()}`;
      LocalFileManager.saveFile(processedKey, {
        content: data.fileContent,
        name: data.fileName,
        size: mode === "compress" ? data.compressedSize : data.decompressedSize,
        type: "application/octet-stream",
      });

      // Calculate compression ratio for compress mode
      const compressionRatio =
        mode === "compress"
          ? ((file.size - data.compressedSize) / file.size) * 100
          : undefined;

      setResult({
        fileName: data.fileName,
        originalSize: file.size,
        processedSize:
          mode === "compress" ? data.compressedSize : data.decompressedSize,
        compressionRatio,
      });

      // Auto-download the processed file
      LocalFileManager.downloadFile(
        data.fileContent,
        data.fileName,
        "application/octet-stream"
      );

      toast.success(`File ${mode}ed successfully!`);
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <HeroSection className="mb-16" />

        <Separator className="my-8" />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Processing */}
          <div className="lg:col-span-2 space-y-8">
            {/* File Upload Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center">
                Upload Your File
              </h2>
              <FileUpload
                selectedFile={file}
                onFileSelect={setFile}
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Mode Selection */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center">
                Choose Operation
              </h2>
              <CompressionModeSelector
                mode={mode}
                onModeChange={setMode}
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Processing Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center">
                Process File
              </h2>
              <ProcessingCard
                file={file}
                mode={mode}
                onProcess={processFile}
                isProcessing={isProcessing}
                progress={progress}
                result={result}
                className="max-w-2xl mx-auto"
              />
            </div>
          </div>

          {/* Right Column - Storage Manager */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">File Storage</h2>
            <StorageManager />
          </div>
        </div>
      </div>
    </div>
  );
}
