// Japanese strings: Settings page and AI/integration configuration panels.
// Must have exactly the same keys and {{placeholders}} as ../en/settings.ts.
import type en from "../en/settings";

const settings: typeof en = {
  page: {
    title: "設定",
    subtitle:
      "AI、スコアリング、外部連携、バックアップをひとつの画面でまとめて設定できます。",
    searchPlaceholder: "設定を検索",
    searchEmpty: "一致する設定はありません",
    unsavedSections_one: "未保存のセクション: {{count}}件",
    unsavedSections_other: "未保存のセクション: {{count}}件",
    discardChanges: "変更を破棄",
    resetToDefaults: "既定値に戻す",
    saving: "保存中...",
    saveChanges: "変更を保存",
    fixErrors: "保存する前に、強調表示されているエラーを修正してください。",
  },
  nav: {
    groups: {
      account: "アカウント",
      ai: "AI",
      scoring: "スコアリング",
      integrations: "外部連携",
      workspaces: "ワークスペースとセキュリティ",
      display: "表示",
      backups: "バックアップ",
      danger: "危険な操作",
    },
    sections: {
      billing: {
        label: "プランとお支払い",
        description:
          "ホスト版のプラン、付属のAI、Stripeのサブスクリプションを管理します。",
      },
      model: {
        label: "モデル",
        description: "プロバイダー、APIの認証情報、タスクごとの個別設定。",
      },
      chat: {
        label: "文体",
        description: "トーン、言語、プリセット、文章の制約。",
      },
      "prompt-templates": {
        label: "プロンプトテンプレート",
        description: "Ghostwriter、最適化、スコアリング用のAIへの基本指示。",
      },
      scoring: {
        label: "ルールとフィルター",
        description:
          "給与記載なしの減点、しきい値、キーワード、スコアリングのヒント。",
      },
      "reactive-resume": {
        label: "Reactive Resume",
        description: "レジュメの同期、テンプレート、プロジェクトの選択。",
      },
      webhooks: {
        label: "Webhook",
        description: "求人検索と応募完了のイベントの送信先。",
      },
      "tracer-links": {
        label: "トレーサーリンク",
        description: "公開URLの準備状況と確認状態。",
      },
      environment: {
        label: "ワークスペースへのアクセス",
        description: "サービスの認証情報とアクセス保護。",
      },
      display: {
        label: "表示の設定",
        description: "スポンサーバッジとMarkdownの表示方法。",
      },
      backup: {
        label: "バックアップ",
        description:
          "自動バックアップのスケジュール、保持数、手動スナップショット。",
      },
      "danger-zone": {
        label: "危険な操作",
        description:
          "求人、検索履歴、またはローカルのデータベース全体を削除します。",
      },
    },
  },
  badges: {
    sensitive: "要注意",
    needsAttention: "要対応",
    unsaved: "未保存",
    configured: "設定済み",
    usingDefaults: "既定値を使用",
    ready: "準備完了",
    customized: "カスタマイズ済み",
    defaultRules: "既定のルール",
    connected: "接続済み",
    optional: "任意",
    checkRequired: "確認が必要",
    notConfigured: "未設定",
    active: "有効",
    scheduled: "自動実行",
    manualOnly: "手動のみ",
  },
  toasts: {
    loadAppStatusFailed: "アプリの状態を読み込めませんでした",
    loadBackupsFailed: "バックアップを読み込めませんでした",
    loadBillingFailed: "お支払い状況を読み込めませんでした",
    openStripeFailed: "Stripeを開けませんでした",
    loadSettingsFailed: "設定を読み込めませんでした",
    loadRxResumeProjectsFailed: "RxResumeのプロジェクトを読み込めませんでした",
    backupCreated: "バックアップを作成しました",
    backupCreateFailed: "バックアップを作成できませんでした",
    confirmDeleteBackup:
      "バックアップ「{{filename}}」を削除しますか？この操作は元に戻せません。",
    backupDeleted: "バックアップを削除しました",
    backupDeleteFailed: "バックアップを削除できませんでした",
    tracerUnavailable:
      "トレーサーリンクを利用できません。公開URLを確認してください。",
    tracerReady: "トレーサーリンクを利用できます",
    tracerVerifyFailed: "トレーサーリンクの準備状況を確認できませんでした",
    rxresumeValidationPassed: "Reactive Resumeの検証に成功しました",
    rxresumeValidationFailed: "Reactive Resumeの検証に失敗しました",
    rxresumeKeyInvalid: "Reactive ResumeのAPIキーが無効です。",
    rxresumeSaveWarning:
      "設定は保存しましたが、インスタンスを利用できないため、JobOpsはReactive Resumeを確認できませんでした。",
    settingsSaved: "設定を保存しました",
    saveFailed: "設定を保存できませんでした",
    databaseCleared: "データベースを消去しました",
    databaseClearedDescription: "{{number}}件の求人を削除しました。",
    clearDatabaseFailed: "データベースを消去できませんでした",
    noStatusesSelected: "ステータスが選択されていません",
    jobsCleared: "求人を削除しました",
    jobsClearedByStatus: "{{number}}件の求人を削除しました: {{details}}",
    statusCount: "{{status}} {{number}}件",
    noJobsFound: "求人が見つかりません",
    noJobsWithStatuses: "選択したステータスの求人は見つかりませんでした",
    clearJobsFailed: "求人を削除できませんでした",
    jobsClearedByScore:
      "スコア{{threshold}}未満の求人を{{number}}件削除しました。応募済みの求人は残しています。",
    noJobsBelowScore: "スコア{{threshold}}未満の求人は見つかりませんでした",
    clearJobsByScoreFailed: "スコアによる求人の削除に失敗しました",
    resetDone: "既定値に戻しました",
    resetFailed: "設定を既定値に戻せませんでした",
    discarded: "未保存の変更を破棄しました",
  },
  shared: {
    effectiveDefault: "適用中: {{effective}} | 既定: {{default}}",
    yes: "はい",
    no: "いいえ",
    enabled: "有効",
    disabled: "無効",
    notSet: "未設定",
    current: "現在:",
    none: "なし",
    listSeparator: "、",
  },
  backup: {
    title: "バックアップ",
    enableLabel: "自動バックアップを有効にする",
    enableHelp:
      "毎日決まった時刻にデータベースのバックアップを自動作成します。この設定に関係なく、手動バックアップはいつでも作成できます。",
    hourLabel: "バックアップ時刻",
    hourHelper:
      "自動バックアップを実行する時刻（0〜23時、UTC）です。既定: {{hour}}:00 UTC。",
    hourCurrent: "適用中: {{effective}}:00 UTC | 既定: {{default}}:00 UTC",
    maxCountLabel: "保持するバックアップ数",
    maxCountHelper:
      "保持する自動バックアップの最大数（1〜5）です。古いバックアップは自動的に削除されます。既定: {{value}}。",
    nextScheduled: "次回のバックアップ予定: {{date}}",
    history: "バックアップ履歴",
    creating: "作成中...",
    createNow: "今すぐバックアップを作成",
    count_one: "{{count}}件のバックアップ",
    count_other: "{{count}}件のバックアップ",
    emptyTitle: "バックアップはまだありません",
    emptyDescription: "最初のバックアップを作成してデータを保護しましょう。",
    typeAuto: "自動",
    typeManual: "手動",
    enabled: "有効",
    hour: "時刻",
    maxCount: "最大数",
  },
  billing: {
    title: "お支払い",
    usage: {
      job_search: "求人サイト検索",
      pipeline_run: "求人検索の実行",
      tailoring: "AI処理",
      ghostwriter: "Ghostwriterの生成",
      pdf_export: "PDF出力",
    },
    usageCount: "{{used}} / {{limit}}",
    usageAria: "{{label}}の利用状況",
    usageValueText: "{{limit}}中{{used}}を使用",
    planPro: "Pro",
    planFree: "無料",
    currentPlan: "現在のプラン",
    proIncludedAi: "AI込みで、ホスト版の月間上限が高いプランです。",
    proOwnAi:
      "ホスト版の月間上限が高いプランです。ご自身のAIプロバイダーを接続してください。",
    freeIncludedAi:
      "AI込みで、ホスト版の月間上限は低めです。アップグレードすると上限が上がります。",
    freeOwnAi:
      "ご自身のAIプロバイダーを接続してください。アップグレードするとホスト版の月間上限が上がります。",
    perMonth: "/ 月",
    activeUntil: "Proプランは{{date}}までご利用いただけます。",
    activeUntilPeriodEnd:
      "Proプランは現在の請求期間が終わるまでご利用いただけます。",
    openingStripe: "Stripeを開いています…",
    manage: "サブスクリプションを管理",
    upgrade: "Proにアップグレード",
    monthlyUsage: "今月の利用状況",
    resetsMonthly: "毎月リセット",
    quotasDisabled: "このワークスペースでは利用上限が設定されていません。",
  },
  chat: {
    title: "文体と言語",
    intro:
      "ここで設定した既定値は、Ghostwriterとレジュメの最適化でAIが生成する文章に反映されます。",
    presetLabel: "プリセット",
    presetPlaceholder: "文体のプリセットを選択",
    presetCustom: "カスタム",
    presetCustomDescription: "現在の値はカスタム設定です。",
    presets: {
      professional: {
        label: "プロフェッショナル",
        description:
          "洗練された、応募にそのまま使える文章向けのバランスの取れた既定値です。",
      },
      concise: {
        label: "簡潔",
        description: "回答をコンパクトにまとめ、ひと目で読みやすくします。",
      },
      direct: {
        label: "率直",
        description: "あいまいな表現を避け、明快に言い切る表現を使います。",
      },
      friendly: {
        label: "親しみやすい",
        description: "プロらしさを保ちつつ、温かく親しみやすい文章にします。",
      },
    },
    stopSlopLabel: "GhostwriterでStop Slopを使う",
    stopSlopHelp:
      "Ghostwriter専用の追加指示を適用し、冗長な言い回し、AIらしい定型表現、受動態、あいまいな主張、ダッシュ（—）を取り除きます。",
    outputLanguage: "出力言語",
    outputLanguagePlaceholder: "出力言語を選択",
    outputLanguageHelp: "AIが出力言語を決める方法を選びます。",
    languageModes: {
      manual: "言語を指定する",
      "match-resume": "現在のレジュメの言語に合わせる",
      "match-job-description": "求人内容の言語に合わせる",
    },
    specificLanguage: "指定する言語",
    specificLanguagePlaceholder: "言語を選択",
    specificLanguageHelp:
      "出力言語を「言語を指定する」に設定した場合に使われます。",
    languages: {
      english: "英語",
      german: "ドイツ語",
      french: "フランス語",
      spanish: "スペイン語",
      japanese: "日本語",
    },
    tone: "トーン",
    tonePlaceholder: "トーンを選択",
    tones: {
      professional: "プロフェッショナル",
      concise: "簡潔",
      direct: "率直",
      friendly: "親しみやすい",
    },
    formality: "フォーマル度",
    formalityPlaceholder: "フォーマル度を選択",
    formalities: {
      low: "低",
      medium: "中",
      high: "高",
    },
    constraints: "制約",
    constraintsPlaceholder: "例: 回答は120語以内にまとめ、箇条書きを含める",
    constraintsHelp:
      "Ghostwriterの返答とレジュメの最適化に共通して適用される文章の制約です（任意）。",
    doNotUse: "使用しない語句",
    doNotUsePlaceholder: "例: 「シナジー」「レバレッジ」",
    doNotUseHelp:
      "AIが文章を生成するときに避けるべき語句です（任意）。モデルへの指示であり、確実に除外されるとは限りません。",
    doNotUseRemove: "使用しない語句を削除",
    languageMode: "言語モード",
    stopSlop: "Stop Slop",
    summaryMaxWords: "要約の最大語数",
    summaryMaxWordsHelp:
      "AIが生成する要約の語数を制限します。「制約」で指定した語数の制限より優先されます。",
    maxKeywords: "スキルごとの最大キーワード数",
    maxKeywordsHelp:
      "スキルカテゴリごとのキーワード数の上限です。「制約」で指定したキーワード数の制限より優先されます。",
    noLimit: "制限なし",
    rangeError: "{{min}}〜{{max}}の範囲で入力してください",
  },
  connected: {
    removed: "連携アカウントを解除しました",
    removeFailed: "連携アカウントの解除に失敗しました",
    passwordUpdated: "パスワードを更新しました",
    passwordUpdateFailed: "パスワードの更新に失敗しました",
    connectFailed: "{{provider}}との連携に失敗しました",
    passwordTooShort: "パスワードは{{min}}文字以上にしてください。",
    passwordMismatch: "新しいパスワードが一致しません。",
    title: "連携アカウント",
    intro:
      "JobOpsのパスワードの代わりに、IDプロバイダーのアカウントでサインインできます。",
    noEmail: "メールアドレスなし",
    identityMeta: "{{account}} · {{date}}に連携",
    unlink: "連携解除",
    unlinkTitle: "{{provider}}との連携を解除しますか？",
    unlinkDescription:
      "この{{provider}}アカウントではJobOpsにサインインできなくなります。",
    unlinkConfirm: "連携を解除",
    none: "まだ連携しているアカウントはありません。",
    connect: "{{provider}}と連携",
    passwordTitle: "アカウントのパスワード",
    noPassword:
      "このアカウントにはまだパスワードが設定されていません。予備のサインイン方法として設定しておきましょう。",
    currentPassword: "現在のパスワード",
    currentPasswordPlaceholder: "現在のパスワードを入力",
    newPassword: "新しいパスワード",
    newPasswordPlaceholder: "新しいパスワードを入力",
    confirmPassword: "新しいパスワード（確認）",
    confirmPasswordPlaceholder: "新しいパスワードをもう一度入力",
    changePassword: "パスワードを変更",
    setPassword: "パスワードを設定",
  },
  danger: {
    title: "危険な操作",
    statusNames: {
      discovered: "新着",
      processing: "処理中",
      ready: "応募準備完了",
      applied: "応募済み",
      in_progress: "選考中",
      skipped: "スキップ",
      expired: "掲載終了",
    },
    statusDescriptions: {
      discovered: "取得済みで未処理の求人",
      processing: "レジュメを生成中の求人",
      ready: "PDF作成済みで応募待ちの求人",
      applied: "応募を送信した求人",
      in_progress: "応募後の選考に進んだ求人",
      skipped: "スキップした求人",
      expired: "締め切りを過ぎた求人",
    },
    byStatusTitle: "ステータスで求人を削除",
    byStatusHelp: "削除する求人のステータスを選択してください。",
    clearSelected: "選択したステータスを削除（{{number}}）",
    byStatusConfirmTitle: "ステータスで求人を削除しますか？",
    byStatusConfirmDescription:
      "次のステータスの求人をすべて削除します: {{statuses}}。この操作は元に戻せません。",
    clearStatuses_one: "{{count}}件のステータスを削除",
    clearStatuses_other: "{{count}}件のステータスを削除",
    byScoreTitle: "スコアが低い求人を削除",
    byScoreHelp:
      "マッチ度スコアが指定したしきい値を下回る求人をすべて削除します。応募済みの求人は削除されません。",
    thresholdLabel: "スコアのしきい値（0〜100）",
    thresholdPlaceholder: "しきい値を入力",
    clearBelow: "{{threshold}}未満を削除",
    byScoreConfirmTitle: "スコア{{threshold}}未満の求人を削除しますか？",
    byScoreConfirmDescription:
      "マッチ度スコアが{{threshold}}未満の求人をすべて完全に削除します。応募済みの求人は残ります。この操作は元に戻せません。",
    clearJobs: "求人を削除",
    databaseTitle: "データベースを全消去",
    databaseHelp: "データベースからすべての求人と求人検索の履歴を削除します。",
    clearDatabaseButton: "データベースを消去",
    databaseConfirmTitle: "すべての求人を削除しますか？",
    databaseConfirmDescription:
      "データベースからすべての求人と求人検索の履歴を削除します。この操作は元に戻せません。",
    clearDatabaseConfirm: "データベースを消去",
  },
  display: {
    title: "表示設定",
    sponsorLabel: "ビザスポンサー情報を表示",
    sponsorHelp:
      "企業名の横に、英国のビザスポンサーリストとの一致率を示すバッジを表示します。就労ビザのスポンサー資格を持つ企業を見分けるのに役立ちます。",
    markdownLabel: "求人内容のMarkdownを整形して表示",
    markdownHelp:
      "求人内容の全文を開いたときに、見出し・太字・リスト・コードブロックを整形して表示します。元のテキストのまま表示したい場合はオフにしてください。",
    autoTailorLabel: "手動で取り込んだ求人を自動で最適化",
    autoTailorHelp:
      "有効にすると、手動取り込みで追加した求人はすぐにスコアリングされ、最適化したレジュメのPDFが生成されます。LLMのトークンを節約したい場合はオフにして、後から求人の詳細画面で最適化できます。取り込みごとに確認ステップで変更することもできます。",
    sponsorEffective: "スポンサー情報（適用中）",
    sponsorDefault: "スポンサー情報（既定）",
    markdownEffective: "Markdown表示（適用中）",
    markdownDefault: "Markdown表示（既定）",
    autoTailorEffective: "取り込み時の自動最適化（適用中）",
    autoTailorDefault: "取り込み時の自動最適化（既定）",
    stageStyleLabel: "選考ステップの表示",
    stageStyleHelp:
      "選考ボード、求人のタイムライン、「イベントを記録」で使うステップ名です。「日本の選考フロー」では 書類選考 → 適性検査 → 一次面接 → 二次面接 → 最終面接 → 内定 と表示します。登録済みの求人の選考状況はそのまま変わりません。",
    stageStyles: {
      standard: "標準",
      japanese: "日本の選考フロー",
    },
    stageStyleSaveFailed: "選考ステップの表示を変更できませんでした。",
  },
  environment: {
    title: "環境とワークスペース",
    userCreated: "ユーザーを作成しました",
    userCreateFailed: "ユーザーの作成に失敗しました",
    userUpdated: "ユーザーを更新しました",
    userUpdateFailed: "ユーザーの更新に失敗しました",
    passwordReset: "パスワードをリセットしました",
    passwordResetFailed: "パスワードのリセットに失敗しました",
    workspace: "ワークスペース",
    signedInAs: "{{user}}としてサインインしています。",
    aWorkspaceUser: "ワークスペースのユーザー",
    usersTitle: "ワークスペースのユーザー",
    usersIntro:
      "各ユーザーには、求人と設定が分離された専用のワークスペースが用意されます。",
    namePlaceholder: "名前",
    usernamePlaceholder: "ユーザー名",
    tempPasswordPlaceholder: "仮パスワード",
    create: "作成",
    systemAdmin: "システム管理者",
    newPasswordPlaceholder: "新しいパスワード",
    enable: "有効にする",
    disable: "無効にする",
    noUsers: "ユーザーが見つかりません。",
    serviceAccounts: "サービスアカウント",
    email: "メールアドレス",
    password: "パスワード",
    passwordPlaceholder: "新しいパスワードを入力",
    appId: "アプリID",
    appKey: "アプリキー",
    appKeyPlaceholder: "新しいアプリキーを入力",
    security: "セキュリティ",
  },
  model: {
    title: "モデル",
  },
  rxresume: {
    precheckMissingApiKey:
      "APIキーを追加してから、もう一度テストしてください。",
    missingApiKeyLabel: "RxResumeのAPIキー",
    validationFailed: "RxResumeの検証に失敗しました",
    saveFailed: "RxResumeの設定を保存できませんでした",
    statusConnected: "接続済み",
    statusFailed: "失敗",
    statusNotTested: "未テスト",
    statusPill: "{{label}}: {{status}}",
    v5Status: "v5の状態",
    renderers: {
      rxresume: "RxResumeでエクスポート",
      latex: "ローカルLaTeX（Jakeテンプレート）",
      typst: "ローカルTypst",
    },
    rendererHelp: {
      rxresume:
        "RxResumeでのエクスポートでは、最終的なPDFの作成にRxResume側の印刷・エクスポート用エンドポイントを使用します。",
      latex:
        "LaTeXはJakeのテンプレートを使ってPDFをローカルで作成します。JobOpsのホストにtectonicが必要です。",
      typst: "TypstはPDFをローカルで作成し、レジュメのテーマを選択できます。",
    },
    paperSizes: {
      auto: "レンダラーの既定",
      a4: "A4",
      letter: "USレター",
    },
    paperDefaultHelp: {
      rxresume:
        "「レンダラーの既定」では、レジュメ自体に保存されたページ形式を使います。フリーフォームのレジュメは常にページ区切りなしで出力されます。",
      latex: "LaTeXテンプレートの「レンダラーの既定」はUSレターです。",
      typst: "Typstテーマの「レンダラーの既定」はA4です。",
    },
    pdfRenderer: "PDFレンダラー",
    pdfRendererPlaceholder: "PDFレンダラーを選択",
    typstTheme: "Typstテーマ",
    typstThemePlaceholder: "Typstテーマを選択",
    typstThemeHelp:
      "「クラシック」は現在のレジュメと同程度の密度で、「コンパクト」は1ページにより多くの内容を収めます。",
    paperSize: "用紙サイズ",
    paperSizePlaceholder: "用紙サイズを選択",
    apiWarning: "Reactive Resume APIの警告",
    apiError: "Reactive Resume APIのエラー",
    urlLabel: "RxResumeのURL",
    urlHelper:
      "空欄の場合は、選択したモードの既定値（RXRESUME_URL環境変数が設定されていればその値）を使用します。",
    apiKeyLabel: "v5 APIキー",
    apiKeyPlaceholder: "v5 APIキーを入力",
    noProjects:
      "レジュメのプロジェクトが見つかりません。プロジェクトを自動で選ぶには、使用中のレジュメにプロジェクトを追加してください。",
    loadingProjects: "レジュメのプロジェクトを読み込み中...",
    choosePdf: "PDFを選択すると、レジュメのプロジェクトを設定できます。",
    maxProjects: "選択するプロジェクトの最大数",
    project: "プロジェクト",
    visibleInTemplate: "テンプレートで表示",
    mustInclude: "必ず含める",
    aiCanSelect: "AIが選択可",
  },
  codex: {
    loadStatusFailed: "Codexのサインイン状態を読み込めませんでした。",
    startFailed: "Codexのサインインを開始できませんでした。",
    copyUnavailable: "このブラウザではコピーを利用できません。",
    copyFailed: "コードをコピーできませんでした。",
    disconnectFailed: "Codexの接続を解除できませんでした。",
    title: "Codexサインイン",
    authenticated: "認証済み",
    connected:
      "<strong>接続済み</strong>です。この実行環境で既存のCodex認証情報が見つかりました。",
    connectedAs:
      "{{username}}として<strong>接続済み</strong>です。この実行環境で既存のCodex認証情報が見つかりました。",
    disconnecting: "接続を解除中...",
    disconnect: "接続を解除",
    waiting: "承認待ち",
    intro:
      "サインインを開始するとワンタイムコードが発行されます。ブラウザで承認したら<strong>状態を確認</strong>をクリックしてください。<anchor>詳しく見る</anchor>",
    stepStart: "サインインを開始",
    stepCopy: "コードをコピーして確認ページを開く",
    stepApprove: "承認してJobOpsに戻る",
    oneTimeCode: "ワンタイムコード",
    copyCode: "コードをコピー",
    openVerification: "確認ページを開く",
    expiresIn: "コードの有効期限まで残り{{time}}",
    checking: "確認中...",
    checkStatus: "状態を確認",
    starting: "開始中...",
    startNew: "サインインをやり直す",
    start: "サインインを開始",
  },
  cliHints: {
    authGuide: "認証ガイド",
    claude: {
      title: "このマシン上のClaude CLI",
      setup:
        "<npm>@anthropic-ai/claude-code</npm>をインストールし、ターミナルで<code>claude setup-token</code>を実行して（Claude Pro、Max、Team、Enterpriseのいずれかのサブスクリプションが必要です）、表示された値を<code>CLAUDE_CODE_OAUTH_TOKEN</code>に設定してください。代わりに<code>ANTHROPIC_API_KEY</code>を設定することもできます。JobOpsはCLIをヘッドレスモードで起動してその認証を再利用するため、JobOpsのAPIキー欄はありません。",
      docker:
        "。Dockerでは、<code>.env</code>ファイルに<code>CLAUDE_CODE_OAUTH_TOKEN</code>（または<code>ANTHROPIC_API_KEY</code>）を設定してください。認証情報ファイルのマウントは不要です。任意: <code>CLAUDE_CLI_BIN</code>でバイナリのパスを変更できます。",
    },
    gemini: {
      title: "このマシン上のGemini CLI",
      setup:
        "<npm>@google/gemini-cli</npm>をインストールし、ターミナルで<code>gemini</code>を実行してGoogleへのサインイン（OAuth）を完了するか、CLI用に<code>GEMINI_API_KEY</code>を設定してください。JobOpsはCLIをヘッドレスモードで起動してその認証情報を再利用するため、JobOpsのAPIキー欄はありません。",
      docker:
        "。Dockerでは、CLIの設定（例: <code>~/.gemini</code>）をコンテナにマウントするか、<code>docker compose exec</code>経由で<code>gemini</code>を実行してください。任意: <code>GEMINI_CLI_BIN</code>でバイナリのパスを変更でき、<code>GEMINI_CLI_TRUST_WORKSPACE=true</code>で<code>--skip-trust</code>を省略できます。",
    },
  },
  llm: {
    providers: {
      openaiCompatible: "OpenAI互換",
    },
    providerHints: {
      atlascloud:
        "Atlas Cloudでは、1つのAPIキーでホスト型のテキストモデルにOpenAI互換の方式でアクセスできます。",
      litellm:
        "LiteLLMはセルフホスト型のAIゲートウェイです。1つのエンドポイントで100以上のプロバイダー（OpenAI、Anthropic、Gemini、Bedrock、Azure、Vertex AI、Ollama）を利用でき、仮想キー、予算管理、フォールバックにも対応しています。",
      openrouter:
        "OpenRouterはお持ちのAPIキーを使い、複数のプロバイダーにまたがるモデルのルーティングに対応しています。",
      orcarouter:
        "OrcaRouterはお持ちのAPIキーを使い、OpenAI互換のエンドポイントを通じてリクエストを複数のプロバイダーに振り分けます。アダプティブルーティングとガードレールにも対応しています。",
      requesty:
        "Requestyはお持ちのAPIキーを使い、OpenAI互換のエンドポイントを通じてリクエストを複数のプロバイダーに振り分けます。",
      api_route:
        "API Routeはお持ちのAPIキーとOpenAI互換のエンドポイントを使用します。キーで利用できるモデルIDを正確に選択してください。",
      lmstudio:
        "LM Studioは、OpenAI互換のサーバーを通じてローカルで動作します。",
      ollama:
        "Ollamaは通常ローカルで動作します。APIキーは、Bearer認証で保護されたOllama互換のエンドポイントを使う場合にのみ追加してください。",
      openai: "OpenAIでは、構造化出力に対応したResponses APIを使用します。",
      anthropic:
        "Claudeでは、お持ちのAnthropic APIキーでAnthropic純正のMessages APIを使用します。",
      openai_compatible:
        "Chat Completions互換の任意のエンドポイントに、Bearerトークンを使って接続します。",
      glm: "GLMでは、お持ちのAPIキーでZ.AIのChat Completions API（OpenAI互換）を使用します。",
      gemini: "GeminiではAI Studio純正のAPIを使用するため、キーが必要です。",
      gemini_cli:
        "Gemini (CLI)は、このホスト上で公式のGoogle Gemini CLIを実行し、OAuthセッションまたはCLIのAPIキーを使用します。JobOpsのLLMキーは不要です。",
      claude_cli:
        "Claude (CLI)は、このホスト上で公式のClaude Code CLIを実行し、サブスクリプションのトークンまたはAPIキーを使用します。JobOpsのLLMキーは不要です。",
      codex:
        "Codexはローカルのapp-serverプロセスを通じて動作し、Codexのログインセッションを使用します。",
    },
    keyHelpers: {
      atlascloud: "atlascloud.aiでキーを作成できます",
      litellm: "LiteLLMプロキシが発行する仮想キー（任意）",
      openrouter: "openrouter.aiでキーを作成できます",
      orcarouter: "orcarouter.ai/consoleでキーを作成できます",
      requesty: "app.requesty.ai/api-keysでキーを作成できます",
      api_route: "api-route.com/api-keysでキーを作成できます",
      lmstudio: "LM StudioではAPIキーは不要です",
      ollama: "認証が必要なOllama互換エンドポイント用のBearerトークン（任意）",
      openai: "platform.openai.comでキーを作成できます",
      anthropic: "platform.claude.comでキーを作成できます",
      openai_compatible: "互換プロバイダーが発行したBearerトークンを使用します",
      glm: "z.aiでキーを作成できます",
      gemini: "aistudio.google.com/api-keysでキーを作成できます",
      gemini_cli:
        "Gemini CLIで認証してください（gemini login / OAuth）。詳しくは下のドキュメントのリンクをご覧ください",
      claude_cli:
        "Claude CLIで認証してください（claude setup-token）。詳しくは下のドキュメントのリンクをご覧ください",
      codex: "Codexがローカルで認証済みならAPIキーは不要です",
    },
    baseUrlHelpers: {
      openaiCompatible:
        "ベースURL、または/v1/chat/completionsまでの完全なエンドポイントを入力してください。",
      litellm:
        "既定: http://localhost:4000。Docker Desktopからはhttp://host.docker.internal:4000を使用してください。両方を同じComposeプロジェクトで動かしている場合は、プロキシのサービス名を使用します。",
      ollama:
        "既定: http://localhost:11434。Docker Desktopからはhttp://host.docker.internal:11434を使用してください。LinuxのDockerでは、http://172.17.0.1:11434 など、コンテナから到達できるホストゲートウェイを使用してください。",
      default: "既定: {{url}}",
    },
    keepSavedKey: "。保存済みのキーをそのまま使う場合は空欄にしてください。",
    purposes: {
      scoring: {
        label: "スコアリング",
        description: "求人とのマッチ度判定、概要の抽出、順位付け。",
      },
      tailoring: {
        label: "最適化",
        description: "Ghostwriterとレジュメ内容の最適化。",
      },
      projectSelection: {
        label: "プロジェクト選択",
        description: "求人に合わせたレジュメのプロジェクト選び。",
      },
    },
    loadModelsFailed: "モデルの読み込みに失敗しました。",
    apiKey: "APIキー",
    llmApiKey: "LLMのAPIキー",
    apiKeyOptional: "APIキー（任意）",
    llmApiKeyOptional: "LLMのAPIキー（任意）",
    notRequired: "不要",
    modelHelper: {
      addKey:
        "利用可能なモデルを読み込むには、{{provider}}のAPIキーを入力または保存してください。",
      loading: "利用可能なモデルを読み込み中...",
      choose: "利用可能なテキスト生成モデルから選択してください。",
      noOllamaModels:
        "Ollamaのモデルが見つかりませんでした。Ollamaでモデルをpullしてから、ここで選択して続行してください。",
      noModels: "テキスト生成モデルが見つかりませんでした。",
      codex:
        "モデル名を正確に手入力するか、空欄のままにして{{provider}}の既定モデルを使用してください。<anchor>使用するモデル名を確認する</anchor>。",
      manual:
        "モデル名を正確に手入力するか、空欄のままにして{{provider}}の既定モデルを使用してください。",
    },
    selectProviderModel: "{{provider}}のモデルを選択",
    useProviderDefault: "{{provider}}の既定を使用",
    inheritDefaultModel: "既定のモデルを引き継ぐ",
    llmProviderHeading: "LLMプロバイダー",
    provider: "プロバイダー",
    selectProvider: "プロバイダーを選択",
    providerUsage:
      "スコアリング、最適化、Ghostwriterでの文章作成、メールの分類に使用されます。",
    baseUrl: "ベースURL",
    llmBaseUrl: "LLMのベースURL",
    pasteNewKey: "新しいキーを貼り付け",
    enterNewKey: "新しいキーを入力",
    optionalBearer: "Bearerトークン（任意）",
    noKeyRequired: "このプロバイダーではAPIキーは不要です。",
    defaultModel: "既定のモデル",
    selectModel: "モデルを選択",
    purposeOverrides: "用途別のモデル設定",
    scoringModelLabel: "スコアリング用モデル",
    tailoringModelLabel: "最適化用モデル",
    projectSelectionModelLabel: "プロジェクト選択用モデル",
    resolvedConfig: "適用される設定",
    scoringModel: "スコアリング用モデル",
    tailoringModel: "最適化用モデル",
    projectSelection: "プロジェクト選択",
    inherits: "引き継ぎ",
    inheritsValue: "{{value}}を引き継ぎ",
    inheritPurposeDefault: "用途の既定を引き継ぐ",
    purposeModelHelperDefault: "空欄のままにすると用途の既定を引き継ぎます。",
    purposeModelHelperManual:
      "モデル名を正確に入力するか、空欄のままにして{{provider}}の既定を使用してください。",
    inheritDefault: "既定を引き継ぐ",
    pastePurposeKey: "用途別のキーを貼り付け",
    model: "モデル",
    inheritModel: "モデルを引き継ぐ",
    searchModels: "モデルを検索...",
    noModelsFound: "モデルが見つかりません。",
  },
  tracer: {
    title: "トレーサーリンク",
    checking: "確認中",
    notConfigured: "未設定",
    stale: "要再確認",
    ready: "利用可能",
    unavailable: "利用不可",
    never: "未確認",
    readiness: "利用準備の状態",
    publicUrl: "公開URL",
    lastChecked: "最終確認: {{time}}",
    hint: "求人ごとのトレーサーリンクは、状態が「利用可能」のときだけ有効にしてください。",
    verifyNow: "今すぐ確認",
  },
  webhooks: {
    title: "Webhook",
    pipelineStatus: "求人検索のステータス",
    url: "Webhook URL",
    pipelineHelper:
      "設定すると、求人検索の完了時・失敗時にサーバーがPOSTリクエストを送信します。既定: {{value}}。",
    jobCompletion: "応募完了",
    jobCompleteHelper:
      "設定すると、求人を応募済みにしたときにサーバーがPOSTリクエストを送信します（求人内容を含みます）。既定: {{value}}。",
    secret: "Webhookシークレット",
    secretPlaceholder: "新しいシークレットを入力",
    secretHelper: "Webhookに送信されるシークレット（Bearerトークン）",
  },
  scoring: {
    title: "スコアリング設定",
    penalizeLabel: "給与の記載がない求人を減点",
    penalizeHelp:
      "給与情報が記載されていない求人のマッチ度スコアを下げます。給与について何らかの記載がある求人（「応相談」なども含む）は減点されません。",
    penaltyLabel: "減点幅",
    penaltyHelper:
      "マッチ度スコアから差し引くポイント（0〜100）です。既定: {{value}}。",
    autoSkipLabel: "自動スキップのスコアしきい値",
    autoSkipHelp:
      "スコアがこのしきい値を下回る求人は、スコアリング時に自動でスキップされます。空欄にすると自動スキップは無効になります。（0〜100）",
    blockedLabel: "除外する企業キーワード",
    blockedPlaceholder: "例: 「人材紹介」「派遣」",
    blockedHelp:
      "企業名にこれらのキーワードのいずれかを含む求人は、求人の取得時に除外されます。",
    blockedRemove: "除外キーワードを削除",
    penaltyEnabled: "減点の有効化",
    autoSkipThreshold: "自動スキップのしきい値",
  },
  baseResume: {
    title: "テンプレートのレジュメ",
    fetchFailed: "レジュメの取得に失敗しました",
    selectPlaceholder: "テンプレートのレジュメを選択...",
    noneFoundPlaceholder: "レジュメが見つかりません",
    noneFoundHint:
      "アカウントにレジュメが見つかりません。先に<anchor>Reactive Resumeのサイト</anchor>でレジュメを作成してください。",
  },
  prompts: {
    title: "プロンプトテンプレート",
    intro:
      "Ghostwriter、レジュメの最適化、スコアリングで使われるAIへの基本指示を編集します。",
    warningTitle: "上級者向けの設定",
    warningBody:
      "テンプレートを変更すると、AIの動作が悪化したり正しく動かなくなったりすることがあります。重要な指示やプレースホルダーを削除すると、結果の質が下がる可能性があります。既定のテンプレートに戻すにはリセットを使ってください。",
    resetAll: "すべてのプロンプトをリセット",
    supportedPlaceholders: "使用できるプレースホルダー",
    templates: {
      ghostwriterSystemPromptTemplate: {
        label: "Ghostwriterのシステムプロンプト",
        description:
          "求人とプロフィールの情報が追加される前の、Ghostwriterの基本的な振る舞いを制御します。",
      },
      tailoringPromptTemplate: {
        label: "レジュメ最適化のプロンプト",
        description:
          "求人ごとのレジュメで、要約・見出し・スキルをどのように生成するかを制御します。",
      },
      scoringPromptTemplate: {
        label: "求人スコアリングのプロンプト",
        description:
          "マッチ度のスコアリングで候補者のプロフィールをどう評価するかを制御します。圧縮した求人のJSONと出力形式の指定は自動で追加されます。",
      },
    },
  },
};

export default settings;
