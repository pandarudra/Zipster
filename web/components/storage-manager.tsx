"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { LocalFileManager, FileData } from "../lib/file-utils";
import { HardDrive, Trash2, Download } from "lucide-react";
import { formatFileSize } from "../lib/utils";
import { set } from "date-fns";

export function StorageManager() {
  const [files, setFiles] = useState<
    Record<string, FileData & { timestamp: number }>
  >({});
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });

  useEffect(() => {
    setInterval(() => {
      setFiles(LocalFileManager.getAllFiles());
      setStorageUsage(LocalFileManager.getStorageUsage());
    }, 1000);
  }, []);
  const handleDownload = (
    key: string,
    fileData: FileData & { timestamp: number }
  ) => {
    LocalFileManager.downloadFile(fileData.content, fileData.name);
  };

  const handleDelete = (key: string) => {
    LocalFileManager.removeFile(key);
  };

  const handleClearAll = () => {
    LocalFileManager.clearAllFiles();
  };

  const usagePercentage = (storageUsage.used / storageUsage.total) * 100;
  const fileEntries = Object.entries(files);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Local Storage Manager
        </CardTitle>
        <CardDescription>Manage your locally stored files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Storage Usage</span>
            <span>
              {formatFileSize(storageUsage.used)} /{" "}
              {formatFileSize(storageUsage.total)}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        {/* Files List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              Stored Files ({fileEntries.length})
            </h3>
            {fileEntries.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {fileEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No files stored locally
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fileEntries.map(([key, fileData]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileData.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(fileData.size)} •{" "}
                      {new Date(fileData.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(key, fileData)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
