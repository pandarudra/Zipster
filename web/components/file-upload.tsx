"use client";

import { useState, useCallback, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Upload, File, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  accept = "*/*",
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-all duration-300 cursor-pointer group",
        isDragOver
          ? "border-primary bg-primary/5 scale-105"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        selectedFile && "border-solid border-primary bg-primary/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="p-8 text-center">
        {selectedFile ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-center">
              <File className="h-12 w-12 text-primary animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{selectedFile.name}</h3>
              <p className="text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="animate-in slide-in-from-bottom duration-300"
            >
              <X className="h-4 w-4 mr-2" />
              Remove File
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-center">
              <Upload
                className={cn(
                  "h-12 w-12 text-muted-foreground transition-all duration-300 group-hover:text-primary",
                  isDragOver && "text-primary animate-bounce"
                )}
              />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {isDragOver ? "Drop your file here" : "Upload a file"}
              </h3>
              <p className="text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
