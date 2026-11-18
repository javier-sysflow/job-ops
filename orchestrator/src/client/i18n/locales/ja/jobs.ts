// Japanese strings: job list, filters, command bar, keyboard shortcuts.
// Must have exactly the same keys and {{placeholders}} as ../en/jobs.ts.
import type en from "../en/jobs";

const jobs: typeof en = {
  header: {
    subtitle: "求人管理",
    cancelling: "キャンセル中（{{sourceCount}}）",
    cancelRun: "検索を中止",
    closeSearch: "検索を閉じる",
    findJobs: "求人を探す",
    addJob: "求人を追加",
    searchRunning: "求人検索を実行中",
  },
  tabs: {
    ready: "応募準備完了",
    discovered: "新着",
    all: "すべての求人",
    descriptions: {
      discovered: "検索で見つかった求人です。最適化の準備ができています。",
      ready: "最適化したレジュメがあり、すぐに応募できる求人です。",
    },
  },
  status: {
    unknown: "不明",
    previouslyApplied: "過去に応募済み",
  },
  list: {
    loading: "求人を読み込み中…",
    emptyTitle: "求人が見つかりません",
    emptyState: {
      ready: "求人検索を実行して、新しい求人を見つけて処理しましょう。",
      discovered: "新着求人はすべて処理済みです。",
      all: "まだ求人がありません。求人検索を実行して始めましょう。",
    },
    noDateMatches: "選択した日付の条件に一致する求人はありません。",
    tailorDiscovered: "新着求人を最適化",
    findJobs: "求人を探す",
    selectAllAria: "絞り込み結果の求人をすべて選択",
    selectAll: "絞り込み結果をすべて選択",
    selectedCount: "{{count}}件選択中",
    selectJob: "{{title}}を選択",
  },
  row: {
    generatingPdf: "PDFを生成中",
    regeneratePdf: "PDFの再生成が必要",
  },
  score: {
    awaitingAi: "AIによるスコア算出を待っています。",
    aiError:
      "AIの設定ミスまたはサービスのエラーです。設定とAIサービスの状況を確認してください。",
    aiErrorShort: "AIの設定ミスまたはサービスのエラーです。",
    suitability: "マッチ度 {{score}}",
    ringLabel: "スコア",
    findOutWhy: "理由を見る",
    viewFitAssessment: "マッチ度の評価を見る",
    scoringFailed: "スコア算出に失敗しました",
  },
  stats: {
    overview: "概要",
    totalJobs: "求人 合計{{count}}件",
  },
  selection: {
    selectedCount: "{{count}}件選択中",
    moveToReady: "応募準備完了に移動",
    skipSelected: "選択した求人をスキップ",
    recalculateMatch: "マッチ度を再計算",
    clear: "選択を解除",
  },
  bulkActions: {
    progress: {
      move_to_ready: "{{completed}}/{{requested}} 求人を応募準備完了に移動中…",
      skip: "{{completed}}/{{requested}} 選択した求人をスキップ中…",
      rescore: "{{completed}}/{{requested}} マッチ度を計算中…",
    },
    success: {
      move_to_ready: "{{succeeded}}件の求人を応募準備完了に移動しました",
      skip: "{{succeeded}}件の求人をスキップしました",
      rescore: "{{succeeded}}件のマッチ度を再計算しました",
    },
    partial: "{{succeeded}}件成功、{{failed}}件失敗しました。",
    progressCounts: "成功 {{succeeded}}件・失敗 {{failed}}件",
    selectAllLimit: "一括選択は1回の操作につき{{max}}件までです。",
    tooMany: "一度に操作できる求人は{{max}}件までです。",
    failed: "求人の一括操作に失敗しました",
    streamEnded: "一括操作が完了する前に通信が終了しました",
  },
  jobToasts: {
    skipped: "求人をスキップしました",
    skipFailed: "求人をスキップできませんでした",
    markedApplied: "応募済みにしました",
    markAppliedFailed: "応募済みにできませんでした",
    jobAtEmployer: "{{title}}（{{employer}}）",
    movingToReady: "求人を応募準備完了に移動中…",
    movedToReady: "求人を応募準備完了に移動しました",
    pdfGenerated: "最適化したレジュメのPDFを生成しました。",
    moveToReadyFailed: "求人を応募準備完了に移動できませんでした",
    openPdfFailed: "PDFを開けませんでした",
    downloadPdfFailed: "PDFをダウンロードできませんでした",
  },
  pipeline: {
    cancelled: "求人検索をキャンセルしました",
    failed: "求人検索に失敗しました",
    completed: "求人検索が完了しました",
    started: "求人検索を開始しました",
    startedDescription:
      "求人サイト: {{sources}}。完了まで数分かかる場合があります。",
    startFailed: "求人検索を開始できませんでした",
    cancelFailed: "求人検索をキャンセルできませんでした",
    unsupportedLocation:
      "選択した求人サイトの一部は、この勤務地の設定に対応していません。",
    noCompatibleSources:
      "選択した勤務地の設定に対応する求人サイトがありません。別の国・都市・求人サイトを選んでください。",
  },
  data: {
    loadSelectedFailed: "選択した求人の詳細を読み込めませんでした",
    loadFailed: "求人を読み込めませんでした",
  },
  commandBar: {
    title: "求人を検索",
    description: "職種名または企業名で、すべてのステータスの求人を検索します。",
    placeholder: "職種名または企業名で求人を検索…",
    lockHint:
      "<mono>@</mono>＋ステータス名を入力し、Tab/Enterでステータスを固定できます。検索欄が空のときにBackspaceを押すと解除されます。",
    noResults: "求人が見つかりません。",
    resultsAria: "求人の検索結果",
    lockTo: "@{{lock}} に固定",
    groups: {
      filters: "絞り込み",
      other: "その他",
    },
  },
  tokenizedInput: {
    more: "ほか{{count}}件",
  },
  filters: {
    reset: "リセット",
    toggle: "絞り込み",
    searchAria: "求人を検索",
    search: "検索",
    location: {
      aria: "勤務地で絞り込む",
      placeholder: "勤務地",
      clear: "勤務地をクリア",
    },
    source: {
      label: "求人サイト",
      all: "すべての求人サイト",
    },
    posted: {
      label: "掲載日",
      options: {
        hours24: "24時間以内",
        days3: "3日以内",
        days7: "7日以内",
        days14: "14日以内",
        days30: "30日以内",
      },
    },
    employment: {
      label: "雇用形態",
      types: {
        full_time: "正社員",
        part_time: "パート・アルバイト",
        contract: "契約・業務委託",
        internship: "インターン",
        temporary: "短期・期間限定",
      },
    },
    dates: {
      label: "日付",
      dimensions: {
        ready: "準備完了日",
        applied: "応募日",
        closed: "選考終了日",
        discovered: "取得日",
      },
      presetDays: "{{days}}日間",
      lastPreset: "過去{{label}}",
      startDate: "開始日",
      endDate: "終了日",
      clear: "日付の絞り込みをクリア",
    },
    sponsor: {
      label: "ビザスポンサー",
      options: {
        all: "すべて",
        confirmed: "スポンサー確認済み",
        potential: "スポンサーの可能性あり",
        not_found: "スポンサー情報なし",
        unknown: "スポンサー未確認",
      },
    },
    salary: {
      label: "給与（年収）",
      prefix: "給与（年収）の条件",
      modeAria: "給与の範囲の指定方法",
      modes: {
        at_least: "以上",
        at_most: "以下",
        between: "範囲を指定",
      },
      minimum: "下限",
      maximum: "上限",
      minPlaceholder: "例: 5000000",
      maxPlaceholder: "例: 8000000",
    },
    score: {
      label: "スコア",
      prefix: "スコア",
      modeAria: "スコアの絞り込み条件",
      modes: {
        any: "すべて",
        has: "スコアあり",
        missing: "スコアなし",
      },
      minimum: "下限",
      maximum: "上限",
      minPlaceholder: "例: 60",
      maxPlaceholder: "例: 90",
    },
    sort: {
      label: "並び替え",
      sortBy: "並び替えの基準",
      fieldAria: "並び替えの項目",
      direction: "順序",
      directionAria: "並び順",
      fields: {
        datePosted: "掲載日",
        discoveredAt: "取得日",
        score: "スコア",
        salary: "給与",
        title: "職種名",
        employer: "企業",
      },
      directions: {
        mostRecent: "新しい順",
        leastRecent: "古い順",
        largestFirst: "高い順",
        smallestFirst: "低い順",
        aToZ: "昇順（A→Z）",
        zToA: "降順（Z→A）",
      },
    },
  },
  shortcuts: {
    labels: {
      nextJob: "次の求人",
      prevJob: "前の求人",
      tabReady: "「応募準備完了」タブ",
      tabDiscovered: "「新着」タブ",
      tabAll: "「すべての求人」タブ",
      prevTab: "前のタブ",
      nextTab: "次のタブ",
      skip: "求人をスキップ",
      moveToReady: "応募準備完了に移動",
      markApplied: "応募済みにする",
      viewPdf: "PDFを表示",
      downloadPdf: "PDFをダウンロード",
      openListing: "求人ページを開く",
      toggleSelect: "選択を切り替え",
      clearSelection: "選択を解除",
      search: "求人を検索",
      help: "キーボードショートカット",
    },
    barGroups: {
      navigation: "移動",
      tabs: "タブ",
      actions: "操作",
      meta: "全般",
    },
    dialogGroups: {
      navigation: "移動",
      tabs: "タブ",
      actions: "操作",
      meta: "全般",
    },
    dialog: {
      title: "キーボードショートカット",
      description:
        "現在の画面で使えるショートカットです。<kbd>?</kbd> キーでこの画面を開閉できます。",
    },
  },
  automaticRun: {
    searchScope: {
      selected_only: {
        label: "選択した勤務地のみ",
        description: "地図で選んだエリアまたは都市に絞って検索します。",
      },
      selected_plus_remote_worldwide: {
        label: "選択した勤務地＋世界中のリモート",
        description: "世界中から応募できるリモート求人も含めます。",
      },
      remote_worldwide_prioritize_selected: {
        label: "世界中のリモート",
        description: "世界中を対象に検索し、選択した勤務地を優先します。",
      },
    },
    matchStrictness: {
      exact_only: {
        label: "完全一致のみ",
        description: "選択した勤務地に明確に一致する求人だけを対象にします。",
      },
      flexible: {
        label: "近い候補も含める",
        description: "近隣や条件に合いそうな勤務地も含めます。",
      },
    },
    sourceStatus: {
      selectCountry: "国を選択",
      selectCountryDetail:
        "この求人サイトが利用できるか確認するには、先に国を選んでください。",
      available: "利用可能",
      availableWithoutCountry: "この求人サイトは国を選ばなくても利用できます。",
      blocked: "利用不可",
      glassdoorCountry: "選択した国ではGlassdoorを利用できません。",
      needsCity: "都市が必要",
      glassdoorNeedsCity:
        "Glassdoorを使うには、勤務地の設定で都市を1つ以上追加してください。",
      glassdoorAvailable: "この勤務地の条件でGlassdoorを利用できます。",
      ukOnly: "英国のみ",
      ukOnlyDetail: "{{source}}は国が英国の場合のみ利用できます。",
      notAvailableIn: "{{country}}では{{source}}を利用できません。",
      theSelectedCountry: "選択した国",
      availableForIntent: "この勤務地の条件で利用できます。",
    },
  },
};

export default jobs;
