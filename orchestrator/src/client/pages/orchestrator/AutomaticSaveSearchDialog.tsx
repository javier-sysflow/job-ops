import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AutomaticSaveSearchDialogProps {
  open: boolean;
  mode: "create" | "update";
  name: string;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
}

export function AutomaticSaveSearchDialog({
  open,
  mode,
  name,
  isSaving,
  onOpenChange,
  onNameChange,
  onSave,
}: AutomaticSaveSearchDialogProps) {
  const { t } = useTranslation(["pipeline", "common"]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "update"
              ? t("savedSearches.dialog.updateTitle")
              : t("savedSearches.dialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("savedSearches.dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="saved-search-name">
            {t("savedSearches.dialog.name")}
          </Label>
          <Input
            id="saved-search-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSave();
              }
            }}
            placeholder={t("savedSearches.dialog.namePlaceholder")}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common:actions.cancel")}
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={isSaving || name.trim().length === 0}
            onClick={onSave}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {t("common:actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
