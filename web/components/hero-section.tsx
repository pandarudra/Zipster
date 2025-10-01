"use client";

import { Card, CardContent } from "./ui/card";
import { FileText, Zap, Shield } from "lucide-react";
import { cn } from "../lib/utils";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const features = [
    {
      icon: FileText,
      title: "Any File Type",
      description: "Compress and decompress files of any format",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Lightning-fast Huffman compression algorithm",
    },
    {
      icon: Shield,
      title: "Lossless",
      description: "Perfect reconstruction of original files",
    },
  ];

  return (
    <div className={cn("text-center space-y-8", className)}>
      <div className="space-y-4 animate-in fade-in duration-700">
        <h1 className="text-4xl font-virgil md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-700 delay-100">
          Zipster
        </h1>
        <p className="text-xl font-virgil text-muted-foreground max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700 delay-200">
          Efficient lossless data compression using Huffman coding algorithm.
          Compress your files to save space or decompress them to restore
          originals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700 delay-300">
        {features.map((feature, index) => (
          <Card
            key={feature.title}
            className="border-0 bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-105"
            style={{
              animationDelay: `${400 + index * 100}ms`,
            }}
          >
            <CardContent className="p-6 text-center">
              <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
