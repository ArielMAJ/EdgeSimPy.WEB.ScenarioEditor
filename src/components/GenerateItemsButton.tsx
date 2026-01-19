import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenerationContext } from "@/lib/generators";
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface GenerateItemsConfig {
  itemType: string;
  template: Record<string, any>;
  generateItem: (
    index: number,
    context?: GenerationContext,
  ) => Record<string, any>;
  onItemsGenerated: (
    items: Record<string, any>[],
    addDependencies: boolean,
  ) => void;
  context?: GenerationContext;
}

export const GenerateItemsButton = ({
  itemType,
  template,
  generateItem,
  onItemsGenerated,
  context,
}: GenerateItemsConfig) => {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(10);
  const [addDependencies, setAddDependencies] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (count <= 0) {
      toast.error("Please enter a number greater than 0");
      return;
    }

    if (count > 10000) {
      toast.error("Maximum 10000 items can be generated at once");
      return;
    }

    setIsGenerating(true);
    try {
      // Calculate the next index based on existing items
      const existingItems = context?.existingItems[itemType] || [];
      const maxId = Math.max(
        0,
        ...existingItems.map((item) => item.attributes?.id ?? item.id ?? 0),
      );
      const startIndex = maxId + 1;

      const items = Array.from({ length: count }, (_, i) => {
        const item = generateItem(startIndex + i, context);
        return JSON.parse(JSON.stringify(item));
      });

      onItemsGenerated(items, addDependencies);
      toast.success(
        `Generated ${count} ${itemType}(s)${addDependencies ? " with dependencies" : ""}`,
      );
      setIsOpen(false);
      setCount(10);
    } catch (error: any) {
      toast.error(`Failed to generate items: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Zap className="w-4 h-4" />
        Generate {count}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Generate Random {itemType}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of {itemType} to generate</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={10000}
                  value={count}
                  onChange={(e) =>
                    setCount(Math.max(1, parseInt(e.target.value) || 0))
                  }
                  className="flex-1"
                  placeholder="Enter number..."
                />
                <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                  {count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You can generate between 1 and 10,000 items
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="add-dependencies"
                  checked={addDependencies}
                  onCheckedChange={(checked) =>
                    setAddDependencies(checked as boolean)
                  }
                />
                <Label
                  htmlFor="add-dependencies"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Automatically add dependencies
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                When enabled, automatically creates related items (e.g., access
                patterns for Users/Applications, network links for
                NetworkSwitches)
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-sm font-medium">Preview Template</p>
              <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
                {JSON.stringify(template, null, 2)}
              </pre>
            </div>
          </div>
          <div className="p-3 bg-muted border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">⚠️ Warning:</strong> Generated
              items may contain errors or invalid relationships. Please verify
              the generated data matches the structure expected by the EdgeSimPy
              simulator.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
