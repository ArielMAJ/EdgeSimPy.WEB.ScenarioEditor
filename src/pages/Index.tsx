import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Download,
  Upload,
  Link,
  FileJson,
  Info,
  Sparkles,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
} from "lucide-react";

const DEFAULT_URL =
  "https://raw.githubusercontent.com/ArielMAJ/EdgeSimPy.API/refs/heads/test/test.json";

type ScenarioData = Record<string, any[]>;
type EditState = { type: string | null; index: number | null };

const Index = () => {
  const [data, setData] = useState<ScenarioData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [editModal, setEditModal] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<EditState>({
    type: null,
    index: null,
  });
  const [currentEditData, setCurrentEditData] = useState<any>(null);
  const [activeView, setActiveView] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanInfinityValues = (text: string) => {
    return text
      .replace(/:\s*Infinity/g, ": 9007199254740991")
      .replace(/\[\s*Infinity\s*\]/g, "[9007199254740991]");
  };

  const infinityToString = (jsonString: string) => {
    return jsonString
      .replace(/:\s*9007199254740991([,\n\r\s}]|$)/g, ": Infinity$1")
      .replace(/\[\s*9007199254740991\s*\]/g, "[Infinity]");
  };

  const loadFromURL = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(DEFAULT_URL);
      const text = await response.text();
      const cleanedText = cleanInfinityValues(text);
      setData(JSON.parse(cleanedText));
      toast.success("Example scenario loaded successfully!");
    } catch (err: any) {
      toast.error("Failed to load JSON: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromCustomURL = async () => {
    const url = prompt("Enter the URL to load JSON from:", "");
    if (!url) return;

    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const cleanedText = cleanInfinityValues(text);
      setData(JSON.parse(cleanedText));
      toast.success("Scenario loaded from URL!");
    } catch (err: any) {
      toast.error("Failed to load JSON: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = cleanInfinityValues(e.target?.result as string);
          setData(JSON.parse(text));
          toast.success("JSON file uploaded successfully!");
        } catch (err: any) {
          toast.error("Invalid JSON file: " + err.message);
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadJSON = () => {
    if (Object.keys(data).length === 0) {
      toast.error("No scenario data to download");
      return;
    }
    const jsonString = infinityToString(JSON.stringify(data, null, 2));
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edgesimpy-scenario.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Scenario downloaded!");
  };

  const toggleSection = (type: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const getItemSummary = (item: any) => {
    const source = item.attributes || item;
    const entries = Object.entries(source).slice(0, 4);
    return entries.map(([key, val]) => {
      let display: string;
      if (Array.isArray(val)) display = `[${val.length} items]`;
      else if (typeof val === "object" && val !== null) display = "[object]";
      else
        display =
          String(val).length > 30
            ? String(val).substring(0, 30) + "..."
            : String(val);
      return { key, value: display };
    });
  };

  const openEditModal = (type: string, index: number | null) => {
    const isNew = index === null;
    let itemData: any;

    if (isNew) {
      const template = data[type]?.[0] || {};
      itemData = JSON.parse(JSON.stringify(template));
      if (itemData.attributes?.id !== undefined) {
        const maxId = Math.max(
          0,
          ...data[type].map((i) => i.attributes?.id || 0)
        );
        itemData.attributes.id = maxId + 1;
      }
    } else {
      itemData = JSON.parse(JSON.stringify(data[type][index]));
    }

    setCurrentEdit({ type, index });
    setCurrentEditData(itemData);
    setJsonText(infinityToString(JSON.stringify(itemData, null, 2)));
    setActiveView("form");
    setEditModal(true);
  };

  const closeModal = () => {
    setEditModal(false);
    setCurrentEdit({ type: null, index: null });
    setCurrentEditData(null);
  };

  const saveItem = () => {
    try {
      let finalData: any;
      if (activeView === "json") {
        const cleanedText = cleanInfinityValues(jsonText);
        finalData = JSON.parse(cleanedText);
      } else {
        finalData = currentEditData;
      }

      setData((prev) => {
        const newData = { ...prev };
        if (currentEdit.index !== null) {
          newData[currentEdit.type!] = [...newData[currentEdit.type!]];
          newData[currentEdit.type!][currentEdit.index] = finalData;
        } else {
          newData[currentEdit.type!] = [
            ...(newData[currentEdit.type!] || []),
            finalData,
          ];
        }
        return newData;
      });

      toast.success(
        currentEdit.index !== null ? "Item updated!" : "Item added!"
      );
      closeModal();
    } catch (err: any) {
      toast.error("Invalid data: " + err.message);
    }
  };

  const deleteItem = (type: string, index: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setData((prev) => {
        const newData = { ...prev };
        newData[type] = newData[type].filter((_, i) => i !== index);
        return newData;
      });
      toast.success("Item deleted!");
    }
  };

  const isReference = (obj: any): boolean => {
    return (
      obj &&
      typeof obj === "object" &&
      "class" in obj &&
      "id" in obj &&
      Object.keys(obj).length === 2
    );
  };

  const findItemsByClass = (className: string) => {
    const results: Array<{ class: string; id: number; label: string }> = [];
    if (data[className] && Array.isArray(data[className])) {
      data[className].forEach((item, idx) => {
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
      const newObj = JSON.parse(JSON.stringify(obj));
      let current = newObj;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          current = current[arrayMatch[1]][parseInt(arrayMatch[2])];
        } else {
          current = current[part];
        }
      }

      const lastPart = parts[parts.length - 1];
      const lastArrayMatch = lastPart.match(/^(.+)\[(\d+)\]$/);
      if (lastArrayMatch) {
        current[lastArrayMatch[1]][parseInt(lastArrayMatch[2])] = value;
      } else {
        current[lastPart] = value;
      }

      return newObj;
    },
    []
  );

  const getNestedValue = (obj: any, path: string) => {
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        current = current?.[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        current = current?.[part];
      }
      if (current === undefined) return undefined;
    }
    return current;
  };

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
                      onChange={(e) => {
                        const newValue = JSON.parse(e.target.value);
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
              value.map((item, idx) => (
                <Collapsible
                  key={idx}
                  className="border border-border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-muted/50 transition-colors">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Item {idx + 1}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 pt-0 space-y-3">
                    {Object.entries(item).map(([k, v]) =>
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
                    onChange={(e) => {
                      const newArray = [...value];
                      newArray[idx] =
                        typeof item === "number"
                          ? parseFloat(e.target.value)
                          : e.target.value;
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
            onChange={(e) => {
              const newValue = e.target.value
                ? JSON.parse(e.target.value)
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
            {Object.entries(value).map(([k, v]) =>
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
              onChange={(e) =>
                setCurrentEditData((prev: any) =>
                  updateNestedValue(prev, fullPath, e.target.checked)
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
          onChange={(e) => {
            const newVal =
              typeof value === "number"
                ? parseFloat(e.target.value)
                : e.target.value;
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

  const filteredData = Object.entries(data).filter(([type, items]) => {
    if (!Array.isArray(items)) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (type.toLowerCase().includes(query)) return true;
    return items.some((item) =>
      JSON.stringify(item).toLowerCase().includes(query)
    );
  });

  const hasData = Object.keys(data).some(
    (key) => Array.isArray(data[key]) && data[key].length > 0
  );

  // Initial centered view when no data is loaded
  if (!hasData && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Gradient background effect */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 pointer-events-none" />

        <main className="relative flex items-center justify-center min-h-screen px-4 py-16">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
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

            {/* Main Card */}
            <Card className="border-border/50 shadow-2xl shadow-primary/5 backdrop-blur">
              <CardContent className="p-8 space-y-6">
                {/* Action Buttons */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={loadFromURL}
                    className="h-auto py-5 flex-col gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <FileJson className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Load Example</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadFromCustomURL}
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

                {/* Divider */}
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

                {/* Download Button */}
                <Button
                  disabled
                  className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
                >
                  <Download className="w-4 h-4" />
                  Download Scenario
                </Button>

                {/* Info Note */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click{" "}
                    <strong className="text-foreground">"Load Example"</strong>{" "}
                    to load the default EdgeSimPy scenario or{" "}
                    <strong className="text-foreground">"Load from URL"</strong>{" "}
                    to load from a custom URL. Infinity values will be converted
                    to max safe integer.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Built for the EdgeSimPy simulation framework
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            EdgeSimPy Scenario Editor
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Create and edit simulation scenarios{" "}
            <span className="text-primary">with ease</span>
          </h1>
          <p className="text-muted-foreground">
            Load, customize, and download EdgeSimPy simulation scenarios in JSON
            format
          </p>
        </header>

        {/* Actions Bar */}
        <Card className="mb-6 border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={loadFromURL}
                disabled={isLoading}
                className="gap-2"
              >
                <FileJson className="w-4 h-4" />
                Load Example JSON
              </Button>
              <Button
                onClick={loadFromCustomURL}
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
                onClick={downloadJSON}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <main>
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading scenario...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredData.map(([type, items]) => (
                <Card key={type} className="border-border/50 overflow-hidden">
                  <Collapsible
                    open={expandedSections.has(type)}
                    onOpenChange={() => toggleSection(type)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronRight
                            className={`w-5 h-5 text-primary transition-transform ${
                              expandedSections.has(type) ? "rotate-90" : ""
                            }`}
                          />
                          <span className="font-semibold text-lg break-all overflow-wrap">
                            {type}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold whitespace-nowrap">
                            {items.length} items
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(type, null);
                          }}
                        >
                          <Plus className="w-3 h-3" /> Add
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 pt-0">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {items
                            .filter(
                              (item) =>
                                !searchQuery ||
                                JSON.stringify(item)
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                            )
                            .map((item, idx) => {
                              const id = item.attributes?.id || item.id || idx;
                              const summary = getItemSummary(item);
                              return (
                                <div
                                  key={idx}
                                  className="border border-border rounded-lg p-4 bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                >
                                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                                    <span className="font-bold text-primary">
                                      #{id}
                                    </span>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEditModal(type, idx)}
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => deleteItem(type, idx)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    {summary.map(({ key, value }) => (
                                      <div key={key}>
                                        <span className="font-medium text-foreground">
                                          {key}:
                                        </span>{" "}
                                        {value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
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
                  onClick={() => {
                    if (activeView === "json") {
                      try {
                        const cleanedText = cleanInfinityValues(jsonText);
                        setCurrentEditData(JSON.parse(cleanedText));
                      } catch (err) {
                        toast.error("Invalid JSON");
                        return;
                      }
                    }
                    setActiveView("form");
                  }}
                >
                  📝 Form
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeView === "json"
                      ? "bg-background text-primary"
                      : "text-primary-foreground hover:bg-background/20"
                  }`}
                  onClick={() => {
                    setJsonText(
                      infinityToString(JSON.stringify(currentEditData, null, 2))
                    );
                    setActiveView("json");
                  }}
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
                  onChange={(e) => setJsonText(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-4 -mx-6 -mb-6 px-6 pb-6 bg-muted/30">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={saveItem}
              className="bg-accent text-accent-foreground hover:bg-accent/90 mb-2"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
