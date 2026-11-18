import { getDesignResumeAssetContentBlob } from "@client/api/settings-profile";
import { createId } from "@paralleldrive/cuid2";
import type { DesignResumeJson } from "@shared/types";
import { FileImage, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DesignResumeFieldAssistant } from "./DesignResumeFieldAssistant";
import { RichTextEditor } from "./RichTextEditor";
import { fieldId, getByPath, toBoolean, toNumber, toText } from "./utils";

const labelClassName =
  "text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground";
const fieldClassName = "bg-background/60";
const insetPanelClassName =
  "rounded-lg border border-border/60 bg-background/60";
const subtlePanelClassName =
  "rounded-lg border border-border/60 bg-muted/20 px-4 py-3";

function normalizeColorValue(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return "#000000";
}

type ColorFieldProps = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function ColorField({
  id,
  label,
  value,
  disabled = false,
  onChange,
}: ColorFieldProps) {
  const pickerValue = normalizeColorValue(value);

  return (
    <div className="grid gap-2">
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-border/60 bg-background/60 p-1"
          aria-label={label}
          disabled={disabled}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className={fieldClassName}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

type PictureSectionProps = {
  picture: Record<string, unknown>;
  pictureUploading: boolean;
  pictureEnabled: boolean;
  pictureDisabledReason?: string | null;
  onUploadPicture: () => void;
  onDeletePicture: () => void;
  onUpdatePicture: (key: string, value: unknown) => void;
};

export function PictureSection({
  picture,
  pictureUploading,
  pictureEnabled,
  pictureDisabledReason,
  onUploadPicture,
  onDeletePicture,
  onUpdatePicture,
}: PictureSectionProps) {
  const { t } = useTranslation(["resumeStudio", "common"]);
  const editDisabled = !pictureEnabled;
  const pictureUrl = toText(picture.url);
  const [previewUrl, setPreviewUrl] = useState(pictureUrl);

  useEffect(() => {
    if (!pictureUrl) {
      setPreviewUrl("");
      return;
    }

    if (!pictureUrl.startsWith("/api/design-resume/assets/")) {
      setPreviewUrl(pictureUrl);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    getDesignResumeAssetContentBlob(pictureUrl)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(pictureUrl);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pictureUrl]);

  return (
    <div className="grid gap-3">
      {!pictureEnabled ? (
        <Alert>
          <AlertDescription>
            {pictureDisabledReason ?? t("picture.disabledReason")}
          </AlertDescription>
        </Alert>
      ) : null}

      {picture.url ? (
        <div
          className={`${insetPanelClassName} flex items-center gap-3 border-dashed p-3`}
        >
          <img
            src={previewUrl}
            alt={t("picture.alt")}
            className="h-16 w-16 rounded-lg border border-border/60 object-cover"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onUploadPicture}
              disabled={pictureUploading || editDisabled}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              {t("picture.replace")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              onClick={onDeletePicture}
              disabled={pictureUploading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("common:actions.delete")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="justify-start border-dashed"
          onClick={onUploadPicture}
          disabled={pictureUploading || editDisabled}
        >
          <FileImage className="mr-2 h-4 w-4" />
          {pictureUploading ? t("picture.uploading") : t("picture.upload")}
        </Button>
      )}

      <div className="grid gap-2">
        <label className={labelClassName} htmlFor={fieldId("picture", "url")}>
          {t("picture.imageUrl")}
        </label>
        <Input
          id={fieldId("picture", "url")}
          value={toText(picture.url)}
          onChange={(event) =>
            onUpdatePicture("url", event.currentTarget.value)
          }
          className={fieldClassName}
          disabled={editDisabled}
        />
      </div>

      <div
        className={`${subtlePanelClassName} flex items-center justify-between`}
      >
        <div>
          <div className="text-sm font-medium text-foreground">
            {t("picture.show")}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("picture.showDescription")}
          </div>
        </div>
        <Switch
          checked={!toBoolean(picture.hidden, false)}
          onCheckedChange={(checked) => onUpdatePicture("hidden", !checked)}
          disabled={editDisabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["size", "picture.size"],
            ["rotation", "picture.rotation"],
            ["aspectRatio", "picture.aspectRatio"],
            ["borderRadius", "picture.borderRadius"],
            ["borderWidth", "picture.borderWidth"],
            ["shadowWidth", "picture.shadowWidth"],
          ] as const
        ).map(([key, labelKey]) => (
          <div key={key} className="grid gap-2">
            <label className={labelClassName} htmlFor={fieldId("picture", key)}>
              {t(labelKey)}
            </label>
            <Input
              id={fieldId("picture", key)}
              type="number"
              value={String(toNumber(picture[key], 0))}
              onChange={(event) =>
                onUpdatePicture(key, Number(event.currentTarget.value || 0))
              }
              className={fieldClassName}
              disabled={editDisabled}
            />
          </div>
        ))}
        {(
          [
            ["borderColor", "picture.borderColor"],
            ["shadowColor", "picture.shadowColor"],
          ] as const
        ).map(([key, labelKey]) => (
          <ColorField
            key={key}
            id={fieldId("picture", key)}
            label={t(labelKey)}
            value={toText(picture[key])}
            disabled={editDisabled}
            onChange={(nextValue) => onUpdatePicture(key, nextValue)}
          />
        ))}
      </div>
    </div>
  );
}

type BasicsSectionProps = {
  resumeJson: DesignResumeJson;
  basics: Record<string, unknown>;
  onUpdateBasics: (path: string, value: unknown) => void;
};

// `label` is the English field name sent to the AI assistant;
// `labelKey` is the translated label shown in the UI.
const BASICS_FIELDS = [
  { path: "name", label: "Name", labelKey: "basics.name", ai: false },
  {
    path: "headline",
    label: "Headline",
    labelKey: "basics.headline",
    ai: true,
  },
  { path: "email", label: "Email", labelKey: "basics.email", ai: false },
  { path: "phone", label: "Phone", labelKey: "basics.phone", ai: false },
  {
    path: "location",
    label: "Location",
    labelKey: "basics.location",
    ai: false,
  },
  {
    path: "website.url",
    label: "Website",
    labelKey: "basics.website",
    ai: false,
  },
] as const;

export function BasicsSection({
  resumeJson,
  basics,
  onUpdateBasics,
}: BasicsSectionProps) {
  const { t } = useTranslation("resumeStudio");
  return (
    <div className="grid gap-3">
      {BASICS_FIELDS.map(({ path, label, labelKey, ai }) => (
        <div key={path} className="grid gap-2">
          <label className={labelClassName} htmlFor={fieldId("basics", path)}>
            {t(labelKey)}
          </label>
          <div className="relative">
            <Input
              id={fieldId("basics", path)}
              value={toText(getByPath(basics, path))}
              onChange={(event) =>
                onUpdateBasics(path, event.currentTarget.value)
              }
              className={cn(fieldClassName, ai && "pr-11")}
            />
            {ai ? (
              <div className="-translate-y-1/2 absolute right-1.5 top-1/2">
                <DesignResumeFieldAssistant
                  resumeJson={resumeJson}
                  fieldPath={`basics.${path}`}
                  label={label}
                  displayLabel={t(labelKey)}
                  value={toText(getByPath(basics, path))}
                  valueType="plain_text"
                  section="Basics"
                  onApply={(next) => onUpdateBasics(path, next)}
                  triggerClassName="bg-background/80 hover:bg-accent"
                />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

type BasicsCustomFieldsSectionProps = {
  title: string;
  customFields: Record<string, unknown>[];
  onUpdateTitle: (title: string) => void;
  onChange: (nextFields: Record<string, unknown>[]) => void;
};

export function BasicsCustomFieldsSection({
  title,
  customFields,
  onUpdateTitle,
  onChange,
}: BasicsCustomFieldsSectionProps) {
  const { t } = useTranslation(["resumeStudio", "common"]);
  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= customFields.length) return;
    const nextFields = [...customFields];
    const [item] = nextFields.splice(index, 1);
    nextFields.splice(target, 0, item);
    onChange(nextFields);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <label
          className={labelClassName}
          htmlFor={fieldId("custom-fields", "title")}
        >
          {t("customFields.sectionTitle")}
        </label>
        <Input
          id={fieldId("custom-fields", "title")}
          value={title}
          onChange={(event) => onUpdateTitle(event.currentTarget.value)}
          className={fieldClassName}
        />
      </div>
      {customFields.map((field, index) => (
        <div
          key={toText(field.id, `field-${index}`)}
          className={`${insetPanelClassName} p-3`}
        >
          <div className="grid gap-3">
            {(
              [
                ["title", "customFields.title"],
                ["icon", "customFields.icon"],
                ["text", "customFields.value"],
                ["link", "customFields.link"],
              ] as const
            ).map(([key, labelKey]) => (
              <div key={key} className="grid gap-2">
                <label
                  className={labelClassName}
                  htmlFor={fieldId("custom-field", String(index), key)}
                >
                  {t(labelKey)}
                </label>
                <Input
                  id={fieldId("custom-field", String(index), key)}
                  value={toText(field[key])}
                  onChange={(event) => {
                    const nextFields = [...customFields];
                    nextFields[index] = {
                      ...nextFields[index],
                      [key]: event.currentTarget.value,
                    };
                    onChange(nextFields);
                  }}
                  className={fieldClassName}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => moveField(index, -1)}
            >
              {t("customFields.up")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => moveField(index, 1)}
            >
              {t("customFields.down")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              onClick={() =>
                onChange(
                  customFields.filter(
                    (_, currentIndex) => currentIndex !== index,
                  ),
                )
              }
            >
              {t("common:actions.remove")}
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() =>
          onChange([
            ...customFields,
            {
              id: createId(),
              title: "",
              icon: "",
              text: "",
              link: "",
            },
          ])
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("customFields.add")}
      </Button>
    </div>
  );
}

type SummarySectionProps = {
  resumeJson: DesignResumeJson;
  summary: Record<string, unknown>;
  onUpdateSummary: (key: string, value: unknown) => void;
};

export function SummarySection({
  resumeJson,
  summary,
  onUpdateSummary,
}: SummarySectionProps) {
  const { t } = useTranslation(["resumeStudio", "common"]);
  return (
    <div className="space-y-3">
      <div
        className={`${subtlePanelClassName} flex items-center justify-between`}
      >
        <div>
          <div className="text-sm font-medium text-foreground">
            {t("summary.show")}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("summary.showDescription")}
          </div>
        </div>
        <Switch
          checked={!toBoolean(summary.hidden, false)}
          onCheckedChange={(checked) => onUpdateSummary("hidden", !checked)}
        />
      </div>
      <div className="grid gap-2">
        <RichTextEditor
          value={toText(summary.content)}
          onChange={(next) => onUpdateSummary("content", next)}
          placeholder={t("summary.placeholder")}
          toolbarEnd={
            <DesignResumeFieldAssistant
              resumeJson={resumeJson}
              fieldPath="summary.content"
              label="Summary" // i18n-ignore: English field name for the AI
              displayLabel={t("summary.label")}
              value={toText(summary.content)}
              valueType="html"
              section="Summary"
              onApply={(next) => onUpdateSummary("content", next)}
              triggerClassName="bg-background/80 hover:bg-accent"
            />
          }
        />
      </div>
    </div>
  );
}
