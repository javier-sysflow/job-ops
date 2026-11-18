// Japanese strings: visa sponsors.
// Must have exactly the same keys and {{placeholders}} as ../en/visa.ts.
import type en from "../en/visa";

const visa: typeof en = {
  page: {
    title: "ビザスポンサー",
    subtitle: "利用可能なデータソースからビザスポンサー企業を検索",
    updating: "更新中",
    sponsorCount: "スポンサー企業 {{value}}社",
    never: "未取得",
    updateList: "スポンサーリストを更新",
  },
  search: {
    companyName: "企業名",
    placeholder: "企業名で検索…",
    hintAll:
      "企業名を入力すると、すべてのデータソースで認定ビザスポンサーかどうかを確認できます。",
    hintCountry:
      "企業名を入力すると、{{country}}のデータソースで認定ビザスポンサーかどうかを確認できます。",
    source: "データソース",
    selectSource: "スポンサーのデータソースを選択",
    allSources: "すべてのデータソース",
  },
  results: {
    count_one: "{{count}}件",
    count_other: "{{count}}件",
    noDataTitle: "スポンサーデータがありません",
    noDataDescription:
      "ビザスポンサーのリストはまだダウンロードされていません。",
    downloading: "ダウンロード中…",
    downloadList: "リストをダウンロード",
    searchTitle: "企業を検索",
    searchPromptAll:
      "上の欄に企業名を入力して、すべてのデータソースを検索してください。",
    searchPromptCountry:
      "上の欄に企業名を入力して、{{country}}のデータソースを検索してください。",
    noMatchesTitle: "一致する企業が見つかりません",
    noMatchesDescription:
      "「{{query}}」に一致するスポンサーはありません。別の表記でお試しください。",
  },
  detail: {
    selectTitle: "企業を選択",
    selectDescription: "検索結果から企業を選ぶと、ここに詳細が表示されます。",
    licensedSponsor: "認定スポンサー",
    match: "一致度 {{score}}%",
    source: "データソース: {{country}}",
    location: "所在地",
    licensedRoutes: "認定されたビザの種類（{{value}}）",
    typeRating: "種別・評価:",
    infoTitle: "これはどういう意味ですか？",
    infoBody:
      "この企業は選択したスポンサーのデータソースに掲載されており、上記のビザの種類で外国人労働者をスポンサーできる可能性があります。利用する前に、必ずデータソースの最新の掲載内容を確認してください。",
    drawerTitle: "スポンサーの詳細",
  },
  toasts: {
    statusFailed: "ステータスを取得できませんでした",
    searchFailed: "検索に失敗しました",
    detailsFailed: "詳細を取得できませんでした",
    updateFailed: "更新に失敗しました",
  },
};

export default visa;
