import { ExternalLink } from "lucide-react";
import type React from "react";
import { Trans, useTranslation } from "react-i18next";

const AUTH_DOC = "https://code.claude.com/docs/en/authentication";

/**
 * Explains how to authenticate the Claude Code CLI (subscription token or API
 * key), which JobOps uses when LLM_PROVIDER is `claude_cli`.
 */
export const ClaudeCliSetupHint: React.FC = () => {
  const { t } = useTranslation("settings");
  const code = <code className="rounded bg-muted px-1 py-0.5" />;
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">
        {t("cliHints.claude.title")}
      </p>
      <p className="mt-2">
        <Trans
          t={t}
          i18nKey="cliHints.claude.setup"
          components={{
            npm: (
              // biome-ignore lint/a11y/useAnchorContent: Trans injects the link text.
              <a
                className="text-foreground underline decoration-border underline-offset-4"
                href="https://www.npmjs.com/package/@anthropic-ai/claude-code"
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
        <Trans t={t} i18nKey="cliHints.claude.docker" components={{ code }} />
      </p>
    </div>
  );
};
