// English strings: Settings page and AI/integration configuration panels.
const settings = {
  page: {
    title: "Settings",
    subtitle:
      "Configure AI, scoring, integrations, and recovery from one focused workspace.",
    searchPlaceholder: "Search settings",
    searchEmpty: "No settings matched",
    unsavedSections_one: "{{count}} unsaved section",
    unsavedSections_other: "{{count}} unsaved sections",
    discardChanges: "Discard changes",
    resetToDefaults: "Reset to defaults",
    saving: "Saving...",
    saveChanges: "Save changes",
    fixErrors: "Please fix the highlighted errors before saving.",
  },
  nav: {
    groups: {
      account: "Account",
      ai: "AI",
      scoring: "Scoring",
      integrations: "Integrations",
      workspaces: "Workspaces & Security",
      display: "Display",
      backups: "Backups",
      danger: "Danger Zone",
    },
    sections: {
      billing: {
        label: "Plan & Billing",
        description: "Your hosted plan, included AI, and Stripe subscription.",
      },
      model: {
        label: "Models",
        description: "Provider, API credentials, and task-specific overrides.",
      },
      chat: {
        label: "Writing Style",
        description: "Tone, language, presets, and writing constraints.",
      },
      "prompt-templates": {
        label: "Prompt Templates",
        description:
          "Base AI instructions for Ghostwriter, tailoring, and scoring.",
      },
      scoring: {
        label: "Rules & Filters",
        description:
          "Salary penalties, thresholds, keywords, and scorer hints.",
      },
      "reactive-resume": {
        label: "Reactive Resume",
        description: "Resume sync, templates, and project selection.",
      },
      webhooks: {
        label: "Webhooks",
        description: "Pipeline and job completion event destinations.",
      },
      "tracer-links": {
        label: "Tracer Links",
        description: "Public URL readiness and verification state.",
      },
      environment: {
        label: "Workspace Access",
        description: "Service credentials and authentication protection.",
      },
      display: {
        label: "Display Preferences",
        description: "Sponsor badges and markdown rendering behavior.",
      },
      backup: {
        label: "Backups",
        description: "Automatic schedules, retention, and manual snapshots.",
      },
      "danger-zone": {
        label: "Danger Zone",
        description: "Delete jobs, runs, or the full local database.",
      },
    },
  },
  badges: {
    sensitive: "Sensitive",
    needsAttention: "Needs attention",
    unsaved: "Unsaved",
    configured: "Configured",
    usingDefaults: "Using defaults",
    ready: "Ready",
    customized: "Customized",
    defaultRules: "Default rules",
    connected: "Connected",
    optional: "Optional",
    checkRequired: "Check required",
    notConfigured: "Not configured",
    active: "Active",
    scheduled: "Scheduled",
    manualOnly: "Manual only",
  },
  toasts: {
    loadAppStatusFailed: "Failed to load app status",
    loadBackupsFailed: "Failed to load backups",
    loadBillingFailed: "Failed to load billing status",
    openStripeFailed: "Failed to open Stripe",
    loadSettingsFailed: "Failed to load settings",
    loadRxResumeProjectsFailed: "Failed to load RxResume projects",
    backupCreated: "Backup created successfully",
    backupCreateFailed: "Failed to create backup",
    confirmDeleteBackup:
      'Delete backup "{{filename}}"? This action cannot be undone.',
    backupDeleted: "Backup deleted successfully",
    backupDeleteFailed: "Failed to delete backup",
    tracerUnavailable: "Tracer links are unavailable. Verify your public URL.",
    tracerReady: "Tracer links are ready",
    tracerVerifyFailed: "Failed to verify tracer-link readiness",
    rxresumeValidationPassed: "Reactive Resume validation passed",
    rxresumeValidationFailed: "Reactive Resume validation failed",
    rxresumeKeyInvalid: "Reactive Resume API key is invalid.",
    rxresumeSaveWarning:
      "Settings saved, but JobOps could not verify Reactive Resume because the instance is unavailable.",
    settingsSaved: "Settings saved",
    saveFailed: "Failed to save settings",
    databaseCleared: "Database cleared",
    databaseClearedDescription: "Deleted {{number}} jobs.",
    clearDatabaseFailed: "Failed to clear database",
    noStatusesSelected: "No statuses selected",
    jobsCleared: "Jobs cleared",
    jobsClearedByStatus: "Deleted {{number}} jobs: {{details}}",
    statusCount: "{{number}} {{status}}",
    noJobsFound: "No jobs found",
    noJobsWithStatuses: "No jobs with selected statuses found",
    clearJobsFailed: "Failed to clear jobs",
    jobsClearedByScore:
      "Deleted {{number}} jobs with score below {{threshold}}. Applied jobs were preserved.",
    noJobsBelowScore: "No jobs with score below {{threshold}} found",
    clearJobsByScoreFailed: "Failed to clear jobs by score",
    resetDone: "Reset to default",
    resetFailed: "Failed to reset settings",
    discarded: "Discarded unsaved changes",
  },
  shared: {
    effectiveDefault: "Effective: {{effective}} | Default: {{default}}",
    yes: "Yes",
    no: "No",
    enabled: "Enabled",
    disabled: "Disabled",
    notSet: "Not set",
    current: "Current:",
    none: "None",
    listSeparator: ", ",
  },
  backup: {
    title: "Backup",
    enableLabel: "Enable automatic backups",
    enableHelp:
      "Automatically create database backups on a daily schedule. Manual backups can always be created regardless of this setting.",
    hourLabel: "Backup Hour",
    hourHelper:
      "Hour of the day (0-23) in UTC when automatic backups should run. Default: {{hour}}:00 UTC.",
    hourCurrent:
      "Effective: {{effective}}:00 UTC | Default: {{default}}:00 UTC",
    maxCountLabel: "Max Backups to Keep",
    maxCountHelper:
      "Maximum number of automatic backups to retain (1-5). Older backups are deleted automatically. Default: {{value}}.",
    nextScheduled: "Next scheduled backup: {{date}}",
    history: "Backup History",
    creating: "Creating...",
    createNow: "Create Backup Now",
    count_one: "{{count}} backup",
    count_other: "{{count}} backups",
    emptyTitle: "No backups yet",
    emptyDescription: "Create your first backup to protect your data.",
    typeAuto: "Auto",
    typeManual: "Manual",
    enabled: "Enabled",
    hour: "Hour",
    maxCount: "Max Count",
  },
  billing: {
    title: "Billing",
    usage: {
      job_search: "Job-source searches",
      pipeline_run: "Pipeline runs",
      tailoring: "AI operations",
      ghostwriter: "Ghostwriter generations",
      pdf_export: "PDF exports",
    },
    usageCount: "{{used}} / {{limit}}",
    usageAria: "{{label}} usage",
    usageValueText: "{{used}} of {{limit}} used",
    planPro: "Pro",
    planFree: "Free",
    currentPlan: "Current plan",
    proIncludedAi: "Included AI with higher monthly hosted limits.",
    proOwnAi: "Higher monthly hosted limits. Connect your own AI provider.",
    freeIncludedAi:
      "Included AI with lower monthly hosted limits. Upgrade for higher limits.",
    freeOwnAi:
      "Connect your own AI provider. Upgrade for higher monthly hosted limits.",
    perMonth: "/ month",
    activeUntil: "Your Pro access remains active until {{date}}.",
    activeUntilPeriodEnd:
      "Your Pro access remains active until the current period ends.",
    openingStripe: "Opening Stripe…",
    manage: "Manage subscription",
    upgrade: "Upgrade to Pro",
    monthlyUsage: "Monthly usage",
    resetsMonthly: "Resets monthly",
    quotasDisabled: "Usage limits are not enabled for this workspace.",
  },
  chat: {
    title: "Writing Style & Language",
    intro:
      "These defaults shape AI-generated writing across Ghostwriter and resume tailoring.",
    presetLabel: "Preset",
    presetPlaceholder: "Choose a writing preset",
    presetCustom: "Custom",
    presetCustomDescription: "Your current values are custom.",
    presets: {
      professional: {
        label: "Professional",
        description: "Balanced default for polished, job-ready writing.",
      },
      concise: {
        label: "Concise",
        description: "Keeps responses compact and easy to scan.",
      },
      direct: {
        label: "Direct",
        description: "Uses plain, decisive phrasing with minimal hedging.",
      },
      friendly: {
        label: "Friendly",
        description: "Warm and personable while staying professional.",
      },
    },
    stopSlopLabel: "Use Stop Slop for Ghostwriter",
    stopSlopHelp:
      "Applies extra Ghostwriter-only instructions to remove filler, formulaic AI phrasing, passive voice, vague claims, and em dashes.",
    outputLanguage: "Output language",
    outputLanguagePlaceholder: "Select output language",
    outputLanguageHelp: "Choose how AI picks the output language.",
    languageModes: {
      manual: "Choose specific language",
      "match-resume": "Match current resume language",
      "match-job-description": "Match job description",
    },
    specificLanguage: "Specific language",
    specificLanguagePlaceholder: "Select language",
    specificLanguageHelp:
      "Used when output language is set to a specific language.",
    languages: {
      english: "English",
      german: "German",
      french: "French",
      spanish: "Spanish",
      japanese: "Japanese",
    },
    tone: "Tone",
    tonePlaceholder: "Select tone",
    tones: {
      professional: "Professional",
      concise: "Concise",
      direct: "Direct",
      friendly: "Friendly",
    },
    formality: "Formality",
    formalityPlaceholder: "Select formality",
    formalities: {
      low: "Low",
      medium: "Medium",
      high: "High",
    },
    constraints: "Constraints",
    constraintsPlaceholder:
      "Example: keep answers under 120 words and include bullet points",
    constraintsHelp:
      "Optional global writing constraints applied to Ghostwriter replies and resume tailoring.",
    doNotUse: "Do-not-use terms",
    doNotUsePlaceholder: 'e.g. "synergize", "leverage"',
    doNotUseHelp:
      "Optional words or phrases the AI should avoid when generating text. This is guidance to the model, not a guaranteed blocklist.",
    doNotUseRemove: "Remove do-not-use term",
    languageMode: "Language mode",
    stopSlop: "Stop Slop",
    summaryMaxWords: "Summary max words",
    summaryMaxWordsHelp:
      "Limits words in the AI-generated summary. Overrides any word limits in Constraints.",
    maxKeywords: "Max keywords per skill",
    maxKeywordsHelp:
      "Caps keywords per skill category. Overrides any keyword limits in Constraints.",
    noLimit: "No limit",
    rangeError: "Must be between {{min}} and {{max}}",
  },
  connected: {
    removed: "Connected account removed",
    removeFailed: "Failed to remove connected account",
    passwordUpdated: "Password updated",
    passwordUpdateFailed: "Failed to update password",
    connectFailed: "Failed to connect {{provider}}",
    passwordTooShort: "Password must be at least {{min}} characters.",
    passwordMismatch: "New passwords do not match.",
    title: "Connected accounts",
    intro: "Sign in with an identity provider instead of your JobOps password.",
    noEmail: "No email",
    identityMeta: "{{account}} · connected {{date}}",
    unlink: "Unlink",
    unlinkTitle: "Unlink {{provider}}?",
    unlinkDescription:
      "You will no longer be able to sign in to JobOps with this {{provider}} account.",
    unlinkConfirm: "Unlink account",
    none: "No accounts are connected yet.",
    connect: "Connect {{provider}}",
    passwordTitle: "Account password",
    noPassword:
      "This account has no password yet. Set one to keep a fallback sign-in method.",
    currentPassword: "Current password",
    currentPasswordPlaceholder: "Enter current password",
    newPassword: "New password",
    newPasswordPlaceholder: "Enter a new password",
    confirmPassword: "Confirm new password",
    confirmPasswordPlaceholder: "Re-enter the new password",
    changePassword: "Change password",
    setPassword: "Set password",
  },
  danger: {
    title: "Danger Zone",
    // Raw status ids in English (shown capitalised by CSS), labels in Japanese.
    statusNames: {
      discovered: "discovered",
      processing: "processing",
      ready: "ready",
      applied: "applied",
      in_progress: "in_progress",
      skipped: "skipped",
      expired: "expired",
    },
    statusDescriptions: {
      discovered: "Crawled but not processed",
      processing: "Currently generating resume",
      ready: "PDF generated, waiting for user to apply",
      applied: "Application sent",
      in_progress: "Application moved beyond applied stage",
      skipped: "User skipped this job",
      expired: "Deadline passed",
    },
    byStatusTitle: "Clear Jobs by Status",
    byStatusHelp: "Select which job statuses you want to clear.",
    clearSelected: "Clear Selected ({{number}})",
    byStatusConfirmTitle: "Clear jobs by status?",
    byStatusConfirmDescription:
      "This will delete all jobs with the following statuses: {{statuses}}. This action cannot be undone.",
    clearStatuses_one: "Clear {{count}} status",
    clearStatuses_other: "Clear {{count}} statuses",
    byScoreTitle: "Clear Jobs Below Score",
    byScoreHelp:
      "Remove all jobs with a suitability score below the specified threshold. Applied jobs will not be deleted.",
    thresholdLabel: "Score Threshold (0-100)",
    thresholdPlaceholder: "Enter score threshold",
    clearBelow: "Clear Below {{threshold}}",
    byScoreConfirmTitle: "Clear jobs below score {{threshold}}?",
    byScoreConfirmDescription:
      "This will permanently delete all jobs with a suitability score below {{threshold}}. Applied jobs will be preserved. This action cannot be undone.",
    clearJobs: "Clear jobs",
    databaseTitle: "Clear Entire Database",
    databaseHelp: "Delete all jobs and pipeline runs from the database.",
    clearDatabaseButton: "Clear Database",
    databaseConfirmTitle: "Clear all jobs?",
    databaseConfirmDescription:
      "This deletes all jobs and pipeline runs from the database. This action cannot be undone.",
    clearDatabaseConfirm: "Clear database",
  },
  display: {
    title: "Display Settings",
    sponsorLabel: "Show visa sponsor information",
    sponsorHelp:
      "Display a badge next to the employer name showing the match percentage with the UK visa sponsor list. This helps identify employers that are licensed to sponsor work visas.",
    markdownLabel: "Render Markdown in job descriptions",
    markdownHelp:
      "Show headings, bold text, lists, and code blocks as formatted content when you expand a full job description. Turn this off if you prefer the raw source text.",
    autoTailorLabel: "Auto-tailor manually imported jobs",
    autoTailorHelp:
      "When enabled, jobs added via Manual Import are immediately scored and have a tailored resume PDF generated. Turn off to save LLM tokens and tailor later from the job detail view. You can override this per import in the review step.",
    sponsorEffective: "Sponsor info effective",
    sponsorDefault: "Sponsor info default",
    markdownEffective: "Markdown rendering effective",
    markdownDefault: "Markdown rendering default",
    autoTailorEffective: "Auto-tailor on import effective",
    autoTailorDefault: "Auto-tailor on import default",
    stageStyleLabel: "Application stages",
    stageStyleHelp:
      "How stages are named on the In Progress Board, the job timeline and Log event. The Japanese hiring process shows Document screening → Aptitude test → 1st interview → 2nd interview → Final interview → Offer. Your existing jobs keep their stage.",
    stageStyles: {
      standard: "Standard",
      japanese: "Japanese hiring process",
    },
    stageStyleSaveFailed: "Could not change the stage names.",
  },
  environment: {
    title: "Environment & Workspaces",
    userCreated: "User created",
    userCreateFailed: "Failed to create user",
    userUpdated: "User updated",
    userUpdateFailed: "Failed to update user",
    passwordReset: "Password reset",
    passwordResetFailed: "Failed to reset password",
    workspace: "Workspace",
    signedInAs: "Signed in as {{user}}.",
    aWorkspaceUser: "a workspace user",
    usersTitle: "Workspace Users",
    usersIntro:
      "Each user gets a private workspace with isolated jobs and settings.",
    namePlaceholder: "Name",
    usernamePlaceholder: "Username",
    tempPasswordPlaceholder: "Temporary password",
    create: "Create",
    systemAdmin: "System admin",
    newPasswordPlaceholder: "New password",
    enable: "Enable",
    disable: "Disable",
    noUsers: "No users found.",
    serviceAccounts: "Service Accounts",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "Enter new password",
    appId: "App ID",
    appKey: "App Key",
    appKeyPlaceholder: "Enter new app key",
    security: "Security",
  },
  model: {
    title: "Model",
  },
  rxresume: {
    precheckMissingApiKey: "Add an API key, then test again.",
    missingApiKeyLabel: "RxResume API key",
    validationFailed: "RxResume validation failed",
    saveFailed: "Failed to save RxResume settings",
    statusConnected: "Connected",
    statusFailed: "Failed",
    statusNotTested: "Not tested",
    statusPill: "{{label}}: {{status}}",
    v5Status: "v5 status",
    renderers: {
      rxresume: "RxResume export",
      latex: "Local LaTeX (Jake template)",
      typst: "Local Typst",
    },
    rendererHelp: {
      rxresume:
        "RxResume export uses the upstream print/export endpoint for the final PDF.",
      latex:
        "LaTeX renders PDFs locally with Jake's template and requires tectonic on the JobOps host.",
      typst:
        "Typst renders PDFs locally and supports selectable resume themes.",
    },
    paperSizes: {
      auto: "Renderer default",
      a4: "A4",
      letter: "US Letter",
    },
    paperDefaultHelp: {
      rxresume:
        "Renderer default keeps the page format saved on the resume itself. Free-form resumes always stay continuous.",
      latex: "Renderer default is US Letter for the LaTeX template.",
      typst: "Renderer default is A4 for Typst themes.",
    },
    pdfRenderer: "PDF renderer",
    pdfRendererPlaceholder: "Choose PDF renderer",
    typstTheme: "Typst theme",
    typstThemePlaceholder: "Choose Typst theme",
    typstThemeHelp:
      "Classic mirrors the current resume density; Compact fits more content on the page.",
    paperSize: "Paper size",
    paperSizePlaceholder: "Choose paper size",
    apiWarning: "Reactive Resume API warning",
    apiError: "Reactive Resume API error",
    urlLabel: "RxResume URL",
    urlHelper:
      "Leave blank to use the default for the selected mode (or the RXRESUME_URL environment override, if set).",
    apiKeyLabel: "v5 API key",
    apiKeyPlaceholder: "Enter v5 API key",
    noProjects:
      "No resume projects were found. Add projects to your active resume to configure automatic project selection.",
    loadingProjects: "Loading resume projects...",
    choosePdf: "Choose a PDF to configure resume projects.",
    maxProjects: "Max projects to choose",
    project: "Project",
    visibleInTemplate: "Visible in template",
    mustInclude: "Must include",
    aiCanSelect: "AI can select",
  },
  codex: {
    loadStatusFailed: "Failed to load Codex sign-in status.",
    startFailed: "Failed to start Codex sign-in.",
    copyUnavailable: "Copy is not available in this browser.",
    copyFailed: "Failed to copy code.",
    disconnectFailed: "Failed to disconnect Codex.",
    title: "Codex Sign-In",
    authenticated: "Authenticated",
    connected:
      "<strong>Connected</strong>. Existing Codex credentials were found in this runtime.",
    connectedAs:
      "<strong>Connected</strong> as {{username}}. Existing Codex credentials were found in this runtime.",
    disconnecting: "Disconnecting...",
    disconnect: "Disconnect",
    waiting: "Waiting for approval",
    intro:
      "Start sign-in to generate a one-time code. After approval in your browser, click <strong>Check Status</strong>. <anchor>Learn more</anchor>",
    stepStart: "Start sign-in",
    stepCopy: "Copy code and open verification page",
    stepApprove: "Approve and return to JobOps",
    oneTimeCode: "One-time code",
    copyCode: "Copy code",
    openVerification: "Open verification page",
    expiresIn: "Code expires in {{time}}",
    checking: "Checking...",
    checkStatus: "Check Status",
    starting: "Starting...",
    startNew: "Start New Sign-In",
    start: "Start Sign-In",
  },
  cliHints: {
    authGuide: "Authentication guide",
    claude: {
      title: "Claude CLI on this machine",
      setup:
        "Install <npm>@anthropic-ai/claude-code</npm>, then run <code>claude setup-token</code> in a terminal (requires a Claude Pro, Max, Team, or Enterprise subscription) and set the printed value as <code>CLAUDE_CODE_OAUTH_TOKEN</code>, or set <code>ANTHROPIC_API_KEY</code> instead. JobOps spawns the CLI in headless mode and reuses that authentication — no JobOps API key field.",
      docker:
        ". In Docker, set <code>CLAUDE_CODE_OAUTH_TOKEN</code> (or <code>ANTHROPIC_API_KEY</code>) in your <code>.env</code> file — no credential file mount is needed. Optional: <code>CLAUDE_CLI_BIN</code> to override the binary path.",
    },
    gemini: {
      title: "Gemini CLI on this machine",
      setup:
        "Install <npm>@google/gemini-cli</npm>, then run <code>gemini</code> in a terminal and complete Google sign-in (OAuth), or set <code>GEMINI_API_KEY</code> for the CLI. JobOps spawns the CLI in headless mode and reuses those credentials — no JobOps API key field.",
      docker:
        ". In Docker, mount your CLI config (for example <code>~/.gemini</code>) into the container or run <code>gemini</code> via <code>docker compose exec</code>. Optional: <code>GEMINI_CLI_BIN</code> to override the binary path; <code>GEMINI_CLI_TRUST_WORKSPACE=true</code> to omit <code>--skip-trust</code>.",
    },
  },
  llm: {
    providers: {
      openaiCompatible: "OpenAI-compatible",
    },
    providerHints: {
      atlascloud:
        "Atlas Cloud provides OpenAI-compatible access to hosted text models with one API key.",
      litellm:
        "LiteLLM is a self-hosted AI gateway: one endpoint for 100+ providers (OpenAI, Anthropic, Gemini, Bedrock, Azure, Vertex AI, Ollama) with virtual keys, budgets and fallbacks.",
      openrouter:
        "OpenRouter uses your API key and supports model routing across providers.",
      orcarouter:
        "OrcaRouter uses your API key and routes requests across providers through an OpenAI-compatible endpoint with adaptive routing and guardrails.",
      requesty:
        "Requesty uses your API key and routes requests across providers through an OpenAI-compatible endpoint.",
      api_route:
        "API Route uses your API key with an OpenAI-compatible endpoint. Select an exact model ID available to your key.",
      lmstudio: "LM Studio runs locally via its OpenAI-compatible server.",
      ollama:
        "Ollama typically runs locally. Add an API key only for Ollama-compatible endpoints protected by bearer auth.",
      openai: "OpenAI uses the Responses API with structured outputs.",
      anthropic:
        "Claude uses Anthropic's native Messages API with your Anthropic API key.",
      openai_compatible:
        "Use a bearer token with any chat-completions-compatible endpoint.",
      glm: "GLM uses the Z.AI chat completions API (OpenAI-compatible) with your API key.",
      gemini: "Gemini uses the native AI Studio API and requires a key.",
      gemini_cli:
        "Gemini (CLI) runs the official Google Gemini CLI on this host using your OAuth session or CLI API key — no JobOps LLM key.",
      claude_cli:
        "Claude (CLI) runs the official Claude Code CLI on this host using your subscription token or API key — no JobOps LLM key.",
      codex:
        "Codex runs through a local app-server process and uses your Codex login session.",
    },
    keyHelpers: {
      atlascloud: "Create a key at atlascloud.ai",
      litellm: "Optional virtual key issued by your LiteLLM proxy",
      openrouter: "Create a key at openrouter.ai",
      orcarouter: "Create a key at orcarouter.ai/console",
      requesty: "Create a key at app.requesty.ai/api-keys",
      api_route: "Create a key at api-route.com/api-keys",
      lmstudio: "No API key required for LM Studio",
      ollama:
        "Optional bearer token for Ollama-compatible endpoints that require auth",
      openai: "Create a key at platform.openai.com",
      anthropic: "Create a key at platform.claude.com",
      openai_compatible:
        "Use the bearer token issued by your compatible provider",
      glm: "Create a key at z.ai",
      gemini: "Create a key at aistudio.google.com/api-keys",
      gemini_cli:
        "Authenticate with the Gemini CLI (gemini login / OAuth); see docs link below",
      claude_cli:
        "Authenticate with the Claude CLI (claude setup-token); see docs link below",
      codex: "No API key required when Codex is authenticated locally",
    },
    baseUrlHelpers: {
      openaiCompatible:
        "Enter a base URL or a full /v1/chat/completions endpoint.",
      litellm:
        "Default: http://localhost:4000. From Docker Desktop, use http://host.docker.internal:4000, or the proxy service name when both run in one Compose project.",
      ollama:
        "Default: http://localhost:11434. From Docker Desktop, use http://host.docker.internal:11434. On Linux Docker, use a container-reachable host gateway such as http://172.17.0.1:11434.",
      default: "Default: {{url}}",
    },
    keepSavedKey: ". Leave blank to keep the saved key.",
    purposes: {
      scoring: {
        label: "Scoring",
        description: "Job fit, brief extraction, and ranking decisions.",
      },
      tailoring: {
        label: "Tailoring",
        description: "Ghostwriter and resume content tailoring.",
      },
      projectSelection: {
        label: "Project selection",
        description: "Choosing resume projects for a job.",
      },
    },
    loadModelsFailed: "Failed to load models.",
    apiKey: "API key",
    llmApiKey: "LLM API key",
    apiKeyOptional: "API key (optional)",
    llmApiKeyOptional: "LLM API key (optional)",
    notRequired: "Not required",
    modelHelper: {
      addKey: "Add or save a {{provider}} API key to load available models.",
      loading: "Loading available models...",
      choose: "Choose from the available text-generation models.",
      noOllamaModels:
        "No Ollama models were returned. Pull a model in Ollama, then choose it here before continuing.",
      noModels: "No text-generation models were returned.",
      codex:
        "Type the exact model name manually, or leave blank to use the {{provider}} default model. <anchor>find out what model name to use</anchor>.",
      manual:
        "Type the exact model name manually, or leave blank to use the {{provider}} default model.",
    },
    selectProviderModel: "Select a {{provider}} model",
    useProviderDefault: "Use {{provider}} default",
    inheritDefaultModel: "Inherit default model",
    llmProviderHeading: "LLM Provider",
    provider: "Provider",
    selectProvider: "Select provider",
    providerUsage:
      "Used for scoring, tailoring, ghostwriting, and email classification.",
    baseUrl: "Base URL",
    llmBaseUrl: "LLM base URL",
    pasteNewKey: "Paste a new key",
    enterNewKey: "Enter new key",
    optionalBearer: "Optional bearer token",
    noKeyRequired: "No API key is required for this provider.",
    defaultModel: "Default model",
    selectModel: "Select a model",
    purposeOverrides: "Purpose-specific model overrides",
    scoringModelLabel: "Scoring Model",
    tailoringModelLabel: "Tailoring Model",
    projectSelectionModelLabel: "Project Selection Model",
    resolvedConfig: "Resolved config",
    scoringModel: "Scoring model",
    tailoringModel: "Tailoring model",
    projectSelection: "Project selection",
    inherits: "inherits",
    inheritsValue: "inherits {{value}}",
    inheritPurposeDefault: "Inherit purpose default",
    purposeModelHelperDefault: "Leave blank to inherit the purpose default.",
    purposeModelHelperManual:
      "Type the exact model name, or leave blank to use the default from {{provider}}.",
    inheritDefault: "Inherit default",
    pastePurposeKey: "Paste a purpose key",
    model: "Model",
    inheritModel: "Inherit model",
    searchModels: "Search models...",
    noModelsFound: "No models found.",
  },
  tracer: {
    title: "Tracer Links",
    checking: "Checking",
    notConfigured: "Not configured",
    stale: "Stale",
    ready: "Ready",
    unavailable: "Unavailable",
    never: "Never",
    readiness: "Readiness",
    publicUrl: "Public URL",
    lastChecked: "Last checked: {{time}}",
    hint: "Enable per-job tracer links only when status is Ready.",
    verifyNow: "Verify now",
  },
  webhooks: {
    title: "Webhooks",
    pipelineStatus: "Pipeline Status",
    url: "Webhook URL",
    pipelineHelper:
      "When set, the server sends a POST on pipeline completion/failure. Default: {{value}}.",
    jobCompletion: "Job Completion",
    jobCompleteHelper:
      "When set, the server sends a POST when you mark a job as applied (includes the job description). Default: {{value}}.",
    secret: "Webhook Secret",
    secretPlaceholder: "Enter new secret",
    secretHelper: "Secret sent to webhook (Bearer token)",
  },
  scoring: {
    title: "Scoring Settings",
    penalizeLabel: "Penalize Missing Salary",
    penalizeHelp:
      'Reduce suitability scores for jobs that do not include salary information. Jobs with any salary text (including "Competitive") are not penalized.',
    penaltyLabel: "Penalty Amount",
    penaltyHelper:
      "Points to subtract from suitability score (0-100). Default: {{value}}.",
    autoSkipLabel: "Auto-skip Score Threshold",
    autoSkipHelp:
      "Jobs scoring below this threshold will be automatically skipped during scoring. Leave empty to disable auto-skip. (0-100)",
    blockedLabel: "Blocked Company Keywords",
    blockedPlaceholder: 'e.g. "recruitment", "staffing"',
    blockedHelp:
      "Jobs whose company name contains one of these keywords will be dropped during discovery.",
    blockedRemove: "Remove blocked keyword",
    penaltyEnabled: "Penalty Enabled",
    autoSkipThreshold: "Auto-skip Threshold",
  },
  baseResume: {
    title: "Template Resume",
    fetchFailed: "Failed to fetch resumes",
    selectPlaceholder: "Select a template resume...",
    noneFoundPlaceholder: "No resumes found",
    noneFoundHint:
      "No resumes found in your account. Please create a resume on the <anchor>Reactive Resume website</anchor> first.",
  },
  prompts: {
    title: "Prompt Templates",
    intro:
      "Edit the base AI instructions used by Ghostwriter, resume tailoring, and scoring.",
    warningTitle: "Advanced setting",
    warningBody:
      "Changing these templates can degrade or break AI behavior. Removing important instructions or placeholders may produce poor results. Use reset to restore the default templates.",
    resetAll: "Reset all prompts",
    supportedPlaceholders: "Supported placeholders",
    templates: {
      ghostwriterSystemPromptTemplate: {
        label: "Ghostwriter system prompt",
        description:
          "Controls Ghostwriter's base behavior before job context and profile context are attached.",
      },
      tailoringPromptTemplate: {
        label: "Resume tailoring prompt",
        description:
          "Controls how summary, headline, and skills are generated for a job-specific resume.",
      },
      scoringPromptTemplate: {
        label: "Job scoring prompt",
        description:
          "Controls how suitability scoring evaluates the candidate profile. Minified source job JSON and the output contract are appended automatically.",
      },
    },
  },
};

export default settings;
