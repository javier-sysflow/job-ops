// Japanese strings: search runs: automatic run tab, sources, progress cards, run history.
// Must have exactly the same keys and {{placeholders}} as ../en/pipeline.ts.
import type en from "../en/pipeline";

const pipeline: typeof en = {
  listSeparator: "、",
  automatic: {
    tabs: {
      describe: "検索内容を入力",
      details: "詳細を設定",
    },
    backToDescribe: "検索内容の入力に戻る",
    title: "検索条件を設定",
    intro:
      "重視する条件をJob Opsに伝え、検索プランを確認してから、選択した求人サイトで検索します。",
    fallbackAlert:
      "AIで検索条件を作成できませんでした。現在の設定を確認するか、もう一度お試しください。",
    searchNotes: "検索に関する注意（{{total}}件）",
    errors: {
      startFailed: "検索を開始できませんでした",
      planFailed: "検索条件を作成できませんでした",
    },
  },
  prompt: {
    title: "次の仕事を見つけましょう",
    intro:
      "どんな仕事を探しているか教えてください。確認用の検索条件を作成します。",
    label: "どんな求人をお探しですか？",
    placeholder:
      "東京のバックエンド職。ハイブリッドまたはリモートで、TypeScriptかPythonを使う仕事。",
    tryLabel: "例：",
    examples: {
      backend: {
        label: "バックエンド職",
        prompt:
          "東京のバックエンドエンジニアの求人。TypeScriptまたはPythonを使い、ハイブリッドかリモートで働ける仕事を希望。",
      },
      graduate: {
        label: "新卒向け求人",
        prompt:
          "東京の新卒向けソフトウェアエンジニアの求人。バックエンドやAPI開発で、ハイブリッドかリモートで働ける仕事を希望。",
      },
      internships: {
        label: "有給インターン",
        prompt:
          "日本国内の有給データアナリストインターン。SQL、Python、ダッシュボードを使う仕事を希望。",
      },
    },
    building: "検索条件を作成中…",
    build: "検索条件を作成",
    configureManually: "検索条件を手動で入力する",
    nothingRuns: "検索を開始するまで、何も実行されません。",
  },
  terms: {
    title: "どんな職種を探していますか？",
    description:
      "求人サイトで使われる職種名を追加してください。別の呼び方も加えると検索範囲が広がります。",
    label: "検索キーワード",
    placeholder: "入力してEnterキーを押す",
    helper: "複数の職種名はカンマで区切るか、Enterキーで追加してください。",
    depth: "検索の深さ",
  },
  presets: {
    fast: {
      label: "高速",
      description: "まずは手早く検索します。",
    },
    balanced: {
      label: "標準",
      description: "普段使いに十分な検索範囲です。",
    },
    detailed: {
      label: "詳細",
      description: "より広く、より深く検索します。",
    },
    custom: {
      label: "カスタム",
      description: "独自の実行設定を使います。",
    },
  },
  location: {
    title: "どこで働けますか？",
    description: "勤務地の指定方法と、希望する働き方を選んでください。",
    detectedTitle: "ブラウザから検出しました",
    detectedBody:
      "ブラウザの情報から<country>{{country}}</country>を検出しました。適用すると国別の求人サイトを利用できます。別の国を選ぶこともできます。",
    useSuggestion: "この国を使う",
    searchArea: "検索エリア",
    modes: {
      radius: {
        label: "地図で半径を指定",
        description: "地図上で選んだ地点の周辺を検索します。",
      },
      cities: {
        label: "都市を手動で指定",
        description: "各求人サイトで検索する都市を入力します。",
      },
    },
    country: "国",
    selectCountry: "国を選択",
    searchCountry: "国を検索...",
    noCountries: "該当する国がありません。",
    countryRequiredWithSuggestion:
      "国を選択するか、ブラウザの候補を使用してください。",
    countryRequired: "国を選択してください。",
    cities: "都市",
    citiesPlaceholder: "例：「東京」",
    removeCity: "都市を削除",
    workArrangement: "働き方",
    workplaceRequired: "働き方を1つ以上選択してください。",
  },
  workplace: {
    remote: {
      label: "リモート",
      description: "オフィス以外の場所で働きます。",
    },
    hybrid: {
      label: "ハイブリッド",
      description: "在宅勤務と出社を組み合わせます。",
    },
    onsite: {
      label: "出社",
      ariaLabel: "出社",
      description: "主に職場で勤務します。",
    },
  },
  radius: {
    countryNotDetected: "この地点の国を検出できませんでした。",
    geolocationUnavailable: "このブラウザでは位置情報を利用できません。",
    geolocationFailed: "現在地を取得できませんでした。",
    loadingMap: "地図を読み込み中…",
    useMapCentre: "地図の中心を使う",
    useMyLocation: "現在地を使う",
    help: "地図をクリックして中心を設定します。中心または端のハンドルをドラッグすると、検索エリアを調整できます。",
    centreRequired: "地図上で中心となる地点を選択してください。",
    detectedCountry: "検出された国",
    detecting: "検出中…",
    notDetected: "未検出",
    radiusMiles: "半径（マイル）",
  },
  advanced: {
    ariaLabel: "実行設定",
    title: "詳細な検索設定",
    locationScope: "勤務地の範囲",
    matchStrictness: "一致の厳密さ",
    searchScope: {
      selected_only: {
        label: "選択した勤務地のみ",
        description: "選択した地図エリアまたは都市の求人に限定します。",
      },
      selected_plus_remote_worldwide: {
        label: "選択した勤務地＋世界中のリモート",
        description: "世界中から応募できるリモート求人も含めます。",
      },
      remote_worldwide_prioritize_selected: {
        label: "世界中のリモート",
        description: "世界中を検索し、選択した勤務地を優先します。",
      },
    },
    strictness: {
      exact_only: {
        label: "完全一致のみ",
        description: "選択した勤務地に明確に一致する求人のみを含めます。",
      },
      flexible: {
        label: "近い候補も含める",
        description: "近隣や条件に合いそうな勤務地も含めます。",
      },
    },
    topN: "最適化するレジュメ数",
    minScore: "最低マッチ度スコア",
    runBudget: "検索する求人の上限数",
  },
  ranking: {
    title: "Job Opsに何を優先させますか？",
    description:
      "この指示はランキングにのみ影響し、求人の検索結果には影響しません。自由な文章で入力してください。",
    label: "理想の仕事",
    ariaLabel: "ランキングの優先条件",
    placeholder:
      "例：バックエンドのAPI開発、ビザサポートあり、年収600万円以上の求人を優先。",
    hint: "この検索のスコアリングにのみ適用されます。",
  },
  sources: {
    title: "Job Opsでどこを検索しますか？",
    description:
      "この勤務地と検索条件で利用できる求人サイトを確認してください。",
    reviewAria: "求人サイトを確認・編集",
    chooseSources: "この検索で使う求人サイトを選択してください",
    sourcesSelected_one: "求人サイトを{{count}}件選択中",
    sourcesSelected_other: "求人サイトを{{count}}件選択中",
    selectedBadge: "{{total}}件選択中",
    availableBadge: "{{total}}件利用可能",
    unavailableBadge: "{{total}}件利用不可",
    selectedGroup: "選択中",
    availableGroup: "利用可能",
    unavailableGroup: "現在利用できません",
    includedTitle: "この検索に含まれています。",
    availableTitle: "この勤務地の設定で利用できます。",
    watchlist: {
      title: "ウォッチリスト",
      selectedOf: "{{total}}件中{{selected}}件を選択",
      loading: "ウォッチリストの求人サイトを読み込み中...",
      empty:
        "保存されたウォッチリストはまだありません。<link>ウォッチリスト</link>ページで企業の採用ページを追加すると、求人検索に含められます。",
      ariaLabel: "ウォッチリスト：{{label}}",
      includedTitle: "この検索に含まれています。クリックすると除外します。",
      excludedTitle: "クリックするとこの検索に含めます。",
    },
    status: {
      badge: {
        selectCountry: "国を選択",
        available: "利用可能",
        blocked: "利用不可",
        needsCity: "都市が必要",
        ukOnly: "イギリスのみ",
      },
      detail: {
        pickCountry:
          "この求人サイトが利用できるか確認するには、先に国を選択してください。",
        availableWithoutCountry:
          "この求人サイトは国を選択しなくても利用できます。",
        glassdoorCountry: "選択した国ではGlassdoorを利用できません。",
        glassdoorCity:
          "Glassdoorを利用するには、勤務地の設定で都市を1つ以上追加してください。",
        glassdoorAvailable: "この勤務地の条件でGlassdoorを利用できます。",
        available: "この勤務地の条件で利用できます。",
        ukOnly: "{{source}}は国がイギリスの場合のみ利用できます。",
        notAvailableFor: "{{source}}は{{country}}では利用できません。",
        notAvailableForSelected: "{{source}}は選択した国では利用できません。",
      },
    },
  },
  savedSearches: {
    label: "保存した検索",
    loading: "読み込み中...",
    placeholder: "保存した検索を選択",
    saveAs: "名前を付けて保存",
    update: "更新",
    delete: "保存した検索を削除",
    dialog: {
      updateTitle: "保存した検索を更新",
      createTitle: "検索条件を保存",
      description: "現在の検索条件を保存します。",
      name: "名前",
      namePlaceholder: "例：東京のプラットフォームエンジニア職",
    },
    toasts: {
      created: "検索条件を保存しました",
      updated: "保存した検索を更新しました",
      deleted: "保存した検索を削除しました",
      createFailed: "検索条件を保存できませんでした",
      updateFailed: "保存した検索を更新できませんでした",
      deleteFailed: "保存した検索を削除できませんでした",
    },
  },
  footer: {
    title: "検索内容",
    review: "要確認",
    ready: "準備完了",
    description: "Job Opsが実行する内容のプレビューです。",
    roles: "職種",
    addRole: "職種を追加してください",
    location: "勤務地",
    arrangement: "働き方",
    ranking: "ランキング",
    noRanking: "ランキングの追加指示なし",
    coverageLabel: "検索範囲",
    coverage_one: "{{preset}} · 求人サイト{{count}}件",
    coverage_other: "{{preset}} · 求人サイト{{count}}件",
    countRoles_one: "職種<strong>{{count}}</strong>件",
    countRoles_other: "職種<strong>{{count}}</strong>件",
    countLocations_one: "勤務地<strong>{{count}}</strong>件",
    countLocations_other: "勤務地<strong>{{count}}</strong>件",
    countLocationsPending: "勤務地<strong>…</strong>件",
    countJobBoards_one: "求人サイト<strong>{{count}}</strong>件",
    countJobBoards_other: "求人サイト<strong>{{count}}</strong>件",
    runSearch: "検索を実行",
    leaveHint: "検索の開始後は、このページを離れても問題ありません。",
  },
  summary: {
    yourSelectedArea: "選択したエリア",
    twoCities: "{{first}}・{{second}}",
    selectedCities: "選択した{{total}}都市",
    cityInCountry: "{{country}}の{{city}}",
    twoCitiesInCountry: "{{country}}の{{first}}・{{second}}",
    selectedCitiesInCountry: "{{country}}の選択した{{total}}都市",
    workplaceTypes: {
      hybrid: "ハイブリッド",
      onsite: "出社",
      and: "{{first}}・{{second}}",
    },
    radius_one: "選択した地点から半径{{count}}マイル以内の求人を表示します。",
    radius_other: "選択した地点から半径{{count}}マイル以内の求人を表示します。",
    radiusPlusRemote_one:
      "選択した地点から半径{{count}}マイル以内の求人と、世界中のリモート求人を表示します。",
    radiusPlusRemote_other:
      "選択した地点から半径{{count}}マイル以内の求人と、世界中のリモート求人を表示します。",
    plusRemoteTyped:
      "{{geography}}の{{types}}求人と、世界中のリモート求人を表示します。",
    plusRemoteOnly:
      "世界中のリモート求人を表示します（{{geography}}で明示的に募集している求人を含みます）。",
    onlyIn: "{{geography}}の求人のみを表示します。",
    remoteFirst:
      "世界中のリモート求人を表示し、リモート以外の求人は{{geography}}を優先します。",
    typedFirst: "{{geography}}の{{types}}求人を優先して表示します。",
    first: "{{geography}}の求人を優先して表示します。",
    onlyTypedExplicit:
      "{{geography}}で明示的に募集している{{types}}求人のみを表示します。",
    onlyRemoteExplicit:
      "{{geography}}で明示的に募集しているリモート求人のみを表示します。",
    onlyExplicit: "{{geography}}で明示的に募集している求人のみを表示します。",
    flexible: "{{summary}}一致する可能性が高い求人も含みます。",
  },
  fanout: {
    titleCheck: "ブラウザ認証が必要です",
    titleFinishing: "検索を仕上げています",
    titleSearching: "求人を検索中",
    elapsed: "経過時間 {{time}}",
    stats:
      "職種<strong>{{termCount}}</strong>件 · 勤務地<strong>{{locationCount}}</strong>件 · 求人サイト<strong>{{sourceCount}}</strong>件 · 組み合わせ<strong>{{total}}</strong>件",
    latestActivity: "最新の状況：",
    complete: "完了",
    searchesComplete_one: "件の検索が完了",
    searchesComplete_other: "件の検索が完了",
    running: "実行中",
    check: "要確認",
    queued: "待機中",
    results: "件の結果",
    unique: "件（重複除外）",
    progressAria:
      "完了 {{complete}}件、実行中 {{running}}件、待機中 {{queued}}件",
    roleProgressAria:
      "{{role}}：完了 {{complete}}件、実行中 {{running}}件、要確認 {{check}}件、待機中 {{queued}}件",
    challengeSkippable:
      "ブラウザ認証を完了するか、ここまでに見つかった求人を残して次の検索に進んでください。",
    challengeRequired:
      "この求人サイトの検索を続けるには、ブラウザ認証を完了してください。",
    solve: "認証する",
    solving: "認証中…",
    skipSearch: "この検索をスキップ",
    skipping: "スキップ中…",
    progressByRole: "職種ごとの進捗",
    rolesQueued_one: "待機中の職種 {{count}}件",
    rolesQueued_other: "待機中の職種 {{count}}件",
    rolesDone_one: "完了した職種 {{count}}件",
    rolesDone_other: "完了した職種 {{count}}件",
  },
  progress: {
    stepTitles: {
      idle: "検索を準備中",
      crawling: "求人を検索中",
      challenge_required: "ブラウザ認証が必要です",
      importing: "求人を取り込み中",
      scoring: "マッチ度を評価中",
      processing: "応募書類を準備中",
      completed: "検索が完了しました",
      cancelled: "検索を中止しました",
      failed: "求人検索に失敗しました",
      configuration_required: "スコアリングを一時停止中",
    },
    stepLabels: {
      idle: "接続中",
      crawling: "検索中",
      challenge_required: "要確認",
      importing: "取り込み中",
      scoring: "評価中",
      processing: "処理中",
      completed: "完了",
      cancelled: "中止",
      failed: "失敗",
      configuration_required: "対応が必要",
    },
    metrics: {
      discovered: "検出",
      scored: "評価済み",
      awaitingScore: "評価待ち",
      prepared: "準備済み",
      exceptional: "特に高いマッチ",
      toPrepare: "準備待ち",
    },
    live: {
      importing: "{{title}}をワークスペースに取り込み中",
      scoring: "{{title}}をプロフィールと照合中",
      processing: "{{title}}を確認用に準備中",
    },
    elapsed: "経過時間 {{time}}",
    pipelineStopped: "求人検索が停止しました",
    llmConfigRequired: "LLMの設定が必要です",
    restartScoring: "スコアリングを再開",
    resuming: "再開中…",
    errors: {
      solveFailed: "ブラウザ認証を完了できませんでした",
      skipFailed: "検索をスキップできませんでした",
      restartFailed: "スコアリングを再開できませんでした",
    },
    messages: {
      ready: "準備完了",
      fetchingSources: "求人サイトから求人を取得中...",
      fetchingSource: "{{source}}から求人を取得中...",
      crawling:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}）...",
      crawlingTerms:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}、キーワード {{termsProcessed}}/{{termsTotal}}）...",
      crawlingSkipped:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}、スキップ {{skipped}}）...",
      crawlingCards:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}、カード {{cards}}）...",
      crawlingTermsSkipped:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}、キーワード {{termsProcessed}}/{{termsTotal}}、スキップ {{skipped}}）...",
      crawlingTermsCards:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}、キーワード {{termsProcessed}}/{{termsTotal}}、カード {{cards}}）...",
      crawlingSkippedCards:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}、スキップ {{skipped}}、カード {{cards}}）...",
      crawlingTermsSkippedCards:
        "求人をクロール中（一覧ページ {{listPages}}、求人ページ {{jobPages}}、キーワード {{termsProcessed}}/{{termsTotal}}、スキップ {{skipped}}、カード {{cards}}）...",
      foundJobs:
        "{{jobsFound}}件の求人が見つかりました。データベースに取り込み中...",
      importingJobs: "求人を取り込み中（{{index}}/{{total}}）...",
      imported:
        "新しい求人を{{created}}件取り込みました（重複{{skipped}}件）。スコアリング中...",
      scoringJobs: "求人を評価中（{{index}}/{{total}}）...",
      scored: "{{totalScored}}件の求人を評価しました。",
      processingJob: "求人を処理中（{{index}}/{{total}}）...",
      complete:
        "検索が完了しました。{{discovered}}件の求人を検出し、{{processed}}件を処理しました。",
      cancelled: "検索を中止しました",
      failed: "検索に失敗しました",
      configurationRequired: "設定が必要です",
      challengesNeededOne:
        "{{extractors}}件の求人サイトでCloudflareの認証が必要です",
      challengesNeededMany:
        "{{extractors}}件の求人サイトでCloudflareの認証が必要です",
      challengesRemainingOne: "残りの認証：{{remaining}}件",
      challengesRemainingMany: "残りの認証：{{remaining}}件",
      allChallengesSolved: "すべての認証が完了しました。再開中...",
    },
    details: {
      startingCrawler: "クローラーを起動中",
      runningCrawler: "クローラーを実行中",
      listUrl: "一覧：{{url}}",
      jobUrl: "求人：{{url}}",
      deduplicating: "重複を除外して保存中",
      checkingDuplicates: "重複を確認し、新しい求人を保存中",
      evaluatingFit: "AIで求人とのマッチ度を評価中",
      readyForManual: "手動処理の準備ができました",
      jobAtEmployer: "{{title}} @ {{employer}}",
      generatingSummary: "{{title}}の要約を生成中...",
      generatingPdf: "{{title}}のPDFを生成中...",
      jobsCompleted: "{{index}}/{{total}}件の求人が完了",
      readyForReview: "確認の準備ができました",
      rerunningExtractors: "求人サイトの検索を再実行中",
    },
  },
};

export default pipeline;
