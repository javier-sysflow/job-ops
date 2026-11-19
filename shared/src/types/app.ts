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
  /**
   * Fork: local mode with the AI provider and key set through environment
   * variables (LLM_PROVIDER + LLM_API_KEY). Settings then hides the AI model
   * section for everyone, admins included; change the model in the env.
   */
  llmPreconfigured?: boolean;
}

export interface JobOpsAppStatusResponse {
  appMode: JobOpsAppMode;
  capabilities: JobOpsAppCapabilities;
  hostedTenantConfigured: boolean;
}
