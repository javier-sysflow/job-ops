// Fork: 履歴書 in the layout of the 厚生労働省 2021 様式 (A4, two pages), filled
// from data.json (see shared/rirekisho.ts and services/rirekisho).
//
// Page 1: title and date, photo box, name, birth date, addresses, and the
// 学歴・職歴 table padded with empty rows to the bottom of the page, like the
// printed form. Page 2: rows that did not fit, 免許・資格, 志望動機 and
// 本人希望記入欄. All values arrive as plain strings and render as text, never
// as markup.

#let data = json("data.json")

#let serif-fonts = ("Noto Serif CJK JP", "Noto Sans CJK JP", "Libertinus Serif")
#let sans-fonts = ("Noto Sans CJK JP", "Noto Serif CJK JP", "Libertinus Serif")
#let ink = luma(15)
#let thin = 0.5pt + luma(40)
#let thick = 1.1pt + luma(20)
#let margin-x = 15mm
#let margin-top = 13mm
#let margin-bottom = 18mm
#let row-inset-y = 2.1mm
#let year-width = 16mm
#let month-width = 10mm

#let s(value) = if value == none { "" } else { str(value) }
#let has(value) = s(value).trim() != ""
#let label(body) = text(size: 8pt, fill: luma(40), body)
#let ymd(date) = if date == none { "" } else {
  str(date.year) + "年" + str(date.month) + "月" + str(date.day) + "日"
}

#set document(
  title: if has(data.name) { "履歴書 " + data.name } else { "履歴書" },
  author: s(data.name),
)
#set page(
  paper: "a4",
  margin: (x: margin-x, top: margin-top, bottom: margin-bottom),
)
#set text(font: serif-fonts, size: 10pt, fill: ink, lang: "ja", region: "JP")
#set par(leading: 0.55em, justify: false, spacing: 0.6em)
#set table(stroke: thin)

// ---------------------------------------------------------------------------
// Header: title, date, personal details and photo
// ---------------------------------------------------------------------------

#let photo = {
  if data.at("picture", default: none) != none {
    image(data.picture, width: 30mm, height: 40mm, fit: "cover")
  } else {
    box(
      width: 30mm,
      height: 40mm,
      stroke: (paint: luma(90), thickness: 0.5pt, dash: "dashed"),
      inset: 3pt,
      align(center + horizon, text(size: 6.3pt, fill: luma(60))[
        写真をはる位置 \
        #v(2pt)
        写真をはる必要が \
        ある場合 \
        1. 縦 36〜40mm \
        #h(0.6em)横 24〜30mm \
        2. 本人単身胸から上 \
        3. 裏面のりづけ
      ]),
    )
  }
}

#let birth-line = if data.birthDate != none {
  ymd(data.birthDate) + "生" + if data.age != none { "（満 " + str(data.age) + " 歳）" } else { "" }
} else { "" }

// As tall as the photo box, the name row taking the spare height, so the
// address table starts right under both.
#let personal = block(height: 40mm, table(
  columns: (1fr, 24mm),
  rows: (auto, 1fr, auto),
  stroke: (x, y) => (
    left: if x == 0 { thick } else { thin },
    right: if x == 1 { thick } else { thin },
    top: if y == 0 { thick } else { thin },
    bottom: thin,
  ),
  inset: (x: 5pt, y: 4pt),
  table.cell(colspan: 2, stroke: (bottom: (paint: luma(90), thickness: 0.5pt, dash: "dotted")))[
    #label[ふりがな]#h(8pt)#text(size: 9pt, s(data.furigana))
  ],
  table.cell(colspan: 2, inset: (x: 5pt, y: 5pt))[
    #label[氏#h(1em)名]
    #align(center + horizon, text(size: 18pt, s(data.name)))
  ],
  [#label[生年月日]#h(10pt)#birth-line],
  [#label[※性別]#h(4pt)#s(data.gender)],
))

#grid(
  columns: (1fr, auto),
  column-gutter: 5mm,
  align: (left + bottom, right + bottom),
  text(font: sans-fonts, size: 17pt, weight: "bold", tracking: 0.55em)[履歴書#h(-0.55em)],
  [#ymd(data.createdOn)現在],
)
// The form's footnote, in page 1's bottom margin only.
#place(
  bottom + left,
  dy: margin-bottom / 2,
  text(size: 7pt, fill: luma(60))[※「性別」欄：記載は任意です。未記載とすることも可能です。],
)
#v(2mm)
#grid(
  columns: (1fr, 30mm),
  column-gutter: 5mm,
  align: (left + top, center + top),
  personal,
  photo,
)

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

#let address-cell(title, postal, value, note: none) = [
  #label[#title]#h(6pt)〒#h(2pt)#s(postal)#if note != none [#h(6pt)#text(size: 7pt, fill: luma(60), note)] \
  #v(1pt)
  #s(value)
]

#let furigana-cell(value) = [#label[ふりがな]#h(8pt)#text(size: 8.5pt, s(value))]
#let dotted = (bottom: (paint: luma(90), thickness: 0.5pt, dash: "dotted"))

#v(-0.5pt)
#table(
  columns: (1fr, 52mm),
  stroke: (x, y) => (
    left: if x == 0 { thick } else { thin },
    right: if x == 1 { thick } else { thin },
    top: thin,
    bottom: if y == 3 { thick } else { thin },
  ),
  inset: (x: 5pt, y: 3.2pt),
  table.cell(stroke: dotted, furigana-cell(data.addressFurigana)),
  table.cell(rowspan: 2)[#label[電話] \ #s(data.phone) \ #v(2pt) #label[E-mail] \ #text(size: 8.5pt, s(data.email))],
  address-cell("現住所", data.postalCode, data.address),
  table.cell(stroke: dotted, furigana-cell(data.contactAddressFurigana)),
  table.cell(rowspan: 2)[#label[電話] \ #s(data.contactPhone) \ #v(2pt) #label[E-mail] \ #text(size: 8.5pt, s(data.contactEmail))],
  address-cell(
    "連絡先",
    data.contactPostalCode,
    data.contactAddress,
    note: "（現住所以外に連絡を希望する場合のみ記入）",
  ),
)

// ---------------------------------------------------------------------------
// Year/month tables (学歴・職歴, 免許・資格)
// ---------------------------------------------------------------------------

#let row-cells(item) = {
  let body = s(item.text)
  let aligned = if item.align == "center" {
    align(center, body)
  } else if item.align == "right" {
    align(right, [#body#h(1em)])
  } else { body }
  (s(item.year), s(item.month), aligned)
}

#let dated-table(title, items, blank-rows) = table(
  columns: (year-width, month-width, 1fr),
  stroke: (x, y) => (
    left: if x == 0 { thick } else { thin },
    right: if x == 2 { thick } else { thin },
    top: if y == 0 { thick } else { thin },
    bottom: thin,
  ),
  inset: (x: 5pt, y: row-inset-y),
  align: (center + horizon, center + horizon, left + horizon),
  table.header(label[年], label[月], align(center, label[#title])),
  ..items.map(row-cells).flatten(),
  // The hidden character gives empty rows the height of a written one.
  ..range(blank-rows).map(_ => ([], [], hide[年])).flatten(),
)

// Empty rows fill page 1 down to its bottom margin, like the printed form.
// The marker sits right before the table, so its position only depends on
// the header above it and the padding can't feed back into it.
#metadata(none) <history-start>
#context {
  let start = locate(<history-start>).position()
  let content-width = page.width - 2 * margin-x
  let text-width = content-width - year-width - month-width - 10pt
  // One written row, measured: the header and the blank rows are this tall.
  let row-height = measure(
    block(width: content-width, table(columns: (1fr,), inset: (x: 5pt, y: row-inset-y), hide[年])),
  ).height
  // A long row wraps, so it counts as several.
  let used = data.historyRows.map(item => {
    let width = measure(text(s(item.text))).width
    calc.max(1, calc.ceil(width / text-width))
  }).sum(default: 0)
  let available = page.height - margin-bottom - start.y
  let fit = calc.floor(available / row-height) - 1
  dated-table("学歴・職歴（各別にまとめて書く）", data.historyRows, calc.max(0, fit - used))
}

// 免許・資格 and the free-text boxes start page 2 unless the history already
// spilled onto it.
#context {
  if here().page() == 1 { pagebreak() }
}

#dated-table("免許・資格", data.licenseRows, calc.max(0, 6 - data.licenseRows.len()))

#let text-box(title, body, min-height) = layout(size => {
  let content = [
    #label[#title]
    #v(3pt)
    #for paragraph in s(body).split("\n").map(part => part.trim()).filter(part => part != "") {
      par(paragraph)
    }
  ]
  let inner-width = size.width - 12pt
  let natural = measure(block(width: inner-width, content)).height
  block(
    width: 100%,
    height: calc.max(natural + 12pt, min-height),
    stroke: thick,
    inset: 6pt,
    content,
  )
})

// The two boxes share the rest of the page (about 60:40), like the printed
// form, and grow past it when the text is longer.
#v(4mm)
#metadata(none) <boxes-start>
#context {
  let start = locate(<boxes-start>).position()
  // Minus the gap between the boxes, block spacing and a little slack, so
  // the second box never spills a sliver onto a third page.
  let remaining = page.height - margin-bottom - start.y - 14mm
  text-box(
    "志望の動機、特技、好きな学科、アピールポイントなど",
    data.motivation,
    calc.max(60mm, remaining * 0.6),
  )
  v(4mm)
  text-box(
    "本人希望記入欄（特に給料・職種・勤務時間・勤務地・その他についての希望などがあれば記入）",
    data.wishes,
    calc.max(35mm, remaining * 0.4 - 1mm),
  )
}
