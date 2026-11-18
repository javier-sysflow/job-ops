import i18n from "@client/i18n";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 100;
const MAX_CHARACTERS = 40_000;

export async function extractPdfJobDescription(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error(i18n.t("jobDetail:pdf.extract.chooseFile"));
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(i18n.t("jobDetail:pdf.extract.tooLarge"));
  }

  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();
  const task = getDocument({
    data: await file.arrayBuffer(),
  });
  try {
    let document: Awaited<typeof task.promise>;
    try {
      // No onPassword callback: PDF.js rejects encrypted files without a prompt.
      document = await task.promise;
    } catch {
      throw new Error(i18n.t("jobDetail:pdf.extract.unreadable"));
    }
    if (document.numPages > MAX_PAGES) {
      throw new Error(i18n.t("jobDetail:pdf.extract.tooManyPages"));
    }
    const pages: string[] = [];
    let length = 0;
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      try {
        const content = await page.getTextContent();
        const text = content.items
          .map((item) =>
            "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "",
          )
          .join("")
          .replace(/[ \t]+\n/g, "\n")
          .trim();
        length += text.length + (pages.length ? 2 : 0);
        if (length > MAX_CHARACTERS) {
          throw new Error(i18n.t("jobDetail:pdf.extract.tooManyCharacters"));
        }
        pages.push(text);
      } finally {
        page.cleanup();
      }
    }
    const text = pages.join("\n\n").trim();
    if (!text) {
      throw new Error(i18n.t("jobDetail:pdf.extract.noText"));
    }
    return text;
  } finally {
    await task.destroy();
  }
}
