// Japanese strings: watchlist.
// Must have exactly the same keys and {{placeholders}} as ../en/watchlist.ts.
import type en from "../en/watchlist";

const watchlist: typeof en = {
  page: {
    title: "ウォッチリスト",
    subtitle: "ウォッチ中の企業の採用ページ",
  },
  toasts: {
    saveSourcesFailed: "ウォッチリストの登録先を保存できませんでした",
    ignoreFailed: "求人を無視できませんでした",
    restoreFailed: "求人を元に戻せませんでした",
    prepareFailed: "求人の取り込みを準備できませんでした",
  },
  errors: {
    sourceMissingUrl: "登録先{{index}}の{{label}}が入力されていません。",
    customSourceUrl: "カスタムURL",
    sourceNotSelected: "登録先{{index}}が選択されていません。",
    sourceUnavailable: "登録先{{index}}は利用できなくなりました。",
    duplicateUrls:
      "ウォッチリストのURLが重複しています。別のURLを選んでください。",
  },
  sources: {
    title: "ウォッチ中の採用ページ",
    description:
      "チェックしたい企業の採用ページを選ぶか、対応している採用ページのURLを追加してください。",
    lastCheckedWithNew:
      "最終チェック: {{date}} · {{previous}}以降の新着 {{newCount}}件",
    lastCheckedFirst:
      "最終チェック: {{date}} · 初回チェックの結果を基準として保存しました",
    addSource: "登録先を追加",
    saveSources: "登録先を保存",
    customSource: "カスタム登録先",
    careersFallback: "採用ページ",
    newSource: "新しい登録先",
    viewWebsite: "サイトを見る",
    removeSource: "ウォッチリストの登録先{{index}}を削除",
    chooseCompany: "企業を選択",
    searchCompanies: "企業を検索…",
    noCompanies: "企業が見つかりません。",
    sourceAria: "ウォッチリストの登録先{{index}}",
    customSourceUrl: "カスタムURL",
    customUrlAria: "{{label}} {{index}}",
    empty: "ウォッチリストの登録先はまだありません。",
    status: {
      watching: "ウォッチ中",
      watchingTooltip:
        "この登録先は保存済みのウォッチリスト設定と一致しており、現在チェック対象になっています。",
      unsaved: "未保存",
      unsavedTooltip:
        "この登録先には保存されていない変更があるため、ウォッチリストのチェックにはまだ反映されていません。",
    },
  },
  results: {
    checking: "確認中",
    error: "エラー",
    careersPage: "{{label}}の採用ページ",
    fetchingJobs: "求人を取得中…",
    loadFailedTitle: "求人を読み込めませんでした",
    fetchFailed: "この採用ページから求人を取得できませんでした。",
    loadFailedHint:
      "この登録先は読み込めませんでしたが、ウォッチリストの他の登録先は引き続き確認できます。",
    technicalDetails: "技術的な詳細",
    jobsCount: "求人 {{value}}件",
    jobsCountWithHidden: "求人 {{value}}件（無視した{{hidden}}件は非表示）",
    showIgnoredAria: "無視したウォッチリストの求人を表示",
    showIgnored: "無視した求人を表示",
    columns: {
      job: "求人",
      company: "企業",
      location: "勤務地",
      posted: "掲載日",
      actions: "操作",
    },
  },
  job: {
    signals: {
      inWorkspace: "ワークスペースに追加済み",
      ignored: "無視済み",
      searchMatch: "検索キーワード「{{term}}」に一致（{{score}}）",
      locationMatch: "勤務地が一致",
      remoteMatch: "リモートで一致",
      newSinceLastCheck: "前回のチェック以降の新着",
    },
    viewSignals: "{{title}}の一致状況を表示",
    unknownLocation: "不明",
    viewInWorkspace: "JobOpsのワークスペースで見る",
    moveToWorkspace: "JobOpsのワークスペースに移動",
    moreActions: "その他の操作",
    jobDescription: "求人内容",
    unignore: "無視を解除",
    viewOnCareersPage: "採用ページで見る",
    ignore: "無視する",
    descriptionTitle: "{{title}}の求人内容",
  },
};

export default watchlist;
