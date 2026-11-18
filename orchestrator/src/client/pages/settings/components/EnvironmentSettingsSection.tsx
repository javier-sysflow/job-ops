import * as api from "@client/api";
import { ConnectedAccountsSection } from "@client/pages/settings/components/ConnectedAccountsSection";
import { SettingsInput } from "@client/pages/settings/components/SettingsInput";
import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import type { EnvSettingsValues } from "@client/pages/settings/types";
import { formatSecretHint } from "@client/pages/settings/utils";
import type { UpdateSettingsInput } from "@shared/settings-schema.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { showErrorToast } from "@/client/lib/error-toast";
import { queryKeys } from "@/client/lib/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type EnvironmentSettingsSectionProps = {
  values: EnvSettingsValues;
  isLoading: boolean;
  isSaving: boolean;
  layoutMode?: "accordion" | "panel";
};

const workspaceUsersQueryKey = ["workspaces", "users"] as const;

function AccountManagementSection() {
  const { t } = useTranslation(["settings", "common"]);
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [resetPasswordByUserId, setResetPasswordByUserId] = useState<
    Record<string, string>
  >({});

  const meQuery = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: api.getCurrentAuthUser,
    retry: false,
  });
  const usersQuery = useQuery({
    queryKey: workspaceUsersQueryKey,
    queryFn: api.listWorkspaceUsers,
    enabled: meQuery.data?.isSystemAdmin === true,
  });

  const createUserMutation = useMutation({
    mutationFn: api.createWorkspaceUser,
    onSuccess: async () => {
      setUsername("");
      setDisplayName("");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: workspaceUsersQueryKey });
      toast.success(t("environment.userCreated"));
    },
    onError: (error) => {
      showErrorToast(error, t("environment.userCreateFailed"));
    },
  });

  const disableUserMutation = useMutation({
    mutationFn: (input: { userId: string; isDisabled: boolean }) =>
      api.setWorkspaceUserDisabled(input.userId, input.isDisabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceUsersQueryKey });
      toast.success(t("environment.userUpdated"));
    },
    onError: (error) => {
      showErrorToast(error, t("environment.userUpdateFailed"));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (input: { userId: string; password: string }) =>
      api.resetWorkspaceUserPassword(input.userId, input.password),
    onSuccess: async (_data, variables) => {
      setResetPasswordByUserId((current) => ({
        ...current,
        [variables.userId]: "",
      }));
      toast.success(t("environment.passwordReset"));
    },
    onError: (error) => {
      showErrorToast(error, t("environment.passwordResetFailed"));
    },
  });

  if (!meQuery.data?.isSystemAdmin) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-semibold">
          {t("environment.workspace")}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("environment.signedInAs", {
            user: meQuery.data?.username ?? t("environment.aWorkspaceUser"),
          })}
        </p>
      </div>
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="text-sm font-semibold">
          {t("environment.usersTitle")}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("environment.usersIntro")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          placeholder={t("environment.namePlaceholder")}
        />
        <Input
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
          placeholder={t("environment.usernamePlaceholder")}
          autoComplete="off"
        />
        <Input
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder={t("environment.tempPasswordPlaceholder")}
          type="password"
          autoComplete="new-password"
        />
        <Button
          type="button"
          onClick={() =>
            createUserMutation.mutate({
              username,
              displayName: displayName || username,
              password,
            })
          }
          disabled={
            createUserMutation.isPending ||
            username.trim().length === 0 ||
            password.length < 8
          }
        >
          {t("environment.create")}
        </Button>
      </div>

      <div className="divide-y divide-border rounded-md border border-border">
        {users.map((user) => {
          const resetPassword = resetPasswordByUserId[user.id] ?? "";
          return (
            <div
              className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
              key={user.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {user.displayName || user.username}
                  </span>
                  <Badge variant="outline">{user.username}</Badge>
                  {user.isSystemAdmin ? (
                    <Badge variant="secondary">
                      {t("environment.systemAdmin")}
                    </Badge>
                  ) : null}
                  {user.isDisabled ? (
                    <Badge variant="destructive">{t("shared.disabled")}</Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {user.workspaceName}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={resetPassword}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setResetPasswordByUserId((current) => ({
                      ...current,
                      [user.id]: value,
                    }));
                  }}
                  placeholder={t("environment.newPasswordPlaceholder")}
                  type="password"
                  autoComplete="new-password"
                  className="h-8 w-40"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    resetPasswordMutation.isPending || resetPassword.length < 8
                  }
                  onClick={() =>
                    resetPasswordMutation.mutate({
                      userId: user.id,
                      password: resetPassword,
                    })
                  }
                >
                  {t("common:actions.reset")}
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  disableUserMutation.isPending || user.id === meQuery.data?.id
                }
                onClick={() =>
                  disableUserMutation.mutate({
                    userId: user.id,
                    isDisabled: !user.isDisabled,
                  })
                }
              >
                {user.isDisabled
                  ? t("environment.enable")
                  : t("environment.disable")}
              </Button>
            </div>
          );
        })}
        {users.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            {t("environment.noUsers")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const EnvironmentSettingsSection: React.FC<
  EnvironmentSettingsSectionProps
> = ({ values, isLoading, isSaving, layoutMode }) => {
  const { t } = useTranslation(["settings", "common"]);
  const {
    register,
    formState: { errors },
  } = useFormContext<UpdateSettingsInput>();
  const { private: privateValues } = values;

  return (
    <SettingsSectionFrame
      mode={layoutMode}
      title={t("environment.title")}
      value="environment"
    >
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t("environment.serviceAccounts")}
          </div>

          <div className="space-y-4">
            <div className="text-sm font-semibold">
              UKVisaJobs{/* i18n-ignore */}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SettingsInput
                label={t("environment.email")}
                inputProps={register("ukvisajobsEmail")}
                placeholder="you@example.com" // i18n-ignore
                disabled={isLoading || isSaving}
                error={errors.ukvisajobsEmail?.message as string | undefined}
              />
              <SettingsInput
                label={t("environment.password")}
                inputProps={register("ukvisajobsPassword")}
                type="password"
                placeholder={t("environment.passwordPlaceholder")}
                disabled={isLoading || isSaving}
                error={errors.ukvisajobsPassword?.message as string | undefined}
                current={formatSecretHint(privateValues.ukvisajobsPasswordHint)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-semibold">
              Adzuna{/* i18n-ignore */}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SettingsInput
                label={t("environment.appId")}
                inputProps={register("adzunaAppId")}
                placeholder="your-app-id" // i18n-ignore
                disabled={isLoading || isSaving}
                error={errors.adzunaAppId?.message as string | undefined}
              />
              <SettingsInput
                label={t("environment.appKey")}
                inputProps={register("adzunaAppKey")}
                type="password"
                placeholder={t("environment.appKeyPlaceholder")}
                disabled={isLoading || isSaving}
                error={errors.adzunaAppKey?.message as string | undefined}
                current={formatSecretHint(privateValues.adzunaAppKeyHint)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t("environment.security")}
          </div>
          <AccountManagementSection />
          <Separator />
          <ConnectedAccountsSection />
        </div>
      </div>
    </SettingsSectionFrame>
  );
};
