// Japanese strings: Gmail tracking inbox.
// Must have exactly the same keys and {{placeholders}} as ../en/tracking.ts.
import type en from "../en/tracking";

const tracking: typeof en = {
  page: {
    title: "選考メール",
    subtitle: "応募後に届いたメールの確認",
    heading: "選考メールと求人の照合",
    intro:
      "メールボックスを連携すると関連メールを取り込みます。提案された求人との照合を確認し、承認または却下すると選考の記録が自動で更新されます。",
  },
  notAvailable: "なし",
  controls: {
    title: "メール連携の設定",
    provider: "メールサービス",
    accountKey: "アカウントキー",
    gmailHint:
      "Gmailの連携はGoogle OAuthのポップアップで行い、認証情報はサーバー側に保存されます。リフレッシュトークンを手動で貼り付ける必要はありません。",
    maxMessages: "最大取得件数",
    searchDays: "検索期間（日）",
    connect: "連携する",
    sync: "同期",
    syncing: "同期中…",
    disconnect: "連携を解除",
    pendingReview: "確認待ち:",
    lastSynced: "最終同期: {{date}}",
  },
  connection: {
    unknown: "不明",
    disconnected: "未連携",
    error: "エラー",
    connected: "連携済み",
  },
  queue: {
    title: "確認待ちのメール",
    approveAll: "すべて承認",
    ignoreAll: "すべて無視",
    loading: "メールを読み込み中…",
    emptyTitle: "確認待ちのメールはありません",
    emptyDescription: "同期すると、新しい応募関連メールを取り込みます。",
  },
  runs: {
    title: "最近の同期",
    empty: "同期の記録はまだありません。",
    status: {
      running: "実行中",
      completed: "完了",
      failed: "失敗",
      cancelled: "キャンセル",
    },
    discovered: "取得 {{value}}",
    relevant: "関連 {{value}}",
    matched: "照合済み {{value}}",
  },
  runModal: {
    title: "同期したメール",
    summary:
      "同期 {{id}} • 取得 {{discovered}} • 関連 {{relevant}} • 照合済み {{matched}}",
    description:
      "この同期で取り込んだすべてのメールを、部分一致も含めて確認できます。",
    loading: "同期したメールを読み込み中…",
    empty: "この同期で取り込んだメールはありません。",
  },
  bulkDialog: {
    approveTitle: "すべてのメールを承認しますか？",
    ignoreTitle: "すべてのメールを無視しますか？",
    approveDescription_one:
      "求人の候補がある{{count}}件のメールを承認します。候補がないメールはスキップされます。",
    approveDescription_other:
      "求人の候補がある{{count}}件のメールを承認します。候補がないメールはスキップされます。",
    ignoreDescription_one: "確認待ちの{{count}}件のメールをすべて無視します。",
    ignoreDescription_other:
      "確認待ちの{{count}}件のメールをすべて無視します。",
  },
  viewer: {
    unknownSender: "差出人不明",
    noReliableMatch:
      "関連するメールですが、確実に一致する求人がありません。正しい求人を選択してください。",
    loadingJobs: "求人を読み込み中…",
    selectJob: "求人を選択",
    searchJobs: "求人を検索…",
    noJobsFound: "求人が見つかりません。",
    confirmMatch: "メールと求人の照合を確定",
    ignoreMatch: "この照合を無視",
  },
  errors: {
    oauthTimeout: "Gmail OAuthの応答待ちがタイムアウトしました。",
    oauthWindowClosed: "完了前にGmail OAuthのウィンドウが閉じられました。",
    oauthFailed: "Gmail OAuthに失敗しました: {{error}}",
    oauthNoCode: "Gmail OAuthから認可コードが返されませんでした。",
  },
  toasts: {
    refreshFailed: "選考メールを更新できませんでした",
    providerNotImplemented:
      "{{provider}}の連携はまだ実装されていません。現在はGmailをご利用ください。",
    popupBlocked:
      "ブラウザがGmail OAuthのポップアップをブロックしました。ポップアップを許可して再試行してください。",
    providerConnected: "メールサービスを連携しました",
    invalidSyncSettings:
      "同期する前に、最大取得件数を1〜500、検索期間を1〜365日の範囲で指定してください。",
    syncInProgress: "同期中です。完了まで数分かかる場合があります。",
    syncCompleted: "同期が完了しました",
    providerDisconnected: "メールサービスの連携を解除しました",
    connectFailed: "メールサービスを連携できませんでした",
    syncFailed: "メールを同期できませんでした",
    disconnectFailed: "メールサービスの連携を解除できませんでした",
    selectJobFirst: "判断する前に、応募済みの求人を選択してください。",
    messageLinked: "メールを求人に紐付けました",
    messageIgnored: "メールを無視しました",
    approveMessageFailed: "メールを承認できませんでした",
    denyMessageFailed: "メールを却下できませんでした",
    approveAllSucceeded: "{{succeeded}}件のメールをすべて承認しました",
    ignoreAllSucceeded: "{{succeeded}}件のメールをすべて無視しました",
    approvePartial:
      "{{succeeded}}件のメールを承認し、{{skipped}}件をスキップしました（求人の候補なし）",
    ignorePartial:
      "{{succeeded}}件のメールを無視し、{{skipped}}件をスキップしました（求人の候補なし）",
    approveMixed:
      "承認 {{succeeded}}件、失敗 {{failed}}件、スキップ {{skipped}}件",
    ignoreMixed:
      "無視 {{succeeded}}件、失敗 {{failed}}件、スキップ {{skipped}}件",
    approveMessagesFailed: "メールを承認できませんでした",
    denyMessagesFailed: "メールを却下できませんでした",
    noMatchesToApprove: "承認できる求人の候補があるメールはありません",
    noMessagesToIgnore: "無視するメールはありません",
    loadStatusFailed: "メールサービスの連携状況を読み込めませんでした",
    loadInboxFailed: "メールを読み込めませんでした",
    loadRunsFailed: "同期の記録を読み込めませんでした",
    loadJobsFailed: "照合用の求人を読み込めませんでした",
    loadRunMessagesFailed: "選択した同期のメールを読み込めませんでした",
  },
};

export default tracking;
