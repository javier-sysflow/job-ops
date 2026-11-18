// English strings: Gmail tracking inbox.
const tracking = {
  page: {
    title: "Tracking Inbox",
    subtitle: "Post-application message review",
    heading: "Application Inbox Matching",
    intro:
      "Connect your inbox to ingest related emails, review the suggested job matches, and approve or deny to automatically update your tracking timeline.",
  },
  notAvailable: "n/a",
  controls: {
    title: "Provider Controls",
    provider: "Provider",
    accountKey: "Account Key",
    gmailHint:
      "Gmail connect uses Google OAuth popup and stores credentials server-side. No manual refresh token paste is needed.",
    maxMessages: "Max Messages",
    searchDays: "Search Days",
    connect: "Connect",
    sync: "Sync",
    syncing: "Syncing...",
    disconnect: "Disconnect",
    pendingReview: "Pending review:",
    lastSynced: "Last synced: {{date}}",
  },
  connection: {
    unknown: "Unknown",
    disconnected: "Disconnected",
    error: "Error",
    connected: "Connected",
  },
  queue: {
    title: "Pending Review Queue",
    approveAll: "Approve All",
    ignoreAll: "Ignore All",
    loading: "Loading inbox...",
    emptyTitle: "No pending messages",
    emptyDescription: "Run sync to ingest new job-application emails.",
  },
  runs: {
    title: "Recent Sync Runs",
    empty: "No sync runs yet.",
    status: {
      running: "running",
      completed: "completed",
      failed: "failed",
      cancelled: "cancelled",
    },
    discovered: "discovered {{value}}",
    relevant: "relevant {{value}}",
    matched: "matched {{value}}",
  },
  runModal: {
    title: "Run Messages",
    summary:
      "Run {{id}} • discovered {{discovered}} • relevant {{relevant}} • matched {{matched}}",
    description:
      "Review all messages captured in this sync run, including partial matches.",
    loading: "Loading run messages...",
    empty: "No messages found for this run.",
  },
  bulkDialog: {
    approveTitle: "Approve All Messages?",
    ignoreTitle: "Ignore All Messages?",
    approveDescription_one:
      "This will approve {{count}} message with suggested job matches. Messages without matches will be skipped.",
    approveDescription_other:
      "This will approve {{count}} messages with suggested job matches. Messages without matches will be skipped.",
    ignoreDescription_one: "This will ignore all {{count}} pending message.",
    ignoreDescription_other: "This will ignore all {{count}} pending messages.",
  },
  viewer: {
    unknownSender: "Unknown sender",
    noReliableMatch:
      "Relevant email with no reliable job match. Please select the correct job.",
    loadingJobs: "Loading jobs...",
    selectJob: "Select job",
    searchJobs: "Search jobs...",
    noJobsFound: "No jobs found.",
    confirmMatch: "Confirm email-job match",
    ignoreMatch: "Ignore this match",
  },
  errors: {
    oauthTimeout: "Timed out waiting for Gmail OAuth response.",
    oauthWindowClosed: "Gmail OAuth window was closed before completion.",
    oauthFailed: "Gmail OAuth failed: {{error}}",
    oauthNoCode: "Gmail OAuth did not return an authorization code.",
  },
  toasts: {
    refreshFailed: "Failed to refresh tracking inbox",
    providerNotImplemented:
      "{{provider}} connect is not implemented yet. Use Gmail for now.",
    popupBlocked:
      "Browser blocked the Gmail OAuth popup. Allow popups and retry.",
    providerConnected: "Provider connected",
    invalidSyncSettings:
      "Max messages must be 1-500 and search days must be 1-365 before syncing.",
    syncInProgress:
      "Sync in progress. This may take up to a couple of minutes.",
    syncCompleted: "Sync completed",
    providerDisconnected: "Provider disconnected",
    connectFailed: "Failed to connect provider connection",
    syncFailed: "Failed to sync provider connection",
    disconnectFailed: "Failed to disconnect provider connection",
    selectJobFirst: "Select an applied job before making a decision.",
    messageLinked: "Message linked",
    messageIgnored: "Message ignored",
    approveMessageFailed: "Failed to approve message",
    denyMessageFailed: "Failed to deny message",
    approveAllSucceeded: "All {{succeeded}} messages approved",
    ignoreAllSucceeded: "All {{succeeded}} messages ignored",
    approvePartial:
      "{{succeeded}} messages approved, {{skipped}} skipped (no suggested match)",
    ignorePartial:
      "{{succeeded}} messages ignored, {{skipped}} skipped (no suggested match)",
    approveMixed:
      "{{succeeded}} approved, {{failed}} failed, {{skipped}} skipped",
    ignoreMixed:
      "{{succeeded}} ignored, {{failed}} failed, {{skipped}} skipped",
    approveMessagesFailed: "Failed to approve messages",
    denyMessagesFailed: "Failed to deny messages",
    noMatchesToApprove: "No messages with suggested job matches to approve",
    noMessagesToIgnore: "No messages to ignore",
    loadStatusFailed: "Failed to load provider connection status",
    loadInboxFailed: "Failed to load inbox",
    loadRunsFailed: "Failed to load sync runs",
    loadJobsFailed: "Failed to load jobs for inbox matching",
    loadRunMessagesFailed: "Failed to load messages for selected sync run",
  },
};

export default tracking;
