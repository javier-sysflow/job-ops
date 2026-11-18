export const JOBOPS_APP_MODE_VALUES = ["local", "hosted"] as const;

export type JobOpsAppMode = (typeof JOBOPS_APP_MODE_VALUES)[number];

export interface JobOpsAppCapabilities {
  hostedSignups: boolean;
  /** Local mode: anyone can create their own private-workspace account. */
  localSignups: boolean;
  /** Self-signup (hosted or local) asks for the operator's invite code. */
  signupInviteCodeRequired: boolean;
  platformLlm: boolean;
  quotas: boolean;
  userEditableLlmSettings: boolean;
}

export interface JobOpsAppStatusResponse {
  appMode: JobOpsAppMode;
  capabilities: JobOpsAppCapabilities;
  hostedTenantConfigured: boolean;
}
