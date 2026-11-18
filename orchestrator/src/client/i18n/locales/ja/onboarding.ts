// Japanese strings: onboarding flow.
// Must have exactly the same keys and {{placeholders}} as ../en/onboarding.ts.
import type en from "../en/onboarding";

const onboarding: typeof en = {
  loading: {
    preparing: "ワークスペースを準備しています…",
    checkFailed:
      "ワークスペースの設定を確認できませんでした。ページを再読み込みして、もう一度お試しください。",
    loadingSetup: "設定を読み込んでいます…",
  },
  header: {
    title: "Job Ops の初期設定",
    subtitle:
      "3つの項目を選ぶだけで始められます。検索キーワードは最初の求人検索のときに設定します。",
  },
  account: {
    title: "ワークスペースのアカウントを作成",
    subtitle:
      "このプライベートアカウントが Job Ops ワークスペースの所有者になります。",
    username: "ユーザー名",
    password: "パスワード",
    showPassword: "パスワードを表示",
    hidePassword: "パスワードを隠す",
    create: "アカウントを作成",
    creating: "アカウントを作成中…",
    createFailed: "ワークスペースのアカウントを作成できませんでした",
  },
  steps: {
    profile: "希望条件",
    model: "AI 接続",
    resume: "レジュメ",
  },
  progress: {
    label: "設定の進捗",
    complete: "完了",
    upNext: "次のステップ",
    locked: "未開放",
  },
  profile: {
    title: "どこで働きたいですか？",
    description:
      "この希望条件は新しい求人検索の初期値になり、勤務地やビザスポンサーに対応した求人サイトを優先するために使われます。後から変更できます。",
    country: "国・地域",
    selectCountry: "国を選択",
    searchCountry: "国を検索…",
    noCountries: "該当する国がありません。",
    cities: "希望の都市・地域（任意）",
    citiesPlaceholder: "東京, 大阪",
    workplaceStyle: "勤務形態",
    workplace: {
      remote: "リモート",
      hybrid: "ハイブリッド",
      onsite: "出社",
    },
    visaTitle: "企業によるビザのスポンサーが必要",
    visaDescription:
      "スポンサー情報を表示し、可能な場合はビザスポンサーに対応した求人サイトを優先します。",
    saveAndContinue: "保存して続行",
    saveFailed: "希望条件を保存できませんでした",
  },
  model: {
    title: "Job Ops が使う AI を選択",
    description:
      "まずプロバイダーを選択してください。サーバーで接続を確認できた場合のみ、設定が保存されます。",
    connect: "接続して続行",
    verified: "{{provider}} への接続を確認しました。",
  },
  resume: {
    loadTitle: "Job Ops で使うレジュメを読み込む",
    loadDescription:
      "ファイルをアップロードするか、Reactive Resume と連携してください。解析後、完了にする前に内容を確認できます。",
    checkConnection: "接続を確認",
    reviewEyebrow: "レジュメの確認",
    reviewTitle: "このレジュメで正しいですか？",
    reviewDescription:
      "解析された氏名と最近の職歴を確認してください。完了状態はこのレジュメに紐づくため、差し替えた場合は再度確認が必要です。",
    parsedFallbackName: "解析したレジュメ",
    reviewDetails: "取り込んだ内容を確認してください",
    noLocation: "所在地が検出されませんでした",
    noExperience:
      "職歴が検出されませんでした。確定する前に、レジュメスタジオで内容を修正してください。",
    parsedSuccessfully: "解析が完了しました",
    experienceCount_one: "職歴 {{count}}件",
    experienceCount_other: "職歴 {{count}}件",
    editInStudio: "レジュメスタジオで編集",
    useThisResume: "このレジュメを使う",
    confirmFailed: "このレジュメを確定できませんでした",
  },
  baseResume: {
    importSteps: {
      reading: "ファイルを読み込んでいます",
      preparing: "取り込みを準備しています",
      extracting: "レジュメのテキストを抽出しています",
      building: "レジュメスタジオのドキュメントを作成しています",
      saving: "ベースラインを保存しています",
      finalizing: "設定を仕上げています",
    },
    longRunning:
      "処理中です。大きな PDF や DOCX ファイルは少し時間がかかることがあります。",
    longRunningCodex:
      "処理中です。Codex での取り込みは、大きなレジュメだと1分ほどかかることがあります。",
    importing: "レジュメを取り込んでいます",
    selectedFile: "選択したレジュメファイル",
    progressLabel: "レジュメの取り込み状況",
    uploadTitle: "レジュメファイルをアップロード",
    uploadTitleNoRxResume: "既存のレジュメ（PDF または DOCX）をアップロード",
    uploadDescription:
      "Reactive Resume の JSON はそのまま取り込みます。PDF と DOCX ファイルは設定済みの AI モデルに送信され、ローカルの Design Resume として保存されます。このレジュメは、求人のマッチング、マッチ度の評価、検索キーワード、応募作業に使われます。",
    uploadDescriptionNoRxResume:
      "既存のレジュメを PDF または DOCX でアップロードしてください。Job Ops が取り込み、マッチング、マッチ度の評価、検索キーワード、応募作業の基準として使います。",
    supportedFormats: "対応形式：PDF、DOCX、Reactive Resume の JSON",
    supportedFormatsNoRxResume: "対応形式：PDF、DOCX",
    options: {
      upload: {
        title: "ファイルをアップロード",
        description:
          "PDF、DOCX、Reactive Resume の JSON を、Job Ops がマッチングと最適化に使う基準のレジュメにします。",
      },
      rxresume: {
        title: "Reactive Resume を使う",
        description:
          "既存の Reactive Resume と連携し、マッチ度の評価や応募書類の作成に使います。",
      },
    },
    uploadButton: "レジュメファイルをアップロード",
    ready: "ベースのレジュメを読み込みました。準備完了です。",
  },
  rxResume: {
    intro:
      "現在のレジュメが Reactive Resume にある場合はこちらを使ってください。連携すると、そのレジュメをマッチング、マッチ度の評価、最適化、応募作業に使えます。",
    apiKeyLabel: "v5 API キー",
    apiKeyPlaceholder: "v5 API キーを入力",
    apiKeyKeep:
      "空欄のままにすると、保存済みの v5 API キーを引き続き使います。",
    selfHostedTitle: "Reactive Resume をセルフホストしていますか？",
    selfHostedDescription:
      "独自のインスタンスを運用していて、カスタムのベース URL が必要な場合のみオンにしてください。",
    customUrl: "カスタム URL",
    customUrlHelper:
      "セルフホストしている Reactive Resume インスタンスのルート URL を入力してください（例: https://resume.yourdomain.com）。",
    templateTitle: "テンプレートのレジュメ",
    templateDescription:
      "マッチング、マッチ度の評価、最適化した応募書類の元として Job Ops が使うレジュメを選択してください。",
    templateOptional: "利用できるレジュメが既にあるため、この選択は任意です。",
    verified: "Reactive Resume への接続を確認しました。",
  },
  flow: {
    modelVerified: "モデルへの接続を確認しました",
    modelVerifyFailed: "モデルへの接続を確認できませんでした",
    resumeSourceVerified: "レジュメの取得元を確認しました",
    rxResumeSaved: "Reactive Resume を保存しました",
    rxResumeSaveFailed: "Reactive Resume を保存できませんでした",
    encodeFailed: "アップロード用にレジュメファイルを変換できませんでした。",
    resumeUploaded: "レジュメをアップロードしました",
    resumeReady: "ローカルのレジュメスタジオのドキュメントの準備ができました。",
    resumeReadyTypst:
      "ローカルのレジュメスタジオのドキュメントの準備ができ、PDF の生成方式を Typst に切り替えました。",
    importFailed: "レジュメファイルを取り込めませんでした",
    templateSaved:
      "テンプレートを保存しました。続行するには、レジュメの取得元を再確認してください。",
    templateSaveFailed: "選択したレジュメを保存できませんでした",
  },
};

export default onboarding;
