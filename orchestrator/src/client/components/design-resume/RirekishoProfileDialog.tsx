/**
 * Fork: the 履歴書 fields Resume Studio has no place for (ふりがな, 生年月日,
 * 住所, 連絡先, base 志望動機, 本人希望記入欄). Saved in the `rirekishoProfile`
 * setting. Fields never saved open with what a 履歴書 import left in the
 * résumé, so an imported 履歴書 needs no retyping.
 */
import {
  type ResolvedRirekishoProfile,
  type RirekishoProfile,
  resolveRirekishoProfile,
} from "@shared/rirekisho.js";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdateSettingsMutation } from "@/client/hooks/queries/useSettingsMutation";
import { showErrorToast } from "@/client/lib/error-toast";
import { downloadDesignRirekishoPdf } from "@/client/lib/private-pdf";
import { Download, Loader2, Save } from "@/components/icons";
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
import { Textarea } from "@/components/ui/textarea";

type Field = keyof ResolvedRirekishoProfile;

const TEXT_FIELDS: Array<{ field: Field; type?: "date" | "tel" | "email" }> = [
  { field: "furigana" },
  { field: "birthDate", type: "date" },
  { field: "gender" },
  { field: "postalCode" },
];

export const RirekishoProfileDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeJson: unknown;
  storedProfile: RirekishoProfile | null | undefined;
}> = ({ open, onOpenChange, resumeJson, storedProfile }) => {
  const { t } = useTranslation(["resumeStudio", "common"]);
  const updateSettings = useUpdateSettingsMutation();
  const [form, setForm] = useState<ResolvedRirekishoProfile>(() =>
    resolveRirekishoProfile(storedProfile, resumeJson),
  );
  const [initial, setInitial] = useState(form);
  const [downloading, setDownloading] = useState(false);

  // Reload from the latest résumé and settings each time it opens.
  useEffect(() => {
    if (!open) return;
    const resolved = resolveRirekishoProfile(storedProfile, resumeJson);
    setForm(resolved);
    setInitial(resolved);
  }, [open, storedProfile, resumeJson]);

  const dirty = (Object.keys(form) as Field[]).some(
    (field) => form[field] !== initial[field],
  );
  const saving = updateSettings.isPending;

  const set = (field: Field) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const save = async (): Promise<boolean> => {
    const trimmed = Object.fromEntries(
      (Object.keys(form) as Field[]).map((field) => [
        field,
        form[field].trim(),
      ]),
    ) as ResolvedRirekishoProfile;
    try {
      await updateSettings.mutateAsync({ rirekishoProfile: trimmed });
      setForm(trimmed);
      setInitial(trimmed);
      toast.success(t("rirekisho.toasts.saved"));
      return true;
    } catch (error) {
      showErrorToast(error, t("rirekisho.toasts.saveFailed"));
      return false;
    }
  };

  const download = async () => {
    if (dirty && !(await save())) return;
    setDownloading(true);
    try {
      await downloadDesignRirekishoPdf();
    } catch (error) {
      showErrorToast(error, t("rirekisho.toasts.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const input = (field: Field, type?: "date" | "tel" | "email") => (
    <div className="space-y-1.5" key={field}>
      <Label htmlFor={`rirekisho-${field}`} className="text-xs">
        {t(`rirekisho.fields.${field}`)}
      </Label>
      <Input
        id={`rirekisho-${field}`}
        type={type ?? "text"}
        value={form[field]}
        onChange={(event) => set(field)(event.target.value)}
      />
    </div>
  );

  const textarea = (field: Field, rows: number, hint?: string) => (
    <div className="space-y-1.5" key={field}>
      <Label htmlFor={`rirekisho-${field}`} className="text-xs">
        {t(`rirekisho.fields.${field}`)}
      </Label>
      <Textarea
        id={`rirekisho-${field}`}
        value={form[field]}
        rows={rows}
        onChange={(event) => set(field)(event.target.value)}
      />
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("rirekisho.title")}</DialogTitle>
          <DialogDescription>{t("rirekisho.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {TEXT_FIELDS.map(({ field, type }) => input(field, type))}
          </div>
          <p className="-mt-2 text-[11px] text-muted-foreground">
            {t("rirekisho.hints.gender")}
          </p>

          <div className="space-y-3">
            {textarea("address", 2)}
            {input("addressFurigana")}
          </div>

          <fieldset className="space-y-3 rounded-md border border-border/60 p-3">
            <legend className="px-1 text-xs font-medium">
              {t("rirekisho.contactHeading")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {input("contactPostalCode")}
              {input("contactPhone", "tel")}
            </div>
            {textarea("contactAddress", 2)}
            <div className="grid gap-3 sm:grid-cols-2">
              {input("contactAddressFurigana")}
              {input("contactEmail", "email")}
            </div>
          </fieldset>

          {textarea("motivation", 6, t("rirekisho.hints.motivation"))}
          {textarea("wishes", 3, t("rirekisho.hints.wishes"))}

          <p className="text-[11px] text-muted-foreground">
            {t("rirekisho.hints.fromResume")}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void download()}
            disabled={saving || downloading}
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {downloading ? t("rirekisho.downloading") : t("rirekisho.download")}
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? t("rirekisho.saving") : t("rirekisho.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
