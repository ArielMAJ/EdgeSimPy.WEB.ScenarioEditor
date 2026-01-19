import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileJson, Info, Link, Settings, Upload } from "lucide-react";
import type React from "react";
import { useRef } from "react";

type EmptyStateProps = {
  onLoadExample: () => void;
  onLoadFromUrl: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const EmptyState = ({
  onLoadExample,
  onLoadFromUrl,
  onFileUpload,
}: EmptyStateProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 pointer-events-none" />

      <main className="relative flex items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Settings className="w-4 h-4" />
              EdgeSimPy Scenario Editor
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Create and edit simulation scenarios{" "}
              <span className="text-primary">with ease</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Load, customize, and download EdgeSimPy simulation scenarios in
              JSON format
            </p>
          </div>

          <Card className="border-border/50 shadow-2xl shadow-primary/5 backdrop-blur">
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
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
                  variant="outline"
                  onClick={onLoadExample}
                  className="h-auto py-5 flex-col gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <FileJson className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Load Example</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onLoadFromUrl}
                  className="h-auto py-5 flex-col gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Link className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Load from URL</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-auto py-5 flex-col gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Upload className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Upload JSON</span>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">
                    Export
                  </span>
                </div>
              </div>

              <Button
                disabled
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
              >
                <Download className="w-4 h-4" />
                Download Scenario
              </Button>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click{" "}
                  <strong className="text-foreground">"Load Example"</strong> to
                  load the default EdgeSimPy scenario or
                  <strong className="text-foreground">
                    {" "}
                    "Load from URL"
                  </strong>{" "}
                  to load from a custom URL. Infinity values will be converted
                  to max safe integer.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Built for the EdgeSimPy simulation framework
          </p>
        </div>
      </main>
    </div>
  );
};
