"use client";

import { Card, CardContent } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Archive, FolderOpen } from "lucide-react";
import { cn } from "../lib/utils";

interface CompressionModeSelectorProps {
  mode: "compress" | "decompress";
  onModeChange: (mode: "compress" | "decompress") => void;
  className?: string;
}

export function CompressionModeSelector({
  mode,
  onModeChange,
  className,
}: CompressionModeSelectorProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">Select Operation</h3>
        <RadioGroup
          value={mode}
          onValueChange={onModeChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="relative">
            <RadioGroupItem
              value="compress"
              id="compress"
              className="peer sr-only"
            />
            <Label
              htmlFor="compress"
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-md",
                mode === "compress"
                  ? "border-primary bg-primary/5 shadow-lg scale-105"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <Archive
                className={cn(
                  "h-8 w-8 mb-3 transition-colors duration-300",
                  mode === "compress" ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="font-semibold">Compress</span>
              <span className="text-sm text-muted-foreground mt-1 text-center">
                Reduce file size
              </span>
            </Label>
          </div>

          <div className="relative">
            <RadioGroupItem
              value="decompress"
              id="decompress"
              className="peer sr-only"
            />
            <Label
              htmlFor="decompress"
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-md",
                mode === "decompress"
                  ? "border-primary bg-primary/5 shadow-lg scale-105"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <FolderOpen
                className={cn(
                  "h-8 w-8 mb-3 transition-colors duration-300",
                  mode === "decompress"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <span className="font-semibold">Decompress</span>
              <span className="text-sm text-muted-foreground mt-1 text-center">
                Restore original file
              </span>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
