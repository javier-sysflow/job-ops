import type { SsoProvider } from "@shared/types";
import {
  Github,
  Google,
  type IconComponent,
  KeyRound,
} from "@/components/icons";

/**
 * Brand marks come from the bundled MingCute set (no icon fonts or remote
 * icon packs, which would phone home from the sign-in page).
 */
export const SSO_PROVIDER_ICONS: Record<SsoProvider, IconComponent> = {
  google: Google,
  github: Github,
  oidc: KeyRound,
};
