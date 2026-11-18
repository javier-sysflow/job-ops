import * as clientApi from "@client/api";
import { formatDate, isJapaneseUi } from "@client/i18n/format";
import type { SsoIdentitySummary, SsoProviderInfo } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { showErrorToast } from "@/client/lib/error-toast";
import { queryKeys } from "@/client/lib/queryKeys";
import { rememberPendingSsoFlow } from "@/client/lib/sso-flow";
import { SSO_PROVIDER_ICONS } from "@/client/lib/sso-providers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ConnectedAccountsApi = {
  changeOwnPassword: typeof clientApi.changeOwnPassword;
  getCurrentAuthUser: typeof clientApi.getCurrentAuthUser;
  getSsoProviders: typeof clientApi.getSsoProviders;
  listSsoIdentities: typeof clientApi.listSsoIdentities;
  startSsoLink: typeof clientApi.startSsoLink;
  unlinkSsoIdentity: typeof clientApi.unlinkSsoIdentity;
};

type ConnectedAccountsSectionProps = {
  api?: ConnectedAccountsApi;
};

const MIN_PASSWORD_LENGTH = 8;

const defaultConnectedAccountsApi: ConnectedAccountsApi = {
  changeOwnPassword: clientApi.changeOwnPassword,
  getCurrentAuthUser: clientApi.getCurrentAuthUser,
  getSsoProviders: clientApi.getSsoProviders,
  listSsoIdentities: clientApi.listSsoIdentities,
  startSsoLink: clientApi.startSsoLink,
  unlinkSsoIdentity: clientApi.unlinkSsoIdentity,
};

function formatConnectedAt(createdAt: string): string {
  const connectedAt = new Date(createdAt);
  if (Number.isNaN(connectedAt.getTime())) return createdAt;
  return isJapaneseUi()
    ? formatDate(connectedAt)
    : connectedAt.toLocaleDateString();
}

export const ConnectedAccountsSection: React.FC<
  ConnectedAccountsSectionProps
> = ({ api = defaultConnectedAccountsApi }) => {
  const { t } = useTranslation(["settings", "common"]);
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: api.getCurrentAuthUser,
    retry: false,
  });
  // Neither query renders an error: the providers list is public and comes back
  // empty on an unconfigured instance, while a 401 from the identities query is
  // handled as a lost session by the API client (it clears the token and returns
  // to sign-in), exactly like the `/auth/me` query above.
  const providersQuery = useQuery({
    queryKey: queryKeys.auth.ssoProviders(),
    queryFn: api.getSsoProviders,
    retry: false,
  });
  const identitiesQuery = useQuery({
    queryKey: queryKeys.auth.ssoIdentities(),
    queryFn: api.listSsoIdentities,
    retry: false,
  });

  const unlinkMutation = useMutation({
    mutationFn: (identity: SsoIdentitySummary) =>
      api.unlinkSsoIdentity(identity.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.ssoIdentities(),
      });
      toast.success(t("connected.removed"));
    },
    onError: (error) => {
      showErrorToast(error, t("connected.removeFailed"));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: api.changeOwnPassword,
    onSuccess: async () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.currentUser(),
      });
      toast.success(t("connected.passwordUpdated"));
    },
    onError: (error) => {
      showErrorToast(error, t("connected.passwordUpdateFailed"));
    },
  });

  const hasPassword = meQuery.data?.hasPassword ?? true;
  const providers = providersQuery.data ?? [];
  const identities = identitiesQuery.data ?? [];
  const linkedProviders = new Set(
    identities.map((identity) => identity.provider),
  );
  const connectableProviders = providers.filter(
    (provider) => !linkedProviders.has(provider.id),
  );

  const handleConnect = async (provider: SsoProviderInfo) => {
    try {
      const start = await api.startSsoLink(provider.id);
      rememberPendingSsoFlow({
        provider: start.provider,
        state: start.state,
        flowToken: start.flowToken,
        mode: "link",
        next: null,
      });
      window.location.assign(start.authorizationUrl);
    } catch (error) {
      showErrorToast(
        error,
        t("connected.connectFailed", { provider: provider.displayName }),
      );
    }
  };

  const handleChangePassword = () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        t("connected.passwordTooShort", { min: MIN_PASSWORD_LENGTH }),
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("connected.passwordMismatch"));
      return;
    }

    setPasswordError(null);
    changePasswordMutation.mutate(
      hasPassword
        ? { password: newPassword, currentPassword }
        : { password: newPassword },
    );
  };

  return (
    <div className="space-y-6">
      {providers.length > 0 || identities.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold">{t("connected.title")}</div>
            <p className="text-sm text-muted-foreground">
              {t("connected.intro")}
            </p>
          </div>

          {identities.length > 0 ? (
            <div className="divide-y divide-border rounded-md border border-border">
              {identities.map((identity) => {
                const displayName =
                  providers.find(
                    (provider) => provider.id === identity.provider,
                  )?.displayName ?? identity.provider;
                return (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                    key={identity.id}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {displayName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("connected.identityMeta", {
                          account:
                            identity.email ??
                            identity.displayName ??
                            t("connected.noEmail"),
                          date: formatConnectedAt(identity.createdAt),
                        })}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={unlinkMutation.isPending}
                        >
                          {t("connected.unlink")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("connected.unlinkTitle", {
                              provider: displayName,
                            })}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("connected.unlinkDescription", {
                              provider: displayName,
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("common:actions.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => unlinkMutation.mutate(identity)}
                          >
                            {t("connected.unlinkConfirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("connected.none")}
            </p>
          )}

          {connectableProviders.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {connectableProviders.map((provider) => {
                const ProviderIcon = SSO_PROVIDER_ICONS[provider.id];
                return (
                  <Button
                    key={provider.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleConnect(provider)}
                  >
                    <ProviderIcon className="mr-2 h-4 w-4" />
                    {t("connected.connect", {
                      provider: provider.displayName,
                    })}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold">
            {t("connected.passwordTitle")}
          </div>
          {hasPassword ? null : (
            <p className="text-sm text-muted-foreground">
              {t("connected.noPassword")}
            </p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {hasPassword ? (
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                htmlFor="account-current-password"
              >
                {t("connected.currentPassword")}
              </label>
              <Input
                id="account-current-password"
                type="password"
                autoComplete="current-password"
                placeholder={t("connected.currentPasswordPlaceholder")}
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.currentTarget.value)
                }
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              htmlFor="account-new-password"
            >
              {t("connected.newPassword")}
            </label>
            <Input
              id="account-new-password"
              type="password"
              autoComplete="new-password"
              placeholder={t("connected.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              htmlFor="account-confirm-password"
            >
              {t("connected.confirmPassword")}
            </label>
            <Input
              id="account-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder={t("connected.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.currentTarget.value)
              }
            />
          </div>
        </div>

        {passwordError ? (
          <p className="text-sm text-destructive" role="alert">
            {passwordError}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={handleChangePassword}
          disabled={changePasswordMutation.isPending}
        >
          {hasPassword
            ? t("connected.changePassword")
            : t("connected.setPassword")}
        </Button>
      </div>
    </div>
  );
};
