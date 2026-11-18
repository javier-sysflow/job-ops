// 職務経歴書 (shokumu keirekisho): a conventional Japanese career-history
// document. Adapted theme: it reads the normalized resume document that the
// renderer writes next to this file. Plain Typst only (no @preview packages),
// so it renders fully offline.
//
// Data notes:
// - Hidden sections and items are already filtered out by the renderer.
// - `summary` and entry `bullets` arrive as escaped Typst markup (HTML lists
//   and paragraphs are already split into bullets, <strong>/<em> converted).
//   Every other field is plain text and is rendered verbatim.

#let source = json(__RESUME_DATA_PATH__)

// Document date: the user's local date (renderDate, YYYY-MM-DD, computed by
// the server in the user's browser time zone), else the server's today.
#let document-date = {
  let raw = source.at("renderDate", default: none)
  if type(raw) == str and raw.len() == 10 {
    let parts = raw.split("-")
    datetime(
      year: int(parts.at(0)),
      month: int(parts.at(1)),
      day: int(parts.at(2)),
    )
  } else {
    datetime.today()
  }
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

#let text-of(value) = {
  if value == none {
    ""
  } else if type(value) == str {
    value.trim()
  } else if type(value) in (int, float) {
    str(value)
  } else {
    ""
  }
}

#let list-of(value) = if type(value) == array { value } else { () }

#let field(item, key) = {
  if type(item) == dictionary { text-of(item.at(key, default: none)) } else { "" }
}

#let visible(value) = list-of(value).filter(item => (
  type(item) == dictionary and item.at("hidden", default: false) != true
))

#let strings-of(item, key) = {
  if type(item) == dictionary {
    list-of(item.at(key, default: ())).map(text-of).filter(value => value != "")
  } else {
    ()
  }
}

#let cjk-pattern = regex("[\p{Han}\p{Hiragana}\p{Katakana}]")
#let has-cjk(value) = type(value) == str and value.contains(cjk-pattern)

// Summary and bullets are pre-escaped markup. The renderer escapes the
// characters that start code, math, labels and emphasis; also neutralise the
// few constructs it leaves alone so user text can never turn into a comment
// (`//`), a non-breaking space (`~`) or a list/heading/enum marker.
#let safe-markup(value) = {
  let source-text = text-of(value)
  if source-text == "" {
    return none
  }
  let escaped = source-text.replace("~", "\\~").replace("/", "\\/")
  if escaped.starts-with(regex("[-+=]\\s|\\d+\\.\\s")) {
    escaped = "\\" + escaped
  }
  eval(escaped, mode: "markup")
}

#let link-or-text(label, url) = {
  if url == "" { label } else { link(url, label) }
}

// Experience entries carry `position` and `location` separately; `subtitle`
// (both joined) is only a fallback for documents written without them.
#let role-of(entry) = {
  if "position" in entry or "location" in entry {
    (position: field(entry, "position"), location: field(entry, "location"))
  } else {
    (position: field(entry, "subtitle"), location: "")
  }
}

// Periods are free text. When a "start ～ end" range does not fit the narrow
// period column, break at the separator ("2021年4月～ / 現在",
// "September 2019 / – Present") instead of wrapping mid-word. Plain hyphens
// only count when spaced, so "2021-04" stays intact.
#let period-separator = regex("\\s*[～〜~]\\s*|\\s*[–—]\\s*|\\s+-{1,3}\\s+")
#let period-text(value) = {
  set par(justify: false)
  set text(size: 9.5pt)
  let found = value.match(period-separator)
  if found == none or found.start == 0 or found.end >= value.len() {
    value
  } else {
    layout(region => {
      if measure(value).width <= region.width {
        value
      } else {
        let start = value.slice(0, found.start)
        let end = value.slice(found.end)
        if found.text.contains(regex("[～〜~]")) {
          [#(start + "～")#linebreak()#end]
        } else {
          [#start#linebreak()#("–\u{a0}" + end)]
        }
      }
    })
  }
}

#let label-text(body) = {
  set par(justify: false)
  body
}

// ---------------------------------------------------------------------------
// Document data
// ---------------------------------------------------------------------------

#let name = text-of(source.at("name", default: none))
#let summary = text-of(source.at("summary", default: none))
#let experience = visible(source.at("experience", default: ()))
#let skill-groups = visible(source.at("skillGroups", default: ()))
#let certifications = visible(source.at("certifications", default: ()))
#let languages = visible(source.at("languages", default: ()))
#let education = visible(source.at("education", default: ()))
#let custom-fields = visible(source.at("customFieldItems", default: ()))

// Japanese content gets Japanese punctuation and bullets; English content
// keeps Latin ones so the document still reads naturally.
#let is-japanese = (
  source.at("language", default: none) == "japanese"
    or has-cjk(name)
    or has-cjk(summary)
    or experience.any(entry => has-cjk(repr(entry)))
)
#let list-separator = if is-japanese { "、" } else { ", " }
#let paren(value) = if is-japanese { "（" + value + "）" } else { " (" + value + ")" }

#let pr-key(value) = lower(value).replace(regex("[\\s\\-_・]"), "")
#let is-self-pr-title(value) = pr-key(value) in ("自己pr", "自己ｐｒ", "selfpr")
#let self-pr-prefix = regex("^(?i)(自己\\s*(PR|ＰＲ)|self[\\s\\-_]*pr)\\s*[:：]\\s*")

// 自己PR comes from a basics custom field titled 自己PR / Self PR, or from an
// untitled field written as "自己PR: ...".
#let self-pr = {
  let found = ""
  for item in custom-fields {
    let title = field(item, "title")
    let body = field(item, "text")
    if found == "" and is-self-pr-title(title) and body != "" and body != title {
      found = body
    }
  }
  if found == "" {
    for item in custom-fields {
      let title = field(item, "title")
      let body = field(item, "text")
      let prefix = body.match(self-pr-prefix)
      if found == "" and (title == "" or title == body) and prefix != none {
        found = body.slice(prefix.end).trim()
      }
    }
  }
  found
}

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

#let serif-fonts = ("Noto Serif CJK JP", "Noto Sans CJK JP", "Libertinus Serif")
#let sans-fonts = ("Noto Sans CJK JP", "Noto Serif CJK JP", "Libertinus Serif")
#let ink = luma(15)
#let muted = luma(85)
#let heading-rule = 0.8pt + luma(30)
#let table-stroke = 0.5pt + luma(110)
#let header-fill = luma(237)
#let label-width = 32mm

#set document(title: if name == "" { "職務経歴書" } else { "職務経歴書 " + name }, author: name)
#set page(
  paper: __PAGE_PAPER__,
  margin: (x: 20mm, top: 18mm, bottom: 20mm),
  footer: context {
    if counter(page).final().first() > 1 {
      align(center, text(size: 8.5pt, fill: muted, counter(page).display("1 / 1", both: true)))
    }
  },
)
// Japanese line breaking (kinsoku) for Japanese content; English-only content
// switches to `en` so justified text can hyphenate instead of stretching.
#set text(
  font: serif-fonts,
  size: 10pt,
  fill: ink,
  lang: if is-japanese { "ja" } else { "en" },
  region: if is-japanese { "JP" } else { none },
)
#set par(justify: true, leading: 0.72em, spacing: 0.9em)
#set list(
  marker: if is-japanese { [・] } else { [•] },
  indent: if is-japanese { 0pt } else { 2pt },
  body-indent: if is-japanese { 0.1em } else { 0.5em },
  spacing: 0.5em,
)
#set table(stroke: table-stroke, inset: (x: 7pt, y: 5pt))

#show heading.where(level: 1): it => block(
  width: 100%,
  above: 1.45em,
  below: 0.75em,
  sticky: true,
  inset: (bottom: 3pt),
  stroke: (bottom: heading-rule),
  text(font: sans-fonts, size: 11pt, weight: "bold", cjk-latin-spacing: none)[■#it.body],
)

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

#let label-grid(rows) = grid(
  columns: (label-width, 1fr),
  column-gutter: 10pt,
  row-gutter: 0.62em,
  ..rows.flatten(),
)

#let experience-block(entry) = {
  let company = field(entry, "title")
  let role = role-of(entry)
  let period = field(entry, "date")
  let bullets = strings-of(entry, "bullets")

  let details = {
    if role.position != "" {
      block(
        below: if bullets.len() > 0 { 0.6em } else { 0pt },
        text(weight: "bold", role.position),
      )
    }
    if bullets.len() > 0 {
      list(..bullets.map(safe-markup))
    }
  }

  block(above: 0.9em, below: 0.9em, table(
    columns: (label-width, 1fr),
    align: left + top,
    table.header(table.cell(colspan: 2, fill: header-fill, label-text(grid(
      columns: (1fr, auto),
      column-gutter: 1em,
      align: (left + horizon, right + horizon),
      text(font: sans-fonts, weight: "bold", size: 10.5pt, link-or-text(company, field(entry, "url"))),
      text(size: 9pt, fill: muted, role.location),
    )))),
    ..if period == "" {
      (table.cell(colspan: 2, details),)
    } else {
      (period-text(period), details)
    },
  ))
}

#let skill-rows = skill-groups.map(group => {
  let keywords = strings-of(group, "keywords")
  (
    table.cell(fill: header-fill, label-text(text(weight: "bold", field(group, "name")))),
    if keywords.len() > 0 { keywords.join(list-separator) } else { [] },
  )
})

#let certification-rows = certifications.map(entry => {
  let issuer = field(entry, "subtitle")
  (
    period-text(field(entry, "date")),
    [#link-or-text(field(entry, "title"), field(entry, "url"))#if issuer != "" {
        text(size: 9pt, fill: muted, paren(issuer))
      }],
  )
})

#let language-rows = languages.map(item => {
  let fluency = field(item, "fluency")
  let level = item.at("level", default: none)
  (
    label-text(text(weight: "bold", field(item, "language"))),
    if fluency != "" {
      fluency
    } else if type(level) in (int, float) and level > 0 {
      "Level " + str(level)
    } else {
      []
    },
  )
})

#let education-rows = education.map(entry => {
  // The renderer joins degree and area with ", "; Japanese reads better spaced.
  let degree = field(entry, "subtitle")
  if has-cjk(degree) {
    degree = degree.replace(", ", " ")
  }
  (
    period-text(field(entry, "date")),
    [#link-or-text(field(entry, "title"), field(entry, "url"))#if degree != "" [#h(1em)#degree]],
  )
})

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

#align(center, text(font: sans-fonts, size: 18pt, weight: "bold", tracking: 0.45em)[職務経歴書#h(-0.45em)])
#v(0.6em)
#align(right)[
  #document-date.display("[year]年[month padding:none]月[day padding:none]日現在") \
  #if name != "" [氏名#h(1em)#text(size: 11pt)[#name]]
]

#if summary != "" [
  = 職務要約
  #safe-markup(summary)
]

#if experience.len() > 0 [
  = 職務経歴
  #for entry in experience {
    experience-block(entry)
  }
]

#if skill-rows.len() > 0 [
  = 活かせる経験・知識・技術
  #table(columns: (label-width + 10mm, 1fr), align: left + horizon, ..skill-rows.flatten())
]

#if certification-rows.len() > 0 [
  = 資格
  #label-grid(certification-rows)
]

#if language-rows.len() > 0 [
  = 語学
  #label-grid(language-rows)
]

#if education-rows.len() > 0 [
  = 学歴
  #label-grid(education-rows)
]

#if self-pr != "" [
  = 自己PR
  #for paragraph in self-pr.split(regex("\\n+")).map(part => part.trim()).filter(part => part != "") {
    par(paragraph)
  }
]

#v(1.2em)
#align(right)[以上]
