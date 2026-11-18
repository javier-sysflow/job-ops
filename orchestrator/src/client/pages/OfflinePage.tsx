import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { WifiOff } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function OfflinePage() {
  const { t } = useTranslation("shell");
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => {
      navigate("/", { replace: true });
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-10 shadow-sm sm:p-12">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
            <WifiOff className="h-12 w-12" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              {t("offline.title")}
            </h1>
            <p className="max-w-prose text-sm leading-6 text-muted-foreground">
              {t("offline.checkConnection")}
            </p>
            <p className="max-w-prose text-sm leading-6 text-muted-foreground">
              {t("offline.autoRedirect")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            {t("offline.tryAgain")}
          </Button>
        </div>
      </section>
    </main>
  );
}
