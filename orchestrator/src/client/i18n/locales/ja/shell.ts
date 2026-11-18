// Japanese strings: app frame: header, navigation, sign-in, error and offline pages.
// Must have exactly the same keys and {{placeholders}} as ../en/shell.ts.
import type en from "../en/shell";

const shell: typeof en = {
  header: {
    openNavigation: "ナビゲーションメニューを開く",
    account: "アカウント",
    remembered: "保存済みのユーザー",
    rememberedEmpty: "一度サインインすると、ここにユーザー名が保存されます。",
    signOut: "サインアウト",
    version: "バージョン {{version}}",
    updateAvailable: "アップデートがあります",
    documentation: "ドキュメント",
  },
  nav: {
    overview: "概要",
    jobs: "求人",
    inProgress: "選考中",
    resumeStudio: "レジュメスタジオ",
    trackingInbox: "選考メール",
    tracerLinks: "トレーサーリンク",
    visaSponsors: "ビザスポンサー",
    watchlist: "ウォッチリスト",
    settings: "設定",
  },
  scoreMeter: {
    notScored: "未評価",
  },
  status: {
    tracerOn: "トレーサー オン",
    tracerOff: "トレーサー オフ",
    unknown: "不明",
  },
  signIn: {
    signIn: "サインイン",
    createAccount: "アカウントを作成",
    signInDescription: "JobOps のユーザー名とパスワードを入力してください。",
    signupDescription:
      "このホスト型ワークスペースで使う JobOps アカウントを作成します。",
    rememberedUsers: "このブラウザに保存済み",
    nameLabel: "名前",
    namePlaceholder: "お名前",
    usernameLabel: "ユーザー名",
    usernamePlaceholder: "ユーザー名を入力",
    passwordLabel: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    signingIn: "サインイン中…",
    creatingAccount: "アカウントを作成中…",
    orContinueWith: "または次の方法で続行",
    continueWith: "{{provider}} で続行",
    loadStatusFailed: "サインイン状態を読み込めませんでした。",
    missingCredentials: "ユーザー名とパスワードを入力してください。",
    passwordTooShort: "パスワードは8文字以上にしてください。",
    signInFailed: "サインインできませんでした",
    ssoFailed: "{{provider}} で続行できませんでした",
  },
  sso: {
    invalidFlow: "このサインインリンクは無効になっています。",
    providerRefused:
      "ID プロバイダーにサインインを拒否されました。もう一度お試しいただくか、管理者にプロバイダーの設定を確認するよう依頼してください。",
    linkAdded: "連携アカウントを追加しました。",
    finishFailed: "シングルサインオンを完了できませんでした。",
    failedTitle: "サインインに失敗しました",
    finishingTitle: "サインインを完了しています…",
    failedDescription:
      "JobOps は ID プロバイダーからの引き継ぎを完了できませんでした。",
    finishingDescription: "ID プロバイダーからの引き継ぎを完了しています。",
    backToSignIn: "サインインに戻る",
  },
  offline: {
    title: "オフラインのようです",
    checkConnection: "インターネット接続を確認して、もう一度お試しください。",
    autoRedirect: "接続が回復すると、このページから自動的に移動します。",
    tryAgain: "再試行",
  },
  gmailCallback: {
    title: "Gmail との連携を完了しています…",
    closeHint: "自動で閉じない場合は、このウィンドウを閉じてください。",
  },
  crash: {
    title: "問題が発生しました",
    description:
      "JobOps で予期しないエラーが発生しました。データは保持されているはずです。アプリを再読み込みするか、下の診断情報を添えて GitHub で issue を作成してください。",
    reload: "アプリを再読み込み",
    goHome: "ホームに戻る",
    openIssue: "GitHub で issue を作成",
    technicalDetails: "技術的な詳細",
  },
  confirmDelete: {
    title: "本当に削除しますか？",
    description:
      "この操作は元に戻せません。このイベントはタイムラインから完全に削除されます。",
  },
  postingAge: {
    justNow: "たった今",
    minutesAgo: "{{value}}分前",
    hoursAgo: "{{value}}時間前",
    today: "今日",
    yesterday: "昨日",
    daysAgo: "{{value}}日前",
    weeksAgo: "{{value}}週間前",
    monthsAgo: "{{value}}か月前",
    yearsAgo: "{{value}}年前",
    posted: "掲載：{{label}}",
    sourceReported: "求人サイトの表記：{{raw}}",
    sourcePostingDate: "求人サイトでの掲載日：{{date}}",
  },
  ui: {
    searchPlaceholder: "検索…",
    noResults: "該当する結果がありません。",
  },
  hooks: {
    rescore: {
      success: "マッチ度を再計算しました",
      failed: "マッチ度を再計算できませんでした",
    },
    resumeStudio: {
      pdfRefresh: "応募準備完了の求人の PDF は自動的に更新されます。",
      pictureNeedsPublicUrl:
        "写真を使うには、JobOps に公開 URL からアクセスできる必要があります。",
      updatedElsewhere:
        "レジュメスタジオが別の場所で更新されました。ここでの編集内容は保持され、再保存されました。",
      saveFailed: "レジュメスタジオを保存できませんでした。",
      stillSaving:
        "レジュメスタジオを保存中です。しばらくしてからもう一度お試しください。",
      imported: "レジュメを取り込みました。",
      importFailed: "レジュメを取り込めませんでした。",
      encodeFailed: "アップロード用にレジュメファイルを変換できませんでした。",
      importedFile: "レジュメファイルを取り込みました。",
      importFileFailed: "レジュメファイルを取り込めませんでした。",
      exported: "レジュメの JSON をエクスポートしました。",
      exportFailed: "レジュメスタジオをエクスポートできませんでした。",
      pdfReady: "PDF の準備ができました。",
      pdfFailed: "PDF を生成できませんでした。",
      pictureUploaded: "写真をアップロードしました。",
      pictureUploadFailed: "写真をアップロードできませんでした。",
      pictureRemoved: "写真を削除しました。",
      pictureDeleteFailed: "写真を削除できませんでした。",
      rendererActive: "{{renderer}} を有効にしました。",
      rendererFailed: "レジュメのテンプレートを更新できませんでした。",
      themeActive: "Typst テーマ「{{theme}}」を有効にしました。",
      themeFailed: "Typst テーマを更新できませんでした。",
      badges: {
        ready: "入力済み",
        empty: "未入力",
        uploaded: "アップロード済み",
        optional: "任意",
      },
    },
  },
};

export default shell;
