import { extractPdfJobDescription } from "@client/lib/pdf-job-description";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface Props {
  disabled: boolean;
  onText: (text: string) => void;
  onBusy: (busy: boolean) => void;
}

export function PdfJobDescriptionInput({ disabled, onText, onBusy }: Props) {
  const { t } = useTranslation("jobDetail");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <label htmlFor="pdf-job-description" className="text-sm font-medium">
        {t("pdfInput.label")}
      </label>
      <Input
        id="pdf-job-description"
        type="file"
        accept=".pdf,application/pdf"
        disabled={disabled || busy}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const current = ++generation.current;
          setBusy(true);
          onBusy(true);
          setMessage(t("pdfInput.reading"));
          try {
            const text = await extractPdfJobDescription(file);
            if (current !== generation.current) return;
            onText(text);
            setMessage(t("pdfInput.loaded"));
          } catch (error) {
            if (current !== generation.current) return;
            setMessage(
              error instanceof Error ? error.message : t("pdfInput.readFailed"),
            );
          } finally {
            if (current === generation.current) {
              setBusy(false);
              onBusy(false);
            }
          }
        }}
      />
      <p className="text-xs text-muted-foreground">{t("pdfInput.help")}</p>
      {message && (
        <output className="block text-xs text-muted-foreground">
          {message}
        </output>
      )}
    </div>
  );
}
