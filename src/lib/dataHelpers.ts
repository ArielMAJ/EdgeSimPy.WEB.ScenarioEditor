import { ScenarioData } from "./types";

export const getItemSummary = (item: any) => {
  const source = item.attributes || item;
  const entries = Object.entries(source);
  return entries.map(([key, val]) => {
    let display: string;
    if (Array.isArray(val)) display = `[${val.length} items]`;
    else if (typeof val === "object" && val !== null) display = "[object]";
    else
      display =
        String(val).length > 30
          ? `${String(val).substring(0, 30)}...`
          : String(val);
    return { key, value: display };
  });
};

export const filterData = (data: ScenarioData, searchQuery: string) => {
  return Object.entries(data).filter(([type, items]) => {
    if (!Array.isArray(items)) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (type.toLowerCase().includes(query)) return true;
    return items.some((item) =>
      JSON.stringify(item).toLowerCase().includes(query)
    );
  });
};

export const hasScenarioData = (data: ScenarioData) => {
  return Object.keys(data).some(
    (key) => Array.isArray(data[key]) && data[key].length > 0
  );
};
