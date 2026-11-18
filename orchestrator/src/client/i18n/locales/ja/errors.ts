// Japanese strings: user-facing error messages and server error code translations.
// Must have exactly the same keys and {{placeholders}} as ../en/errors.ts.
import type en from "../en/errors";

const errors: typeof en = {
  unknown: "問題が発生しました。もう一度お試しください。",
  withServerDetail: "{{message}}（{{detail}}）",
  fields: {
    jobDescription: "求人内容",
    jobUrl: "求人URL",
    applicationUrl: "応募URL",
    skillName: "スキル名",
    projectName: "プロジェクト名",
  },
  validation: {
    jobDescriptionRequired: "続行する前に求人内容を入力してください。",
    skillRequired: "スキルを入力してください（例: Python、SQL）。",
    invalidField: "有効な{{label}}を入力してください。",
    invalidUrl: "有効な URL を入力してください。",
    passwordRequired: "続行する前にパスワードを入力してください。",
    passwordTooShort: "パスワードは{{minimum}}文字以上にしてください。",
    passwordTooLong: "パスワードが長すぎます。",
    passwordMaxLength: "パスワードは{{maximum}}文字以内にしてください。",
    fieldTooLong: "{{label}}が長すぎます。",
    fieldMaxLength: "{{label}}は{{maximum}}文字以内にしてください。",
    fieldRequired: "続行する前に{{label}}を入力してください。",
    requiredField: "続行する前に必須項目を入力してください。",
    fieldInvalidType: "有効な{{label}}を入力してください。",
    checkValue: "入力内容を確認して、もう一度お試しください。",
    fieldInvalid:
      "{{label}}が正しくありません。確認して、もう一度お試しください。",
  },
  codes: {
    INVALID_REQUEST: "リクエストの内容が正しくありません。",
    UNAUTHORIZED: "続行するにはサインインが必要です。",
    FORBIDDEN: "この操作を行う権限がありません。",
    NOT_FOUND: "対象が見つかりませんでした。",
    REQUEST_TIMEOUT:
      "リクエストがタイムアウトしました。もう一度お試しください。",
    CONFLICT:
      "他の変更と競合しました。再読み込みしてから、もう一度お試しください。",
    UNPROCESSABLE_ENTITY:
      "リクエストを処理できませんでした。内容を確認して、もう一度お試しください。",
    INTERNAL_ERROR:
      "サーバーでエラーが発生しました。しばらくしてからもう一度お試しください。",
    UPSTREAM_ERROR:
      "外部サービスでエラーが発生しました。しばらくしてからもう一度お試しください。",
    SERVICE_UNAVAILABLE:
      "サービスを一時的に利用できません。しばらくしてからもう一度お試しください。",
  },
  server: {
    apiRequestFailed: "API リクエストに失敗しました。",
    malformedJson:
      "API リクエストに失敗しました。レスポンスの JSON が不正です。",
    unexpectedShape:
      "API リクエストに失敗しました。レスポンスの形式が想定と異なります。",
    streamingUnsupported: "このブラウザはストリーミングに対応していません。",
    invalidCredentials: "ユーザー名またはパスワードが正しくありません。",
    authenticationRequired: "サインインが必要です。",
    unauthorized: "認証が必要です。",
    forbidden: "この操作を行う権限がありません。",
    notFound: "見つかりませんでした。",
    requestTimedOut: "リクエストがタイムアウトしました。",
    invalidRequestBody: "リクエストの内容が正しくありません。",
    usernameExists: "このユーザー名は既に使われています。",
    signupHostedOnly: "アカウントの作成はホスト版でのみ利用できます。",
    signupsDisabled: "新しいアカウントの作成は無効になっています。",
    setupRequired: "サインインする前に初期設定が必要です。",
    setupCompleted: "初期設定は既に完了しています。",
    setupDisabledHosted: "ホスト版では初期設定は無効です。",
    failedToFetch:
      "サーバーに接続できませんでした。ネットワーク接続を確認してください。",
    networkError:
      "サーバーに接続できませんでした。ネットワーク接続を確認してください。",
    loadFailed:
      "サーバーに接続できませんでした。ネットワーク接続を確認してください。",
  },
  serverPatterns: {
    htmlInsteadOfJson:
      "サーバーエラー（{{status}}）: JSON ではなく HTML が返されました。バックエンドサーバーが起動しているか確認してください。",
    streamFailed:
      "ストリームリクエストに失敗しました（ステータス {{status}}）。",
  },
};

export default errors;
