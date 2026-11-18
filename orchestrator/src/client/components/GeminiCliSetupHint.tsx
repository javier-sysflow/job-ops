import { ExternalLink } from "lucide-react";
import type React from "react";
import { Trans, useTranslation } from "react-i18next";

const AUTH_DOC =
  "https://google-gemini.github.io/gemini-cli/docs/get-started/authentication.html";

/**
 * Explains how to authenticate the Google Gemini CLI (OAuth or API key via CLI),
 * which JobOps uses when LLM_PROVIDER is `gemini_cli`.
 */
export const GeminiCliSetupHint: React.FC = () => {
  const { t } = useTranslation("settings");
  const code = <code className="rounded bg-muted px-1 py-0.5" />;
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">
        {t("cliHints.gemini.title")}
      </p>
      <p className="mt-2">
        <Trans
          t={t}
          i18nKey="cliHints.gemini.setup"
          components={{
            npm: (
              // biome-ignore lint/a11y/useAnchorContent: Trans injects the link text.
              <a
                className="text-foreground underline decoration-border underline-offset-4"
                href="https://www.npmjs.com/package/@google/gemini-cli"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            code,
          }}
        />
      </p>
      <p className="mt-2">
        <a
          className="inline-flex items-center gap-1 text-foreground underline decoration-border underline-offset-4"
          href={AUTH_DOC}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("cliHints.authGuide")}
          <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </a>
        <Trans t={t} i18nKey="cliHints.gemini.docker" components={{ code }} />
      </p>
    </div>
  );
};
