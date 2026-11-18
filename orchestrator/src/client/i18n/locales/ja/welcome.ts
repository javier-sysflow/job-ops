// Japanese strings: welcome messages shown above the job list.
// Must have exactly the same keys and {{placeholders}} as ../en/welcome.ts.
// `lines` is the Japanese set picked from by useWelcomeMessage (English uses
// shared/src/messages/jobs-welcome.json). The first line is shown on day one.
import type en from "../en/welcome";

const welcome: typeof en = {
  fallbackName: "ゲスト",
  lines: [
    "ようこそ、{{name}}さん。さっそく求人を探しましょう。",
    "おかえりなさい、{{name}}さん。求人たちがお待ちかねです。",
    "おかえりなさい。未対応の求人は今日も元気です。少しずつ片付けましょう。",
    "{{name}}さん、今日もいい求人に出会えますように。",
    "おはようございます。こんにちは、こんばんは。とにかく求人を探しましょう。",
    "{{name}}さん、今日の一歩が未来の自分を助けます。",
    "求人リストが静かです。静かすぎるくらいです。",
    "コーヒーの準備はできましたか？求人の準備はできています。",
    "{{name}}さん、応募ボタンは逃げません。でも締め切りは待ってくれません。",
    "理想の求人は待っていても来ません。こちらから迎えに行きましょう。",
    "{{name}}さん、今日は何件応募しますか？目標は控えめでも大丈夫です。",
    "新着求人が届いています。気になるものから見ていきましょう。",
    "またお会いしましたね、{{name}}さん。レジュメの調子はいかがですか？",
    "転職活動はマラソンです。給水所はここにあります。",
    "{{name}}さん、おかえりなさい。スキップも立派な判断です。",
    "求人の山も、一件ずつなら登れます。",
    "今日の運勢は大吉です。たぶん。さあ、応募しましょう。",
    "{{name}}さん、未来の同僚がどこかで待っています。",
    "深呼吸して、まずは一件だけ見てみましょう。それで十分です。",
    "{{name}}さん、職務経歴書もあなたの出番を待っています。",
    "今日も一緒に、いい求人を探しましょう。",
  ],
};

export default welcome;
