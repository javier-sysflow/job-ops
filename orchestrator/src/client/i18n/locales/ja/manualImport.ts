// Japanese strings: manual job import.
// Must have exactly the same keys and {{placeholders}} as ../en/manualImport.ts.
import type en from "../en/manualImport";

const manualImport: typeof en = {
  sheet: {
    title: "求人を追加",
    description:
      "リンク、求人内容、またはPDFを追加してください。追加する前に詳細を確認できます。",
  },
  steps: {
    progress: "ステップ {{current}}/{{total}}",
    addJd: "求人内容を追加",
    addUrls: "URLを追加",
    review: "確認してインポート",
  },
  fields: {
    title: {
      label: "求人タイトル",
      placeholder: "例: ジュニアバックエンドエンジニア",
    },
    employer: {
      label: "企業名",
      placeholder: "例: Acme Labs",
    },
    jobDescription: {
      label: "求人内容",
      placeholder: "求人内容を貼り付けてください…",
    },
    jobUrl: {
      label: "求人URL",
      placeholder: "https://...",
    },
    location: {
      label: "勤務地",
      placeholder: "例: 東京都渋谷区",
    },
    salary: {
      label: "給与（年収）",
      placeholder: "例: 600万〜800万円",
    },
    jobType: {
      label: "雇用形態",
      placeholder: "例: 正社員",
    },
    jobLevel: {
      label: "職位レベル",
      placeholder: "例: 新卒",
    },
    jobFunction: {
      label: "職種",
      placeholder: "例: ソフトウェアエンジニアリング",
    },
    disciplines: {
      label: "専門分野",
      placeholder: "例: 情報科学",
    },
    deadline: {
      label: "応募締切",
      placeholder: "例: 2025年9月30日",
    },
    degreeRequired: {
      label: "必要な学位",
      placeholder: "例: 学士または修士",
    },
    starting: {
      label: "入社時期",
      placeholder: "例: 2026年9月",
    },
    applicationLink: {
      label: "応募URL",
      placeholder: "https://...",
    },
  },
  paste: {
    modes: {
      single: "1件の求人",
      urlList: "URLリスト",
    },
    jobUrls: "求人URL",
    upTo: "最大{{max}}件",
    urlListHint:
      "公開されている求人URLを1行に1つずつ貼り付けてください。各ページを取得・分析してから結果を確認できます。",
    analyzeUrlList: "URLリストを分析",
    jobUrl: "求人URL",
    optionalHelper: "任意",
    fetching: "取得中…",
    fetch: "取得",
    fetchHint:
      "「取得」を押すと、求人のテキストを求人内容の欄にコピーします。サイトが取得をブロックしている場合は、求人内容を手動で貼り付けてください。",
    jobDescription: "求人内容",
    descriptionPlaceholder:
      "求人内容の全文をここに貼り付けるか、上のURLから取得してください…",
    analyzeJd: "求人内容を分析",
    fetchNotice:
      "ページのテキストを取得しました。下の内容を確認してから分析してください。",
  },
  loading: {
    title: "求人内容を分析中",
    description: "求人タイトル、企業、勤務地などの情報を抽出しています。",
  },
  bulkLoading: {
    title: "URLリストを分析中",
    description:
      "求人を1件ずつ取得して分析しています。しばらくお待ちください。",
    progress: "{{done}}/{{total}}件を処理済み",
  },
  review: {
    title: "求人の詳細を確認",
    description:
      "AIが求人内容から抽出した情報です。インポートする前に、不足や誤りがないか確認してください。",
    required: {
      title: "必須",
      description:
        "インポートには求人タイトル、企業名、求人URL、求人内容が必要です。",
    },
    other: {
      title: "その他の情報",
      description: "分かる範囲で入力してください。空欄はあとから追加できます。",
    },
    tailorLabel: "インポート後に自動で最適化する",
    tailorHint:
      "オフにするとLLMのトークンを節約できます。求人は「新着」に追加され、あとで求人の詳細画面から最適化できます。初期値は「設定 → 表示」で変更できます。",
    editJd: "求人内容を編集",
    importing: "インポート中…",
    importAndTailor: "インポートして最適化",
    importWithoutTailoring: "最適化せずにインポート",
    status: {
      review: "要確認",
      looksGood: "OK",
      add: "未入力",
    },
  },
  bulkReview: {
    title: "URLリストを確認",
    description:
      "インポートする前に、AIが見つけた項目を確認してください。失敗したURLはリストに残るので、あとで個別に再試行できます。",
    status: {
      ready: "準備完了",
      imported: "インポート済み",
      failed: "失敗",
    },
    tailorHint:
      "オフにするとLLMのトークンを節約でき、求人は「新着」に残ります。",
    editUrls: "URLを編集",
    importReady: "準備完了の求人をインポート",
  },
  errors: {
    autofetchBlocked:
      "{{site}}のリンクは自動取得に対応していません。求人内容を手動で貼り付けてください。",
    autofetchBlockedShort: "{{site}}のリンクは自動取得に対応していません。",
    fetchFailed:
      "このURLを自動で取得できませんでした。求人内容を手動で貼り付けてください。",
    pasteDescription: "続けるには求人内容を貼り付けてください。",
    analyzeFailed: "求人内容の分析に失敗しました",
    invalidLines_one: "{{lines}}行目は有効なhttp(s) URLではありません。",
    invalidLines_other: "{{lines}}行目は有効なhttp(s) URLではありません。",
    noUrls: "続けるには求人URLを1つ以上貼り付けてください。",
    tooManyUrls: "一度に貼り付けられるURLは{{max}}件までです。",
    analyzeUrlFailed: "このURLを分析できませんでした。",
    importFailed: "インポートに失敗しました。",
    importJobFailed: "求人のインポートに失敗しました",
    bulkFailed_one: "{{count}}件のURLをインポートできませんでした",
    bulkFailed_other: "{{count}}件のURLをインポートできませんでした",
  },
  toasts: {
    imported: "求人をインポートしました",
    importedWithoutTailoring:
      "最適化せずに「新着」に保存しました。求人の詳細画面からいつでも最適化できます。",
    importedTailored: "求人を最適化し、「応募準備完了」に移動しました。",
    bulkImported_one: "{{count}}件の求人をインポートしました",
    bulkImported_other: "{{count}}件の求人をインポートしました",
  },
};

export default manualImport;
