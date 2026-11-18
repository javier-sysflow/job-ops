import "i18next";
import type { en } from "./locales/en";

// Typed keys: t("jobs:list.empty") fails type-checking if the key does not
// exist in the English resources.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof en;
    returnNull: false;
  }
}
