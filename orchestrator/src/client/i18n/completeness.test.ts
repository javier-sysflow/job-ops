import { describe, expect, it } from "vitest";
import { en } from "./locales/en";
import { ja } from "./locales/ja";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out.set(path, value);
    } else {
      for (const [childPath, childValue] of flatten(value, path)) {
        out.set(childPath, childValue);
      }
    }
  }
  return out;
}

const placeholders = (value: string) =>
  [...value.matchAll(/\{\{\s*([\w.]+)[^}]*\}\}/g)]
    .map((match) => match[1])
    .sort();

// Plural forms differ by language (English _one/_other, Japanese _other only).
const normalizeKey = (key: string) =>
  key.replace(/_(zero|one|two|few|many|other)$/, "");

describe("translations", () => {
  const enFlat = flatten(en as unknown as Tree);
  const jaFlat = flatten(ja as unknown as Tree);

  it("has a Japanese string for every English key", () => {
    const jaKeys = new Set([...jaFlat.keys()].map(normalizeKey));
    const missing = [...enFlat.keys()]
      .map(normalizeKey)
      .filter((key) => !jaKeys.has(key));
    expect([...new Set(missing)]).toEqual([]);
  });

  it("uses the same {{placeholders}} in both languages", () => {
    const mismatches: string[] = [];
    for (const [key, enValue] of enFlat) {
      const jaValue =
        jaFlat.get(key) ?? jaFlat.get(`${normalizeKey(key)}_other`);
      if (jaValue === undefined) continue;
      if (placeholders(enValue).join() !== placeholders(jaValue).join()) {
        mismatches.push(key);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("has no empty Japanese strings", () => {
    const empty = [...jaFlat.entries()]
      .filter(([, value]) => !value.trim())
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });
});
