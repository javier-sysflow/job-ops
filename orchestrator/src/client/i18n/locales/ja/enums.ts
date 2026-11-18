// Japanese strings: labels for shared enums (application stages, job statuses, outcomes).
// Must have exactly the same keys and {{placeholders}} as ../en/enums.ts.
import type en from "../en/enums";

const enums: typeof en = {
  jobStatus: {
    discovered: "新着",
    processing: "処理中",
    ready: "応募準備完了",
    applied: "応募済み",
    in_progress: "選考中",
    skipped: "スキップ",
    expired: "掲載終了",
  },
  applicationStage: {
    applied: "応募済み",
    recruiter_screen: "書類選考・人事面談",
    assessment: "適性検査・課題",
    hiring_manager_screen: "チーム面談",
    technical_interview: "技術面接",
    onsite: "最終面接",
    offer: "内定",
    closed: "終了",
    no_change: "変更なし",
  },
  outcome: {
    offer_accepted: "内定承諾",
    offer_declined: "内定辞退",
    rejected: "お見送り",
    withdrawn: "選考辞退",
    no_response: "返信なし",
    ghosted: "連絡途絶",
  },
  taskType: {
    prep: "準備",
    todo: "やること",
    follow_up: "フォローアップ",
    check_status: "状況確認",
  },
  interviewType: {
    recruiter_screen: "人事面談",
    technical: "技術面接",
    onsite: "対面面接",
    panel: "集団面接",
    behavioral: "行動面接",
    final: "最終面接",
  },
  interviewOutcome: {
    pass: "通過",
    fail: "不通過",
    pending: "結果待ち",
    cancelled: "キャンセル",
  },
  workplaceType: {
    remote: "リモート",
    hybrid: "ハイブリッド",
    onsite: "出社",
  },
};

export default enums;
