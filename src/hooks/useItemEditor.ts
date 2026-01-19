import { useState } from "react";
import { toast } from "sonner";
import { ScenarioData, EditState } from "../lib/types";
import { cleanInfinityValues, infinityToString } from "../lib/jsonUtils";

export const useItemEditor = (
  data: ScenarioData,
  setData: React.Dispatch<React.SetStateAction<ScenarioData>>
) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<EditState>({
    type: null,
    index: null,
  });
  const [currentEditData, setCurrentEditData] = useState<any>(null);
  const [activeView, setActiveView] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");

  const openEditModal = (type: string, index: number | null) => {
    const isNew = index === null;
    let itemData: any;

    if (isNew) {
      const template = data[type]?.[0] || {};
      itemData = JSON.parse(JSON.stringify(template));
      if (itemData.attributes?.id !== undefined) {
        const maxId = Math.max(
          0,
          ...(data[type] || []).map((item) => item.attributes?.id || 0)
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
    setEditModalOpen(true);
  };

  const closeModal = () => {
    setEditModalOpen(false);
    setCurrentEdit({ type: null, index: null });
    setCurrentEditData(null);
  };

  const saveItem = () => {
    try {
      const finalData =
        activeView === "json"
          ? JSON.parse(cleanInfinityValues(jsonText))
          : currentEditData;

      setData((previous) => {
        const next = { ...previous };
        if (currentEdit.index !== null) {
          next[currentEdit.type!] = [...next[currentEdit.type!]];
          next[currentEdit.type!][currentEdit.index] = finalData;
        } else {
          next[currentEdit.type!] = [
            ...(next[currentEdit.type!] || []),
            finalData,
          ];
        }
        return next;
      });

      toast.success(
        currentEdit.index !== null ? "Item updated!" : "Item added!"
      );
      closeModal();
    } catch (error: any) {
      toast.error("Invalid data: " + error.message);
    }
  };

  const deleteItem = (type: string, index: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setData((previous) => {
      const next = { ...previous };
      next[type] = next[type].filter((_, i) => i !== index);
      return next;
    });
    toast.success("Item deleted!");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeModal();
    } else {
      setEditModalOpen(true);
    }
  };

  return {
    editModalOpen,
    currentEdit,
    currentEditData,
    setCurrentEditData,
    activeView,
    setActiveView,
    jsonText,
    setJsonText,
    openEditModal,
    closeModal,
    saveItem,
    deleteItem,
    handleDialogOpenChange,
  };
};
