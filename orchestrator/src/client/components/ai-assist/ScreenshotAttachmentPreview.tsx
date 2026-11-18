import type { JobChatImageAttachment } from "@shared/types";
import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ScreenshotAttachmentPreviewProps = {
  attachments: JobChatImageAttachment[];
  onRemove?: (attachment: JobChatImageAttachment) => void;
};

export const ScreenshotAttachmentPreview: React.FC<
  ScreenshotAttachmentPreviewProps
> = ({ attachments, onRemove }) => {
  const { t } = useTranslation("jobDetail");
  const [previewAttachment, setPreviewAttachment] =
    useState<JobChatImageAttachment | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <div
            key={attachment.id ?? `${attachment.name}-${index}`}
            className="group relative h-14 w-20 overflow-hidden rounded-md border bg-muted"
          >
            <button
              type="button"
              className="block h-full w-full text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setPreviewAttachment(attachment)}
              aria-label={t("aiAssist.screenshot.previewLabel", {
                name: attachment.name,
              })}
              title={t("aiAssist.screenshot.preview")}
            >
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="h-full w-full object-cover"
              />
            </button>
            {onRemove && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label={t("aiAssist.screenshot.removeLabel", {
                  name: attachment.name,
                })}
                title={t("aiAssist.screenshot.remove")}
                className="absolute right-1 top-1 h-6 w-6 opacity-95"
                onClick={() => {
                  onRemove(attachment);
                  setPreviewAttachment((current) =>
                    current?.id === attachment.id ? null : current,
                  );
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Dialog
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      >
        <DialogContent className="max-w-5xl p-4">
          <DialogHeader className="pr-8">
            <DialogTitle className="truncate text-base">
              {previewAttachment?.name ??
                t("aiAssist.screenshot.fallbackTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("aiAssist.screenshot.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          {previewAttachment && (
            <div className="max-h-[75vh] overflow-auto rounded-md border bg-muted/30">
              <img
                src={previewAttachment.dataUrl}
                alt={previewAttachment.name}
                className="mx-auto h-auto max-h-[75vh] max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
