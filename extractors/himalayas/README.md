# Himalayas extractor

Fetches remote jobs from the public [Himalayas jobs search API](https://himalayas.app/api).

- Filters by the run's selected country (ISO code), which Himalayas expands to roles
  open to people living there, including worldwide-remote roles. "Worldwide" runs use
  `worldwide=true`.
- Pages through results (20 per page, `sort=recent`) until the per-term budget
  (`jobspyResultsWanted`) is reached.
- Skips itself when the run excludes remote work.
- Optional `HIMALAYAS_API_KEY` raises the rate limit; 429 responses are retried
  using `Retry-After`.

Terms of use followed: Apply uses `applicationLink` unchanged, every job keeps its
Himalayas URL as `jobUrl` (link back), and expired jobs are dropped. Do not pass these
jobs on to other job boards or aggregators.
