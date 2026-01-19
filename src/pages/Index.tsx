import { Card, CardContent } from "@/components/ui/card";
import { createGenerationContext } from "@/lib/generators";
import { Loader2, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionsBar } from "../components/ActionsBar";
import { EditItemDialog } from "../components/EditItemDialog";
import { EmptyState } from "../components/EmptyState";
import { ScenarioList } from "../components/ScenarioList";
import { useDataLoader } from "../hooks/useDataLoader";
import { useItemEditor } from "../hooks/useItemEditor";
import {
  filterData,
  getItemSummary,
  hasScenarioData,
} from "../lib/dataHelpers";
import { handleGenerateItems } from "../lib/itemGenerationHandlers";
import { cleanInfinityValues, infinityToString } from "../lib/jsonUtils";
import { ScenarioData } from "../lib/types";

const Index = () => {
  const [data, setData] = useState<ScenarioData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const { loadFromURL, loadFromCustomURL, handleFileUpload, downloadJSON } =
    useDataLoader(setData, setIsLoading);

  const {
    editModalOpen,
    currentEdit,
    currentEditData,
    setCurrentEditData,
    activeView,
    setActiveView,
    jsonText,
    setJsonText,
    openEditModal,
    saveItem,
    deleteItem,
    handleDialogOpenChange,
  } = useItemEditor(data, setData);

  const toggleSection = (type: string) => {
    setExpandedSections((previous) => {
      const next = new Set(previous);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredData = useMemo(
    () => filterData(data, searchQuery),
    [data, searchQuery]
  );

  const hasData = useMemo(() => hasScenarioData(data), [data]);

  const generationContext = useMemo(
    () => createGenerationContext(data),
    [data]
  );

  if (!hasData && !isLoading) {
    return (
      <EmptyState
        onLoadExample={loadFromURL}
        onLoadFromUrl={loadFromCustomURL}
        onFileUpload={handleFileUpload}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative container max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Settings className="w-4 h-4" />
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

        <ActionsBar
          isLoading={isLoading}
          hasData={hasData}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLoadExample={loadFromURL}
          onLoadFromUrl={loadFromCustomURL}
          onDownload={() => downloadJSON(data)}
          onFileUpload={handleFileUpload}
        />

        <main>
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading scenario...</p>
              </CardContent>
            </Card>
          ) : (
            <ScenarioList
              filteredData={filteredData}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              onGenerateItems={(type, items, addDependencies) =>
                handleGenerateItems(type, items, setData, addDependencies)
              }
              onAddItem={(type) => openEditModal(type, null)}
              onEditItem={openEditModal}
              onDeleteItem={deleteItem}
              getItemSummary={getItemSummary}
              generationContext={generationContext}
              searchQuery={searchQuery}
            />
          )}
        </main>
      </div>

      <EditItemDialog
        open={editModalOpen}
        onOpenChange={handleDialogOpenChange}
        onClose={() => handleDialogOpenChange(false)}
        onSave={saveItem}
        activeView={activeView}
        setActiveView={setActiveView}
        currentEdit={currentEdit}
        currentEditData={currentEditData}
        setCurrentEditData={setCurrentEditData}
        jsonText={jsonText}
        setJsonText={setJsonText}
        data={data}
        cleanInfinityValues={cleanInfinityValues}
        infinityToString={infinityToString}
      />
    </div>
  );
};

export default Index;
