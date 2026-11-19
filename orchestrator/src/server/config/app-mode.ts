import type {
  JobOpsAppCapabilities,
  JobOpsAppMode,
  JobOpsAppStatusResponse,
} from "@shared/types";

const APP_MODE_ENV_KEY = "JOBOPS_APP_MODE";
const LEGACY_APP_MODE_ENV_KEY = "JOBOPS_MODE";
const HOSTED_TENANT_ID_ENV_KEY = "JOBOPS_HOSTED_TENANT_ID";
const HOSTED_SIGNUPS_ENV_KEY = "JOBOPS_HOSTED_SIGNUPS_ENABLED";
const LOCAL_SIGNUPS_ENV_KEY = "JOBOPS_LOCAL_SIGNUPS_ENABLED";
const SIGNUP_INVITE_CODE_ENV_KEY = "JOBOPS_SIGNUP_INVITE_CODE";
const HOSTED_PLATFORM_LLM_ENV_KEY = "JOBOPS_HOSTED_PLATFORM_LLM_ENABLED";
const HOSTED_QUOTAS_ENV_KEY = "JOBOPS_HOSTED_QUOTAS_ENABLED";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off", ""]);

type EnvSource = Pick<NodeJS.ProcessEnv, string>;

export type JobOpsAppConfig = JobOpsAppStatusResponse & {
  hostedTenantId: string | null;
  /** Never sent to the client; only `signupInviteCodeRequired` is. */
  signupInviteCode: string | null;
};

function readTrimmedEnv(env: EnvSource, key: string): string {
  return env[key]?.trim() ?? "";
}

function parseAppMode(env: EnvSource): JobOpsAppMode {
  const rawMode = (
    readTrimmedEnv(env, APP_MODE_ENV_KEY) ||
    readTrimmedEnv(env, LEGACY_APP_MODE_ENV_KEY)
  ).toLowerCase();
  if (!rawMode) return "local";
  if (rawMode === "local" || rawMode === "hosted") return rawMode;
  throw new Error(
    `${APP_MODE_ENV_KEY} must be "local" or "hosted" when configured.`,
  );
}

function parseBooleanFlag(env: EnvSource, key: string): boolean {
  const normalized = readTrimmedEnv(env, key).toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  throw new Error(
    `${key} must be a boolean flag: true/false, 1/0, yes/no, or on/off.`,
  );
}

function buildCapabilities(args: {
  appMode: JobOpsAppMode;
  hostedSignupsEnabled: boolean;
  localSignupsEnabled: boolean;
  signupInviteCodeConfigured: boolean;
  hostedPlatformLlmEnabled: boolean;
  hostedQuotasEnabled: boolean;
  llmEnvConfigured: boolean;
}): JobOpsAppCapabilities {
  const hostedMode = args.appMode === "hosted";
  const platformLlm = hostedMode && args.hostedPlatformLlmEnabled;
  const hostedSignups = hostedMode && args.hostedSignupsEnabled;
  const localSignups = !hostedMode && args.localSignupsEnabled;

  return {
    hostedSignups,
    localSignups,
    signupInviteCodeRequired:
      (hostedSignups || localSignups) && args.signupInviteCodeConfigured,
    platformLlm,
    quotas: hostedMode && args.hostedQuotasEnabled,
    userEditableLlmSettings: !platformLlm,
    llmPreconfigured: !hostedMode && args.llmEnvConfigured,
  };
}

export function getJobOpsAppConfig(
  env: EnvSource = process.env,
): JobOpsAppConfig {
  const appMode = parseAppMode(env);
  const hostedTenantId = readTrimmedEnv(env, HOSTED_TENANT_ID_ENV_KEY) || null;

  if (appMode === "hosted" && !hostedTenantId) {
    throw new Error(
      `${HOSTED_TENANT_ID_ENV_KEY} is required when ${APP_MODE_ENV_KEY}=hosted.`,
    );
  }

  const signupInviteCode =
    readTrimmedEnv(env, SIGNUP_INVITE_CODE_ENV_KEY) || null;

  const capabilities = buildCapabilities({
    appMode,
    hostedSignupsEnabled: parseBooleanFlag(env, HOSTED_SIGNUPS_ENV_KEY),
    localSignupsEnabled: parseBooleanFlag(env, LOCAL_SIGNUPS_ENV_KEY),
    signupInviteCodeConfigured: signupInviteCode !== null,
    hostedPlatformLlmEnabled: parseBooleanFlag(
      env,
      HOSTED_PLATFORM_LLM_ENV_KEY,
    ),
    hostedQuotasEnabled: parseBooleanFlag(env, HOSTED_QUOTAS_ENV_KEY),
    // Same check onboarding uses (isServerLlmPreconfigured).
    llmEnvConfigured: Boolean(
      readTrimmedEnv(env, "LLM_PROVIDER") && readTrimmedEnv(env, "LLM_API_KEY"),
    ),
  });

  return {
    appMode,
    capabilities,
    hostedTenantConfigured: appMode === "hosted" && Boolean(hostedTenantId),
    hostedTenantId: appMode === "hosted" ? hostedTenantId : null,
    signupInviteCode,
  };
}

export function getJobOpsAppStatus(
  env: EnvSource = process.env,
): JobOpsAppStatusResponse {
  const { appMode, capabilities, hostedTenantConfigured } =
    getJobOpsAppConfig(env);
  return { appMode, capabilities, hostedTenantConfigured };
}
