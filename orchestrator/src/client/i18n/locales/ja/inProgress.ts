// Japanese strings: in-progress (kanban) board.
// Must have exactly the same keys and {{placeholders}} as ../en/inProgress.ts.
import type en from "../en/inProgress";

const inProgress: typeof en = {
  page: {
    title: "選考ボード",
    subtitle: "選考段階ごとのかんばん表示",
  },
  sort: {
    recent: "更新順",
    title: "職種名",
    company: "企業名",
  },
  board: {
    loading: "ボードを読み込み中…",
    laneLabel: "{{stage}}のレーン",
    expandApplied: "応募済みのレーンを展開",
    collapseApplied: "応募済みのレーンを折りたたむ",
    emptyLane: "ここにカードをドロップするか、選考段階を記録してください。",
  },
  toasts: {
    loadFailed: "選考ボードを読み込めませんでした",
    movedTo: "{{stage}}に移動しました",
    moveFailed: "選考段階を移動できませんでした",
    eventLogged: "イベントを記録しました",
    logFailed: "イベントを記録できませんでした",
  },
  card: {
    actionsFor: "{{title}}の操作",
    logEvent: "イベントを記録",
    updated: "更新: {{date}}",
    noEvents: "選考イベントはまだありません",
  },
};

export default inProgress;
