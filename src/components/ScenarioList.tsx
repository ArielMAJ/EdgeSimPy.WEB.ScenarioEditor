import { GenerateItemsButton } from "@/components/GenerateItemsButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getGeneratorForType } from "@/lib/generators";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

type SummaryEntry = { key: string; value: string };

type ScenarioListProps = {
  filteredData: [string, any[]][];
  expandedSections: Set<string>;
  onToggleSection: (type: string) => void;
  onGenerateItems: (type: string, items: any[], addDependencies: boolean) => void;
  onAddItem: (type: string) => void;
  onEditItem: (type: string, index: number) => void;
  onDeleteItem: (type: string, index: number) => void;
  getItemSummary: (item: any) => SummaryEntry[];
  generationContext: any;
  searchQuery: string;
};

export const ScenarioList = ({
  filteredData,
  expandedSections,
  onToggleSection,
  onGenerateItems,
  onAddItem,
  onEditItem,
  onDeleteItem,
  getItemSummary,
  generationContext,
  searchQuery,
}: ScenarioListProps) => (
  <div className="space-y-4">
    {filteredData.map(([type, items]) => (
      <Card key={type} className="border-border/50 overflow-hidden">
        <Collapsible
          open={expandedSections.has(type)}
          onOpenChange={() => onToggleSection(type)}
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
              <div className="flex gap-2">
                <GenerateItemsButton
                  itemType={type}
                  template={items[0] || {}}
                  generateItem={getGeneratorForType(type)}
                  onItemsGenerated={(newItems, addDependencies) =>
                    onGenerateItems(type, newItems, addDependencies)
                  }
                  context={generationContext}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddItem(type);
                  }}
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-4 pt-0">
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
                          <span className="font-bold text-primary">#{id}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEditItem(type, idx)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => onDeleteItem(type, idx)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {summary.map(({ key, value }) => (
                            <div key={key} className="truncate">
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
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    ))}
  </div>
);
