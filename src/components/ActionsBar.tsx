import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, FileJson, Link, Search, Upload } from "lucide-react";
import type React from "react";
import { useRef } from "react";

type ActionsBarProps = {
  isLoading: boolean;
  hasData: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onLoadExample: () => void;
  onLoadFromUrl: () => void;
  onDownload: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const ActionsBar = ({
  isLoading,
  hasData,
  searchQuery,
  onSearchChange,
  onLoadExample,
  onLoadFromUrl,
  onDownload,
  onFileUpload,
}: ActionsBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="mb-6 border-border/50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(event) => {
              onFileUpload(event);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="hidden"
          />
          <Button
            onClick={onLoadExample}
            disabled={isLoading}
            className="gap-2"
          >
            <FileJson className="w-4 h-4" />
            Load Example JSON
          </Button>
          <Button
            onClick={onLoadFromUrl}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <Link className="w-4 h-4" />
            Load from URL
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload JSON
          </Button>
          <Button
            onClick={onDownload}
            disabled={!hasData}
            variant="secondary"
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Download className="w-4 h-4" />
            Download Scenario
          </Button>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or component type..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
