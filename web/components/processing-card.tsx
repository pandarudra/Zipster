"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, Download, FileIcon, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "../lib/utils";

interface ProcessingCardProps {
  file: File | null;
  mode: "compress" | "decompress";
  onProcess: () => Promise<void>;
  isProcessing: boolean;
  progress: number;
  result: {
    fileName: string;
    originalSize: number;
    processedSize: number;
    compressionRatio?: number;
  } | null;
  className?: string;
}

export function ProcessingCard({
  file,
  mode,
  onProcess,
  isProcessing,
  progress,
  result,
  className,
}: ProcessingCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "compress" ? "Compress File" : "Decompress File"}
          {result && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {file && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg animate-in fade-in duration-300">
            <FileIcon className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                {mode === "compress" ? "Compressing..." : "Decompressing..."}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {progress.toFixed(0)}% complete
            </p>
          </div>
        )}

        {result && !isProcessing && (
          <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                File processed successfully!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Original</p>
                <p className="font-semibold">
                  {formatFileSize(result.originalSize)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === "compress" ? "Compressed" : "Decompressed"}
                </p>
                <p className="font-semibold">
                  {formatFileSize(result.processedSize)}
                </p>
              </div>
              {mode === "compress" && result.compressionRatio !== undefined && (
                <div className="col-span-2 text-center pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Compression Result
                  </p>
                  <p
                    className={`font-semibold ${
                      result.compressionRatio > 0
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {result.compressionRatio > 0
                      ? `${result.compressionRatio.toFixed(1)}% reduction`
                      : `${Math.abs(result.compressionRatio).toFixed(
                          1
                        )}% expansion`}
                  </p>
                  {result.compressionRatio <= 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Small files may expand due to compression overhead
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={onProcess}
          disabled={!file || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "compress" ? "Compressing..." : "Decompressing..."}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {mode === "compress" ? "Compress File" : "Decompress File"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
