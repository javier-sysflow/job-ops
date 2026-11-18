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

// Summary and bullets are pre-escaped markup: the renderer escapes code,
// math, label, emphasis, comment (`//`) and non-breaking-space (`~`)
// characters plus leading list/heading/enum markers. Escaping again here
// would print stray backslashes; only guard the leading marker in case a
// caller hands over unescaped text.
#let safe-markup(value) = {
  let source-text = text-of(value)
  if source-text == "" {
    return none
  }
  if source-text.starts-with(regex("([-+=/]|\\d+\\.)(\\s|$)")) {
    source-text = "\\" + source-text
  }
  eval(source-text, mode: "markup")
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
  // A typed ASCII tilde in a Japanese range ("2021年4月~現在") reads as the
  // full-width wave the theme already uses when it breaks the range.
  if value.contains(regex("[\p{Han}\p{Hiragana}\p{Katakana}]")) {
    value = value.replace(regex("\\s*~\\s*"), "～")
  }
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
#let projects = visible(source.at("projects", default: ()))
#let skill-groups = visible(source.at("skillGroups", default: ()))
#let certifications = visible(source.at("certifications", default: ()))
#let awards = visible(source.at("awards", default: ()))
#let languages = visible(source.at("languages", default: ()))
#let education = visible(source.at("education", default: ()))
#let publications = visible(source.at("publications", default: ()))
#let volunteer = visible(source.at("volunteer", default: ()))
#let profiles = list-of(source.at("profileItems", default: ())).filter(item => type(item) == dictionary)
#let custom-fields = visible(source.at("customFieldItems", default: ()))
// Interests and references are left out on purpose: a 職務経歴書 carries
// neither (hobbies belong on the 履歴書, referees are not a Japanese norm).

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

#let is-self-pr-field(item) = {
  let title = field(item, "title")
  let body = field(item, "text")
  is-self-pr-title(title) or ((title == "" or title == body) and body.match(self-pr-prefix) != none)
}
#let other-fields = custom-fields.filter(item => not is-self-pr-field(item))

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
#let margin-x = 20mm
// A company block shorter than this moves to the next page whole instead of
// splitting; taller ones still break (their header row repeats).
#let keep-together-height = 100mm

#set document(title: if name == "" { "職務経歴書" } else { "職務経歴書 " + name }, author: name)
#set page(
  paper: __PAGE_PAPER__,
  margin: (x: margin-x, top: 18mm, bottom: 20mm),
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

  let entry-table = table(
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
  )

  // A page break inside a short block strands the header, period and role
  // line at the foot of one page and the duties on the next.
  context {
    let height = measure(entry-table, width: page.width - 2 * margin-x).height
    block(above: 0.9em, below: 0.9em, breakable: height > keep-together-height, entry-table)
  }
}

// Skills listed by name only (no keywords) would leave an empty right-hand
// cell each; gather them into one closing row instead. An empty catch-all
// group ("その他" with nothing in it) would only repeat the row label.
#let other-label = if is-japanese { "その他" } else { "Other" }
#let keyword-skill-groups = skill-groups.filter(group => strings-of(group, "keywords").len() > 0)
#let bare-skills = (
  skill-groups
    .filter(group => strings-of(group, "keywords").len() == 0)
    .map(group => field(group, "name"))
    .filter(value => value != "" and lower(value) not in ("その他", "other", "others"))
)

#let skill-label-cell(body) = table.cell(fill: header-fill, label-text(text(weight: "bold", body)))
#let skill-rows = keyword-skill-groups.map(group => (
  skill-label-cell(field(group, "name")),
  strings-of(group, "keywords").join(list-separator),
)) + (
  if keyword-skill-groups.len() > 0 and bare-skills.len() > 0 {
    ((skill-label-cell(other-label), bare-skills.join(list-separator)),)
  } else {
    ()
  }
)

// Dated entries (certifications, projects, awards, ...): period on the left,
// title with its issuer/keywords in parentheses, then any description bullets.
#let entry-rows(entries) = entries.map(entry => {
  let subtitle = field(entry, "subtitle")
  let bullets = strings-of(entry, "bullets")
  (
    period-text(field(entry, "date")),
    [#link-or-text(field(entry, "title"), field(entry, "url"))#if subtitle != "" {
        text(size: 9pt, fill: muted, paren(subtitle))
      }#if bullets.len() > 0 {
        block(above: 0.5em, list(..bullets.map(safe-markup)))
      }],
  )
})

#let certification-rows = entry-rows(certifications)
#let project-rows = entry-rows(projects)
#let award-rows = entry-rows(awards)
#let publication-rows = entry-rows(publications)
#let volunteer-rows = entry-rows(volunteer)

#let language-rows = languages.map(item => {
  let fluency = field(item, "fluency")
  let level = item.at("level", default: none)
  (
    label-text(text(weight: "bold", field(item, "language"))),
    if fluency != "" {
      fluency
    } else if type(level) in (int, float) and level > 0 {
      (if is-japanese { "レベル " } else { "Level " }) + str(level)
    } else {
      []
    },
  )
})

// Profiles (GitHub, LinkedIn, ...) and custom fields other than 自己PR.
#let other-rows = profiles.map(item => {
  let network = field(item, "network")
  let url = field(item, "url")
  let shown = if field(item, "username") != "" { field(item, "username") } else if url != "" { url } else { network }
  (label-text(text(weight: "bold", network)), link-or-text(shown, url))
}) + other-fields.map(item => {
  let title = field(item, "title")
  let body = field(item, "text")
  let value = link-or-text(body, field(item, "url"))
  if title == "" or title == body {
    (grid.cell(colspan: 2, value),)
  } else {
    (label-text(text(weight: "bold", title)), value)
  }
})

#let education-rows = education.map(entry => {
  // The renderer joins degree and area with ", "; Japanese reads better spaced.
  let degree = field(entry, "subtitle")
  if has-cjk(degree) {
    degree = degree.replace(", ", " ")
  }
  let bullets = strings-of(entry, "bullets")
  (
    period-text(field(entry, "date")),
    [#link-or-text(field(entry, "title"), field(entry, "url"))#if degree != "" [#h(1em)#degree]#if bullets.len() > 0 {
        block(above: 0.5em, list(..bullets.map(safe-markup)))
      }],
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

#if project-rows.len() > 0 [
  = 主なプロジェクト
  #label-grid(project-rows)
]

#if skill-rows.len() > 0 [
  = 活かせる経験・知識・技術
  #table(columns: (label-width + 10mm, 1fr), align: left + horizon, ..skill-rows.flatten())
] else if bare-skills.len() > 0 [
  = 活かせる経験・知識・技術
  #bare-skills.join(list-separator)
]

#if certification-rows.len() > 0 [
  = 資格
  #label-grid(certification-rows)
]

#if award-rows.len() > 0 [
  = 受賞歴
  #label-grid(award-rows)
]

#if language-rows.len() > 0 [
  = 語学
  #label-grid(language-rows)
]

#if education-rows.len() > 0 [
  = 学歴
  #label-grid(education-rows)
]

#if publication-rows.len() > 0 [
  = 著作・発表
  #label-grid(publication-rows)
]

#if volunteer-rows.len() > 0 [
  = ボランティア活動
  #label-grid(volunteer-rows)
]

#if other-rows.len() > 0 [
  = その他
  #label-grid(other-rows)
]

#if self-pr != "" [
  = 自己PR
  #for paragraph in self-pr.split(regex("\\n+")).map(part => part.trim()).filter(part => part != "") {
    par(paragraph)
  }
]

#v(1.2em)
#align(right)[以上]
