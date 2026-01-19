import { toast } from "sonner";
import { ScenarioData } from "../lib/types";
import { cleanInfinityValues, infinityToString } from "../lib/jsonUtils";
import { DEFAULT_URL } from "../lib/constants";

export const useDataLoader = (
  setData: React.Dispatch<React.SetStateAction<ScenarioData>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const loadFromURL = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(DEFAULT_URL);
      const text = await response.text();
      const cleanedText = cleanInfinityValues(text);
      setData(JSON.parse(cleanedText));
      toast.success("Example scenario loaded successfully!");
    } catch (error: any) {
      toast.error("Failed to load JSON: " + error.message);
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
    } catch (error: any) {
      toast.error("Failed to load JSON: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        const text = cleanInfinityValues(readerEvent.target?.result as string);
        setData(JSON.parse(text));
        toast.success("JSON file uploaded successfully!");
      } catch (error: any) {
        toast.error("Invalid JSON file: " + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const downloadJSON = (data: ScenarioData) => {
    if (Object.keys(data).length === 0) {
      toast.error("No scenario data to download");
      return;
    }
    const jsonString = infinityToString(JSON.stringify(data, null, 2));
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "edgesimpy-scenario.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Scenario downloaded!");
  };

  return {
    loadFromURL,
    loadFromCustomURL,
    handleFileUpload,
    downloadJSON,
  };
};
