// Japanese strings: Resume Studio (design resume editor).
// Must have exactly the same keys and {{placeholders}} as ../en/resumeStudio.ts.
import type en from "../en/resumeStudio";

const resumeStudio: typeof en = {
  page: {
    title: "レジュメスタジオ",
    subtitle: "レジュメの内容を編集",
    loadingSubtitle: "レジュメを読み込み中",
    loading: "レジュメスタジオを読み込み中…",
    actions: {
      importFile: "ファイルをインポート",
      importingFile: "ファイルをインポート中",
      importRxResume: "RxResumeからインポート",
      reimportRxResume: "RxResumeから再インポート",
      importingRxResume: "RxResumeからインポート中",
      downloadPdf: "PDFをダウンロード",
      preparingPdf: "PDFを準備中",
      export: "エクスポート",
      exportJson: "JSONをエクスポート",
      openMenu: "レジュメの操作メニューを開く",
    },
    empty: {
      title: "レジュメをインポートして、ここで編集を始めましょう。",
      description:
        "インポートすると、ツールを行き来せずにここでレジュメを更新できます。",
      importResume: "レジュメをインポート",
      importingResume: "レジュメをインポート中",
      loadError: "レジュメスタジオを読み込めませんでした。",
    },
    mobile: {
      tabsLabel: "レジュメスタジオのモバイル編集画面",
      edit: "編集",
      preview: "プレビュー",
      sections: "セクション",
      chooseTitle: "編集するセクションを選択",
      chooseDescription:
        "レジュメのセクションを選ぶと全画面で編集でき、プレビューにもワンタップで切り替えられます。",
      chooseSection: "セクションを選択",
      pickerDescription: "モバイル編集画面で表示するセクションを切り替えます。",
    },
    autosaving: "自動保存中",
    autosaved: "自動保存済み",
    dialogAdd: "{{item}}を追加",
    dialogEdit: "{{item}}を編集",
    reimport: {
      title: "RxResumeから再インポートしますか？",
      description:
        "現在のレジュメスタジオの内容が、RxResumeの最新データで置き換えられます。ここで行った編集はすべて上書きされ、元に戻せません。",
      confirm: "再インポート",
    },
  },
  nav: {
    groups: {
      preview: "プレビュー",
      profile: "プロフィール",
      sections: "レジュメのセクション",
    },
    livePreview: {
      label: "ライブプレビュー",
      description: "編集しながらレジュメのプレビューを確認できます。",
    },
    basics: {
      label: "連絡先",
      description: "氏名、肩書き、連絡先の情報です。",
    },
    summary: {
      label: "職務要約",
      description:
        "レジュメの冒頭に表示される短い紹介文です。応募ごとの最適化で書き換えられます。",
    },
    picture: {
      label: "写真",
      description: "レジュメの写真とその表示設定です。",
    },
    customFields: {
      label: "カスタム項目",
      description: "連絡先の近くに表示する追加のリンクや短い情報です。",
    },
  },
  dock: {
    label: "レジュメスタジオのセクション",
  },
  sections: {
    profiles: {
      title: "プロフィールリンク",
      singular: "プロフィールリンク",
      description: "基本情報と並べて表示するリンクやアカウント名です。",
    },
    experience: {
      title: "職歴",
      singular: "職歴",
      description: "役職、企業、詳しい業務内容です。",
    },
    education: {
      title: "学歴",
      singular: "学歴",
      description: "学校、学位、実績です。",
    },
    projects: {
      title: "プロジェクト",
      singular: "プロジェクト",
      description:
        "レジュメを最適化するときの各プロジェクトの扱いを選べます。含めない、関連があればAIが含める、常に含める、から選択します。",
    },
    skills: {
      title: "スキル",
      singular: "スキルグループ",
      description: "最適化に使うカテゴリとキーワードです。",
    },
    languages: {
      title: "語学",
      singular: "語学",
      description: "話せる言語、書ける言語です。",
    },
    interests: {
      title: "興味・関心",
      singular: "興味・関心",
      description: "興味のある分野やトピックです。",
    },
    awards: {
      title: "受賞歴",
      singular: "受賞歴",
      description: "受賞や表彰です。",
    },
    certifications: {
      title: "資格",
      singular: "資格",
      description: "公的な資格や認定です。",
    },
    publications: {
      title: "出版物",
      singular: "出版物",
      description: "出版した著作や論文です。",
    },
    volunteer: {
      title: "ボランティア",
      singular: "ボランティア活動",
      description: "ボランティア活動や地域への貢献です。",
    },
    references: {
      title: "推薦者",
      singular: "推薦者",
      description: "推薦者や照会先の連絡先です。",
    },
  },
  fields: {
    icon: "アイコン",
    network: "サービス",
    username: "ユーザー名",
    website: "ウェブサイト",
    showLinkInTitle: "タイトルにリンクを表示",
    company: "企業名",
    workLocation: "勤務地",
    location: "所在地",
    position: "役職",
    period: "期間",
    description: "詳細",
    experienceDescription: "業務内容",
    school: "学校名",
    area: "専攻",
    degree: "学位",
    grade: "成績",
    projectName: "プロジェクト名",
    skillName: "スキル名",
    interestName: "名称",
    referenceName: "氏名",
    proficiency: "習熟度",
    level: "レベル",
    keywords: "キーワード",
    language: "言語",
    fluency: "語学レベル",
    title: "タイトル",
    awardTitle: "賞の名称",
    certificationTitle: "資格名",
    awarder: "授与機関",
    issuer: "発行機関",
    publisher: "出版社",
    date: "日付",
    organization: "団体名",
    phone: "電話番号",
  },
  placeholders: {
    profileIcon: "例: tabler:brand-linkedin（Iconifyのアイコン名）",
    interestIcon: "例: tabler:brand-python（Iconifyのアイコン名）",
    skillName: "例: Python、プログラミング言語",
  },
  badges: {
    empty: "未入力",
  },
  rail: {
    picture: {
      title: "写真",
      subtitle: "レジュメの写真と表示方法を管理します。",
    },
    basics: {
      title: "基本情報",
      subtitle: "氏名、肩書き、連絡先を編集します。",
    },
    customFields: {
      defaultTitle: "カスタム項目",
      subtitle: "連絡先の近くに追加のリンクや短い情報を表示します。",
    },
    summary: {
      title: "職務要約",
      subtitle: "レジュメの冒頭に表示する短い紹介文を書きます。",
    },
  },
  picture: {
    disabledReason:
      "写真を使うには、JobOpsが公開URLでアクセスできる必要があります。",
    alt: "レジュメスタジオのプロフィール写真",
    replace: "差し替え",
    uploading: "アップロード中…",
    upload: "画像をアップロード",
    imageUrl: "画像URL",
    show: "写真を表示",
    showDescription: "写真の表示・非表示を切り替えます。",
    size: "サイズ",
    rotation: "回転",
    aspectRatio: "縦横比",
    borderRadius: "角の丸み",
    borderWidth: "枠線の太さ",
    shadowWidth: "影の幅",
    borderColor: "枠線の色",
    shadowColor: "影の色",
  },
  basics: {
    name: "氏名",
    headline: "肩書き",
    email: "メールアドレス",
    phone: "電話番号",
    location: "所在地",
    website: "ウェブサイト",
  },
  customFields: {
    sectionTitle: "セクション名",
    title: "タイトル",
    icon: "アイコン",
    value: "内容",
    link: "リンク",
    up: "上へ",
    down: "下へ",
    add: "カスタム項目を追加",
  },
  summary: {
    label: "職務要約",
    show: "職務要約を表示",
    showDescription:
      "このセクションをレジュメに表示するかどうかを切り替えます。",
    placeholder: "レジュメで伝えたい経歴の要点をまとめましょう。",
  },
  assistant: {
    open: "「{{label}}」のAIアシスタントを開く",
    improve: "AIで「{{label}}」を改善",
    drag: "AIアシスタントを移動",
    heading: "Ghostwriter：{{label}}",
    subheading: "この項目の書き換え案を作成します。",
    close: "AIアシスタントを閉じる",
    placeholder:
      "簡潔な書き直し、より力強い箇条書き、分かりやすいキーワードなどを依頼できます…",
    filled: "「{{label}}」にAIの下書きを入力しました。",
    updated: "「{{label}}」を更新しました。",
    failed: "AIによる項目の編集に失敗しました",
  },
  itemDialog: {
    required: "{{label}}は必須です。",
    tagPlaceholder: "値を追加",
    tagHelper:
      "Enterキーかカンマで区切るか、リストを貼り付けて項目を追加します。",
    removeTag: "タグを削除",
    save: "項目を保存",
  },
  listSection: {
    modes: {
      manual: {
        label: "含めない",
        tooltip:
          "このプロジェクトをAIに送らず、最適化したレジュメにも表示しません",
      },
      aiSelectable: {
        label: "AIが選択",
        tooltip: "求人内容に関連する場合、最適化の際にAIが選べるようにします",
      },
      mustInclude: {
        label: "必ず含める",
        tooltip:
          "関連するAIのコンテキストに常に送り、最適化したレジュメに必ず含めます",
      },
    },
    setMode: "「{{project}}」の扱いを「{{mode}}」に設定",
    saving: "保存中…",
    untitled: "無題",
    dragToReorder: "「{{label}}」をドラッグして並べ替え",
    hidden: "非表示",
    visible: "表示中",
    show: "表示",
    hide: "非表示にする",
    itemCount_one: "{{count}}件",
    itemCount_other: "{{count}}件",
    hintProjects:
      "項目の追加や並べ替え、各項目を表示するタイミングの選択ができます。",
    hint: "項目の追加や並べ替え、表示したくない項目の非表示ができます。",
    targetProjectsTip:
      "最適化したレジュメに含めるプロジェクトの目標数を設定します。<br/><br/>「必ず含める」のプロジェクトもこの数に含まれます。<br/><br/>0にすると、「必ず含める」に設定したプロジェクト以外は自動で選ばれなくなります。",
    targetProjects: "最適化したレジュメのプロジェクト数",
    empty: "まだ項目がありません。",
    thisItem: "この項目",
    removeTitle: "{{item}}を削除しますか？",
    removeDescription:
      "{{label}}をレジュメスタジオから削除します。あとで追加し直すこともできますが、この変更は保存されます。",
  },
  preview: {
    chooseTemplate: "テンプレートを選択",
    chooseTypstTheme: "Typstテーマを選択",
    layout: {
      label: "レジュメの形式",
      japanese: "職務経歴書（日本式）",
      english: "英文レジュメ",
      japaneseActive: "職務経歴書の形式に切り替えました。",
      englishActive: "英文レジュメの形式に切り替えました。",
      failed: "レジュメの形式を変更できませんでした。",
    },
    renderers: {
      rxresume: "RxResumeでエクスポート",
      latex: "ローカルLaTeX（Jakeテンプレート）",
      typst: "ローカルTypst",
    },
    saveError: "変更を保存できませんでした。もう一度お試しください。",
    renderError: "PDFプレビューを表示できませんでした。",
    page: "レジュメスタジオのPDF {{page}}ページ目",
    zoomOut: "PDFプレビューを縮小",
    zoomIn: "PDFプレビューを拡大",
    updatingTemplate: "テンプレートを更新してからプレビューを再表示します",
    savingChanges: "変更を保存してからプレビューを更新します",
    rendering: "PDFプレビューを生成中",
    unavailable: "プレビューを表示できません",
  },
  iconPicker: {
    pick: "アイコンを選択",
    search: "アイコンを検索",
    empty: "アイコンが見つかりません。",
    clear: "クリア",
  },
  richText: {
    placeholder: "内容を入力してください…",
    linkPrompt: "リンクのURLを入力",
    heading1: "見出し1",
    heading2: "見出し2",
    heading3: "見出し3",
    bold: "太字",
    italic: "斜体",
    bulletList: "箇条書き",
    orderedList: "番号付きリスト",
    setLink: "リンクを設定",
    removeLink: "リンクを解除",
  },
  sectionWorkspace: {
    searchEmpty: "{{label}}：「{{search}}」",
  },
};

export default resumeStudio;
