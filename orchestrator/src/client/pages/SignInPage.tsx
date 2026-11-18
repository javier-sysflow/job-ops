import {
  getAppStatus,
  getAuthBootstrapStatus,
  getSsoProviders,
  hasAuthenticatedSession,
  restoreAuthSessionFromLegacyCredentials,
  signInWithCredentials,
  signupWithCredentials,
  startSsoLogin,
} from "@client/api";
import type { SsoProviderInfo } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageToggle } from "../components/LanguageToggle";
import i18n from "../i18n";
import { resolveNextPath } from "../lib/auth-navigation";
import { getErrorMessage } from "../lib/error-format";
import { queryKeys } from "../lib/queryKeys";
import {
  loadRememberedAuthUsers,
  rememberAuthUser,
} from "../lib/remembered-auth-users";
import { rememberPendingSsoFlow } from "../lib/sso-flow";
import { SSO_PROVIDER_ICONS } from "../lib/sso-providers";

type AuthMode = "sign-in" | "signup";

export function SignInPage() {
  const { t } = useTranslation("shell");
  const location = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [hostedSignupEnabled, setHostedSignupEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberedUsers, setRememberedUsers] = useState(() =>
    loadRememberedAuthUsers(),
  );
  const ssoProvidersQuery = useQuery({
    queryKey: queryKeys.auth.ssoProviders(),
    queryFn: getSsoProviders,
    retry: false,
  });
  const ssoProviders = ssoProvidersQuery.data ?? [];

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return resolveNextPath(params.get("next"));
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rememberedUsername = params.get("user")?.trim();
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setPassword("");
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const appStatus = await getAppStatus();
        if (cancelled) return;
        const canSignup =
          appStatus.appMode === "hosted" &&
          appStatus.capabilities.hostedSignups;
        setHostedSignupEnabled(canSignup);

        const bootstrap = await getAuthBootstrapStatus();
        if (cancelled) return;
        if (bootstrap.setupRequired) {
          navigate("/onboarding", { replace: true });
          return;
        }

        const restored = await restoreAuthSessionFromLegacyCredentials();
        if (cancelled) return;
        if (restored || hasAuthenticatedSession()) {
          navigate(nextPath, { replace: true });
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            getErrorMessage(error, i18n.t("shell:signIn.loadStatusFailed")),
          );
        }
      } finally {
        if (!cancelled) {
          setIsBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, nextPath]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) {
      setErrorMessage(t("signIn.missingCredentials"));
      return;
    }
    if (authMode === "signup" && password.length < 8) {
      setErrorMessage(t("signIn.passwordTooShort"));
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      if (authMode === "signup") {
        const user = await signupWithCredentials({
          username: normalizedUsername,
          password,
          displayName: displayName.trim() || normalizedUsername,
        });
        setRememberedUsers(
          rememberAuthUser({
            username: user.username,
            displayName: user.displayName,
          }),
        );
      } else {
        await signInWithCredentials(normalizedUsername, password);
        setRememberedUsers(
          rememberAuthUser({
            username: normalizedUsername,
          }),
        );
      }
      navigate(nextPath, { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("signIn.signInFailed")));
      setIsBusy(false);
    }
  };

  const handleSsoSignIn = async (provider: SsoProviderInfo) => {
    setIsBusy(true);
    setErrorMessage(null);

    try {
      const start = await startSsoLogin(provider.id);
      rememberPendingSsoFlow({
        provider: start.provider,
        state: start.state,
        flowToken: start.flowToken,
        mode: "login",
        next: nextPath,
      });
      window.location.assign(start.authorizationUrl);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          t("signIn.ssoFailed", { provider: provider.displayName }),
        ),
      );
      setIsBusy(false);
    }
  };

  const resetFormFeedback = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    setErrorMessage(null);
    setPassword("");
  };

  const title =
    authMode === "signup" ? t("signIn.createAccount") : t("signIn.signIn");
  const description =
    authMode === "signup"
      ? t("signIn.signupDescription")
      : t("signIn.signInDescription");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.08),_transparent_45%),linear-gradient(180deg,_rgba(15,23,42,0.02),_transparent_30%)] px-4 py-16">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6">
        <img
          src="/favicon.png"
          alt=""
          className="size-11 self-center rounded-xl shadow-md"
        />
        <Card className="w-full border-border bg-card shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {hostedSignupEnabled ? (
              <Tabs
                value={authMode}
                onValueChange={(value) => resetFormFeedback(value as AuthMode)}
                className="mb-5"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="sign-in"
                    onClick={() => resetFormFeedback("sign-in")}
                  >
                    {t("signIn.signIn")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    onClick={() => resetFormFeedback("signup")}
                  >
                    {t("signIn.createAccount")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}
            {authMode === "sign-in" && rememberedUsers.length > 0 ? (
              <div className="mb-5 space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("signIn.rememberedUsers")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rememberedUsers.map((user) => (
                    <Button
                      key={user.username}
                      type="button"
                      variant={
                        username.trim() === user.username
                          ? "secondary"
                          : "outline"
                      }
                      size="sm"
                      className="h-8 max-w-full px-2.5"
                      disabled={isBusy}
                      onClick={() => {
                        setUsername(user.username);
                        setPassword("");
                        setErrorMessage(null);
                      }}
                    >
                      <span className="truncate">
                        {user.displayName ?? user.username}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {authMode === "signup" ? (
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="auth-display-name"
                  >
                    {t("signIn.nameLabel")}
                  </label>
                  <Input
                    id="auth-display-name"
                    autoComplete="name"
                    value={displayName}
                    onChange={(event) =>
                      setDisplayName(event.currentTarget.value)
                    }
                    placeholder={t("signIn.namePlaceholder")}
                    disabled={isBusy}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="auth-username">
                  {t("signIn.usernameLabel")}
                </label>
                <Input
                  id="auth-username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.currentTarget.value)}
                  placeholder={t("signIn.usernamePlaceholder")}
                  disabled={isBusy}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="auth-password">
                  {t("signIn.passwordLabel")}
                </label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    authMode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  placeholder={t("signIn.passwordPlaceholder")}
                  disabled={isBusy}
                />
              </div>
              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button className="w-full" type="submit" disabled={isBusy}>
                {isBusy
                  ? authMode === "signup"
                    ? t("signIn.creatingAccount")
                    : t("signIn.signingIn")
                  : authMode === "signup"
                    ? t("signIn.createAccount")
                    : t("signIn.signIn")}
              </Button>
            </form>
            {ssoProviders.length > 0 ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("signIn.orContinueWith")}
                  </span>
                  <Separator className="flex-1" />
                </div>
                {ssoProviders.map((provider) => {
                  const ProviderIcon = SSO_PROVIDER_ICONS[provider.id];
                  return (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isBusy}
                      onClick={() => void handleSsoSignIn(provider)}
                    >
                      <ProviderIcon className="mr-2 h-4 w-4" />
                      {t("signIn.continueWith", {
                        provider: provider.displayName,
                      })}
                    </Button>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
