import type { PipelineSearchPreset } from "@shared/types";
import { useTranslation } from "react-i18next";
import { BookmarkPlus, Save, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AutomaticSavedSearchControlsProps {
  savedSearches: PipelineSearchPreset[];
  selectedSavedSearch: PipelineSearchPreset | null;
  selectedSavedSearchId: string | null;
  isLoading: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onApplySavedSearch: (preset: PipelineSearchPreset) => void;
  onOpenSaveDialog: (mode: "create" | "update") => void;
  onDeleteSelectedSearch: () => void;
}

export function AutomaticSavedSearchControls({
  savedSearches,
  selectedSavedSearch,
  selectedSavedSearchId,
  isLoading,
  canCreate,
  canUpdate,
  canDelete,
  onApplySavedSearch,
  onOpenSaveDialog,
  onDeleteSelectedSearch,
}: AutomaticSavedSearchControlsProps) {
  const { t } = useTranslation("pipeline");
  return (
    <div className="flex flex-col gap-2">
      <Label className="sr-only">{t("savedSearches.label")}</Label>
      <div className="min-w-48 flex-1">
        <Select
          value={selectedSavedSearchId ?? ""}
          onValueChange={(id) => {
            const preset = savedSearches.find((search) => search.id === id);
            if (preset) onApplySavedSearch(preset);
          }}
          disabled={savedSearches.length === 0}
        >
          <SelectTrigger
            aria-label={t("savedSearches.label")}
            className="h-9 min-w-0 flex-1"
          >
            <SelectValue
              placeholder={
                isLoading
                  ? t("savedSearches.loading")
                  : t("savedSearches.placeholder")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {savedSearches.map((search) => (
                <SelectItem key={search.id} value={search.id}>
                  {search.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {canCreate ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenSaveDialog("create")}
          >
            <BookmarkPlus data-icon="inline-start" />
            {t("savedSearches.saveAs")}
          </Button>
        ) : null}
        {canUpdate && selectedSavedSearch ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenSaveDialog("update")}
          >
            <Save data-icon="inline-start" />
            {t("savedSearches.update")}
          </Button>
        ) : null}
        {canDelete && selectedSavedSearch ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t("savedSearches.delete")}
            title={t("savedSearches.delete")}
            onClick={onDeleteSelectedSearch}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
