import { describe, expect, it } from "vitest";
import { getJobOpsAppConfig, getJobOpsAppStatus } from "./app-mode";

describe("hosted app-mode config", () => {
  it("defaults to local mode with hosted capabilities disabled", () => {
    expect(getJobOpsAppStatus({})).toEqual({
      appMode: "local",
      capabilities: {
        hostedSignups: false,
        localSignups: false,
        signupInviteCodeRequired: false,
        platformLlm: false,
        quotas: false,
        userEditableLlmSettings: true,
        llmPreconfigured: false,
      },
      hostedTenantConfigured: false,
    });
  });

  it("flags an LLM preconfigured by env only in local mode with provider and key", () => {
    const env = { LLM_PROVIDER: "anthropic", LLM_API_KEY: "sk-test" };
    expect(getJobOpsAppStatus(env).capabilities.llmPreconfigured).toBe(true);
    expect(
      getJobOpsAppStatus({ LLM_PROVIDER: "anthropic" }).capabilities
        .llmPreconfigured,
    ).toBe(false);
    expect(
      getJobOpsAppStatus({ ...env, LLM_API_KEY: "  " }).capabilities
        .llmPreconfigured,
    ).toBe(false);
    expect(
      getJobOpsAppStatus({
        ...env,
        JOBOPS_APP_MODE: "hosted",
        JOBOPS_HOSTED_TENANT_ID: "tenant_hosted",
      }).capabilities.llmPreconfigured,
    ).toBe(false);
  });

  it("requires a hosted tenant id in hosted mode", () => {
    expect(() =>
      getJobOpsAppConfig({
        JOBOPS_APP_MODE: "hosted",
      }),
    ).toThrow(
      "JOBOPS_HOSTED_TENANT_ID is required when JOBOPS_APP_MODE=hosted.",
    );
  });

  it("accepts JOBOPS_MODE as the hosted-mode alias", () => {
    expect(
      getJobOpsAppStatus({
        JOBOPS_MODE: "hosted",
        JOBOPS_HOSTED_TENANT_ID: "tenant_hosted",
      }),
    ).toMatchObject({ appMode: "hosted", hostedTenantConfigured: true });
  });

  it("rejects an invalid app mode", () => {
    expect(() =>
      getJobOpsAppConfig({
        JOBOPS_APP_MODE: "cloud",
      }),
    ).toThrow('JOBOPS_APP_MODE must be "local" or "hosted"');
  });

  it("rejects invalid boolean flags", () => {
    expect(() =>
      getJobOpsAppConfig({
        JOBOPS_HOSTED_SIGNUPS_ENABLED: "sometimes",
      }),
    ).toThrow("JOBOPS_HOSTED_SIGNUPS_ENABLED must be a boolean flag");
  });

  it("only activates hosted flags in hosted mode", () => {
    const localStatus = getJobOpsAppStatus({
      JOBOPS_HOSTED_SIGNUPS_ENABLED: "true",
      JOBOPS_HOSTED_PLATFORM_LLM_ENABLED: "true",
      JOBOPS_HOSTED_QUOTAS_ENABLED: "true",
      JOBOPS_HOSTED_TENANT_ID: "tenant_hosted",
    });
    expect(localStatus).toEqual({
      appMode: "local",
      capabilities: {
        hostedSignups: false,
        localSignups: false,
        signupInviteCodeRequired: false,
        platformLlm: false,
        quotas: false,
        userEditableLlmSettings: true,
        llmPreconfigured: false,
      },
      hostedTenantConfigured: false,
    });

    const hostedStatus = getJobOpsAppStatus({
      JOBOPS_APP_MODE: "hosted",
      JOBOPS_HOSTED_SIGNUPS_ENABLED: "true",
      JOBOPS_HOSTED_PLATFORM_LLM_ENABLED: "true",
      JOBOPS_HOSTED_QUOTAS_ENABLED: "true",
      JOBOPS_HOSTED_TENANT_ID: "tenant_hosted",
    });
    expect(hostedStatus).toEqual({
      appMode: "hosted",
      capabilities: {
        hostedSignups: true,
        localSignups: false,
        signupInviteCodeRequired: false,
        platformLlm: true,
        quotas: true,
        userEditableLlmSettings: false,
        llmPreconfigured: false,
      },
      hostedTenantConfigured: true,
    });
  });

  it("enables local signups only in local mode", () => {
    expect(
      getJobOpsAppStatus({ JOBOPS_LOCAL_SIGNUPS_ENABLED: "true" }).capabilities,
    ).toMatchObject({
      hostedSignups: false,
      localSignups: true,
      signupInviteCodeRequired: false,
    });

    expect(
      getJobOpsAppStatus({
        JOBOPS_APP_MODE: "hosted",
        JOBOPS_HOSTED_TENANT_ID: "tenant_hosted",
        JOBOPS_LOCAL_SIGNUPS_ENABLED: "true",
      }).capabilities,
    ).toMatchObject({ hostedSignups: false, localSignups: false });
  });

  it("rejects an invalid local signups flag", () => {
    expect(() =>
      getJobOpsAppConfig({ JOBOPS_LOCAL_SIGNUPS_ENABLED: "maybe" }),
    ).toThrow("JOBOPS_LOCAL_SIGNUPS_ENABLED must be a boolean flag");
  });

  it("requires the invite code only while some signup path is open", () => {
    const closed = getJobOpsAppConfig({
      JOBOPS_SIGNUP_INVITE_CODE: "  open-sesame  ",
    });
    expect(closed.capabilities.signupInviteCodeRequired).toBe(false);
    expect(closed.signupInviteCode).toBe("open-sesame");

    expect(
      getJobOpsAppStatus({
        JOBOPS_LOCAL_SIGNUPS_ENABLED: "true",
        JOBOPS_SIGNUP_INVITE_CODE: "open-sesame",
      }).capabilities.signupInviteCodeRequired,
    ).toBe(true);

    expect(
      getJobOpsAppStatus({
        JOBOPS_APP_MODE: "hosted",
        JOBOPS_HOSTED_TENANT_ID: "tenant_hosted",
        JOBOPS_HOSTED_SIGNUPS_ENABLED: "true",
        JOBOPS_SIGNUP_INVITE_CODE: "open-sesame",
      }).capabilities.signupInviteCodeRequired,
    ).toBe(true);
  });

  it("never exposes the invite code in the public status", () => {
    const status = getJobOpsAppStatus({
      JOBOPS_LOCAL_SIGNUPS_ENABLED: "true",
      JOBOPS_SIGNUP_INVITE_CODE: "open-sesame",
    });
    expect(JSON.stringify(status)).not.toContain("open-sesame");
  });
});
