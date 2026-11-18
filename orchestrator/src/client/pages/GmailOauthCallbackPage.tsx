import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

export const GmailOauthCallbackPage: React.FC = () => {
  const { t } = useTranslation("shell");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: "gmail-oauth-result",
          code,
          state,
          error,
        },
        window.location.origin,
      );
    }

    window.close();
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold">{t("gmailCallback.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("gmailCallback.closeHint")}
        </p>
      </div>
    </main>
  );
};
