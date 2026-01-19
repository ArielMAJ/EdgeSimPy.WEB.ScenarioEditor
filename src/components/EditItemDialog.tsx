import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Plus, X } from "lucide-react";
import type React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import { EditState, ScenarioData } from "../lib/types";

export type EditItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSave: () => void;
  activeView: "form" | "json";
  setActiveView: (view: "form" | "json") => void;
  currentEdit: EditState;
  currentEditData: any;
  setCurrentEditData: React.Dispatch<React.SetStateAction<any>>;
  jsonText: string;
  setJsonText: (text: string) => void;
  data: ScenarioData;
  cleanInfinityValues: (text: string) => string;
  infinityToString: (text: string) => string;
};

export const EditItemDialog = ({
  open,
  onOpenChange,
  onClose,
  onSave,
  activeView,
  setActiveView,
  currentEdit,
  currentEditData,
  setCurrentEditData,
  jsonText,
  setJsonText,
  data,
  cleanInfinityValues,
  infinityToString,
}: EditItemDialogProps) => {
  const isReference = (obj: any): boolean =>
    Boolean(
      obj &&
        typeof obj === "object" &&
        "class" in obj &&
        "id" in obj &&
        Object.keys(obj).length === 2
    );

  const findItemsByClass = (className: string) => {
    const results: Array<{ class: string; id: number; label: string }> = [];
    const bucket = data[className];
    if (bucket && Array.isArray(bucket)) {
      bucket.forEach((item, idx) => {
        const id = item.attributes?.id || item.id || idx;
        const label = item.attributes?.label || item.label || `#${id}`;
        results.push({ class: className, id, label });
      });
    }
    return results;
  };

  const updateNestedValue = useCallback(
    (obj: any, path: string, value: any) => {
      const parts = path.split(".");
      const clone = JSON.parse(JSON.stringify(obj));
      let current = clone;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const match = part.match(/^(.+)\[(\d+)\]$/);
        current = match
          ? current[match[1]][parseInt(match[2], 10)]
          : current[part];
      }

      const last = parts[parts.length - 1];
      const lastMatch = last.match(/^(.+)\[(\d+)\]$/);
      if (lastMatch) {
        current[lastMatch[1]][parseInt(lastMatch[2], 10)] = value;
      } else {
        current[last] = value;
      }

      return clone;
    },
    []
  );

  const renderFormField = (
    key: string,
    value: any,
    path: string,
    depth: number = 0
  ): React.ReactNode => {
    if (depth > 5) return null;
    const fullPath = path ? `${path}.${key}` : key;
    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    if (Array.isArray(value)) {
      return (
        <div key={fullPath} className="space-y-2">
          <label className="text-sm font-semibold text-foreground">
            {label}
          </label>
          <div className="space-y-2 pl-4 border-l-2 border-primary/20">
            {value.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Empty array
              </p>
            ) : typeof value[0] === "object" && isReference(value[0]) ? (
              value.map((item, idx) => {
                const items = findItemsByClass(item.class);
                return (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={JSON.stringify({ class: item.class, id: item.id })}
                      onChange={(event) => {
                        const newValue = JSON.parse(event.target.value);
                        const newArray = [...value];
                        newArray[idx] = newValue;
                        setCurrentEditData((prev: any) =>
                          updateNestedValue(prev, fullPath, newArray)
                        );
                      }}
                    >
                      {items.map((ref) => (
                        <option
                          key={ref.id}
                          value={JSON.stringify({
                            class: ref.class,
                            id: ref.id,
                          })}
                        >
                          {ref.class} #{ref.id}{" "}
                          {ref.label !== `#${ref.id}` ? `(${ref.label})` : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => {
                        const newArray = value.filter(
                          (_: any, i: number) => i !== idx
                        );
                        setCurrentEditData((prev: any) =>
                          updateNestedValue(prev, fullPath, newArray)
                        );
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            ) : typeof value[0] === "object" ? (
              value
                .filter((item: any) => item !== null && item !== undefined)
                .map((item, idx) => (
                  <Collapsible
                    key={idx}
                    className="border border-border rounded-lg"
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-muted/50 transition-colors">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Item {idx + 1}
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 pt-0 space-y-3">
                      {Object.entries(item || {}).map(([k, v]) =>
                        renderFormField(k, v, `${fullPath}[${idx}]`, depth + 1)
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))
            ) : (
              value.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    type={typeof item === "number" ? "number" : "text"}
                    value={item}
                    onChange={(event) => {
                      const newArray = [...value];
                      newArray[idx] =
                        typeof item === "number"
                          ? parseFloat(event.target.value)
                          : event.target.value;
                      setCurrentEditData((prev: any) =>
                        updateNestedValue(prev, fullPath, newArray)
                      );
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => {
                      const newArray = value.filter(
                        (_: any, i: number) => i !== idx
                      );
                      setCurrentEditData((prev: any) =>
                        updateNestedValue(prev, fullPath, newArray)
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-accent border-accent/50 hover:bg-accent/10"
              onClick={() => {
                const template =
                  value[0] || (typeof value[0] === "number" ? 0 : "");
                const newArray = [
                  ...value,
                  typeof template === "object"
                    ? JSON.parse(JSON.stringify(template))
                    : template,
                ];
                setCurrentEditData((prev: any) =>
                  updateNestedValue(prev, fullPath, newArray)
                );
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Item
            </Button>
          </div>
        </div>
      );
    }

    if (isReference(value)) {
      const items = findItemsByClass(value.class);
      return (
        <div
          key={fullPath}
          className="grid grid-cols-3 gap-3 items-center py-2 border-b border-border/50 last:border-0"
        >
          <label className="text-sm font-medium text-foreground">{label}</label>
          <select
            className="col-span-2 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={JSON.stringify({ class: value.class, id: value.id })}
            onChange={(event) => {
              const newValue = event.target.value
                ? JSON.parse(event.target.value)
                : null;
              setCurrentEditData((prev: any) =>
                updateNestedValue(prev, fullPath, newValue)
              );
            }}
          >
            <option value="">-- None --</option>
            {items.map((ref) => (
              <option
                key={ref.id}
                value={JSON.stringify({ class: ref.class, id: ref.id })}
              >
                {ref.class} #{ref.id}{" "}
                {ref.label !== `#${ref.id}` ? `(${ref.label})` : ""}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <Collapsible key={fullPath} className="border border-border rounded-lg">
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-muted/50 transition-colors">
            <ChevronRight className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">
              ({Object.keys(value).length} properties)
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-0 space-y-3">
            {Object.entries(value || {}).map(([k, v]) =>
              renderFormField(k, v, fullPath, depth + 1)
            )}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (typeof value === "boolean") {
      return (
        <div
          key={fullPath}
          className="grid grid-cols-3 gap-3 items-center py-2 border-b border-border/50 last:border-0"
        >
          <label className="text-sm font-medium text-foreground">{label}</label>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(event) =>
                setCurrentEditData((prev: any) =>
                  updateNestedValue(prev, fullPath, event.target.checked)
                )
              }
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm text-muted-foreground">
              {value ? "true" : "false"}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={fullPath}
        className="grid grid-cols-3 gap-3 items-center py-2 border-b border-border/50 last:border-0"
      >
        <label className="text-sm font-medium text-foreground">{label}</label>
        <Input
          type={typeof value === "number" ? "number" : "text"}
          value={value ?? ""}
          onChange={(event) => {
            const newVal =
              typeof value === "number"
                ? parseFloat(event.target.value)
                : event.target.value;
            setCurrentEditData((prev: any) =>
              updateNestedValue(prev, fullPath, newVal)
            );
          }}
          className="col-span-2"
          step={typeof value === "number" ? "any" : undefined}
        />
      </div>
    );
  };

  const handleSwitchToForm = () => {
    if (activeView === "json") {
      try {
        const cleanedText = cleanInfinityValues(jsonText);
        setCurrentEditData(JSON.parse(cleanedText));
      } catch (error) {
        toast.error("Invalid JSON");
        return;
      }
    }
    setActiveView("form");
  };

  const handleSwitchToJson = () => {
    setJsonText(infinityToString(JSON.stringify(currentEditData, null, 2)));
    setActiveView("json");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground -m-6 mb-0 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {currentEdit.index !== null ? "Edit" : "Add"} {currentEdit.type}
            </DialogTitle>
            <div className="flex bg-background/10 rounded-lg p-1 gap-1">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeView === "form"
                    ? "bg-background text-primary"
                    : "text-primary-foreground hover:bg-background/20"
                }`}
                onClick={handleSwitchToForm}
              >
                📝 Form
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeView === "json"
                    ? "bg-background text-primary"
                    : "text-primary-foreground hover:bg-background/20"
                }`}
                onClick={handleSwitchToJson}
              >
                {"{ }"} JSON
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
          <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-3 mb-4 text-sm text-primary">
            💡 <strong>Tip:</strong>{" "}
            {activeView === "form"
              ? "Simple fields are directly editable. Expandable sections show nested objects."
              : "Advanced editing mode. Edit the raw JSON structure directly."}
          </div>

          {activeView === "form" && currentEditData && (
            <div className="space-y-4">
              {currentEditData.attributes && (
                <div className="border border-border rounded-lg p-4 bg-card">
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    ⚙️ Attributes
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(currentEditData.attributes).map(
                      ([key, value]) =>
                        renderFormField(key, value, "attributes")
                    )}
                  </div>
                </div>
              )}
              {currentEditData.relationships && (
                <div className="border border-border rounded-lg p-4 bg-card">
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    🔗 Relationships
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(currentEditData.relationships).map(
                      ([key, value]) =>
                        renderFormField(key, value, "relationships")
                    )}
                  </div>
                </div>
              )}
              {!currentEditData.attributes &&
                !currentEditData.relationships && (
                  <div className="border border-border rounded-lg p-4 bg-card">
                    <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                      📋 Properties
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(currentEditData).map(([key, value]) =>
                        renderFormField(key, value, "")
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {activeView === "json" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">JSON Data</label>
              <Textarea
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4 -mx-6 -mb-6 px-6 pb-6 bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-accent text-accent-foreground hover:bg-accent/90 mb-2"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
