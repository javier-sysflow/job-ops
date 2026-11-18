import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  detectInitialUiLanguage,
  isUiLanguage,
  persistUiLanguage,
  setCurrentUiLanguage,
  UI_LANGUAGES,
  type UiLanguage,
} from "./language";
import { en } from "./locales/en";
import { ja } from "./locales/ja";

export const defaultNS = "common";
export const resources = { en, ja } as const;

const initialLanguage = detectInitialUiLanguage();
setCurrentUiLanguage(initialLanguage);

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: [...UI_LANGUAGES],
  defaultNS,
  ns: Object.keys(en),
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
  initAsync: false,
});

i18n.on("languageChanged", (language) => {
  if (isUiLanguage(language)) setCurrentUiLanguage(language);
});

export function changeUiLanguage(language: UiLanguage): void {
  persistUiLanguage(language);
  void i18n.changeLanguage(language);
}

export { i18n };
export default i18n;
