// Japanese strings: tracer links.
// Must have exactly the same keys and {{placeholders}} as ../en/tracer.ts.
import type en from "../en/tracer";

const tracer: typeof en = {
  page: {
    title: "トラッキングリンク",
    subtitle: "レジュメ内リンクのクリック分析",
  },
  filters: {
    title: "絞り込み",
    fromDate: "開始日",
    toDate: "終了日",
    includeBots: "ボットと思われるアクセスを含める",
  },
  stats: {
    totalViews: "総閲覧数",
    uniqueJobsReached: "閲覧された求人数",
    humanClicks: "人によるクリック",
  },
  chart: {
    title: "直近{{days}}日間のレジュメのクリック数",
    description: "トラッキングリンクの1日ごとのクリック数です。",
    loading: "分析データを読み込み中…",
    series: "クリック数",
  },
  activity: {
    title: "応募ごとのアクティビティ",
    job: "求人",
    clicks: "クリック数",
    lastActive: "最終アクセス",
    empty: "トラッキングリンクのアクティビティはまだありません。",
  },
  drilldown: {
    title: "求人のリンク",
    titleWithJob: "求人のリンク: {{title}}",
    description: "選択した求人のリンク先とクリック状況です。",
    loading: "リンクを読み込み中…",
    humanClicks: "人によるクリック:",
    totalClicks: "総クリック数:",
    lastActivity: "最終アクセス:",
    humanOnly: "人のみ",
    humanAndBots: "人＋ボット",
    lastClick: "最終クリック: {{date}}",
    rowClicks: "{{value}}クリック",
    inactiveLinks: "アクセスなし（{{value}}）",
    noLinks: "この求人のトラッキングリンクはまだ記録されていません。",
    selectJob: "応募ごとのアクティビティから求人を選択してください。",
  },
  time: {
    today: "今日 {{time}}",
    yesterday: "昨日 {{time}}",
    noActivity: "アクセスなし",
    justNow: "たった今",
    minutesAgo_one: "{{count}}分前",
    minutesAgo_other: "{{count}}分前",
    hoursAgo_one: "{{count}}時間前",
    hoursAgo_other: "{{count}}時間前",
    daysAgo_one: "{{count}}日前",
    daysAgo_other: "{{count}}日前",
  },
  toasts: {
    linkCopied: "リンクをコピーしました",
    copyFailed: "リンクをコピーできませんでした",
  },
};

export default tracer;
