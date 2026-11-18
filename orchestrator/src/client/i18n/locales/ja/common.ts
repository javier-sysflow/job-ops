// Japanese strings: shared words used across screens (owned by the foundation; add keys only via your own namespace).
// Must have exactly the same keys and {{placeholders}} as ../en/common.ts.
import type en from "../en/common";

const common: typeof en = {
  actions: {
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    close: "閉じる",
    confirm: "確認",
    continue: "続ける",
    back: "戻る",
    next: "次へ",
    retry: "再試行",
    copy: "コピー",
    copied: "コピーしました",
    add: "追加",
    remove: "削除",
    open: "開く",
    apply: "適用",
    reset: "リセット",
    search: "検索",
    refresh: "更新",
    done: "完了",
  },
  status: {
    loading: "読み込み中…",
    saving: "保存中…",
    saved: "保存しました",
    error: "問題が発生しました",
  },
  dates: {
    noDueDate: "期限なし",
    noDate: "日付なし",
    unknownSource: "不明な求人サイト",
  },
  language: {
    english: "English",
    japanese: "日本語",
    switchTo: "表示言語を{{language}}に切り替え",
  },
};

export default common;
