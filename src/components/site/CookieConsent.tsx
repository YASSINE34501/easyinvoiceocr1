import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppLink } from "./AppLink";
import { path } from "@/config/nav";
import { useLocale, useT } from "@/i18n/useLocale";

const STORAGE_KEY = "eio.cookie-consent.v1";
const OPEN_EVENT = "eio:open-cookie-preferences";
const CHANGED_EVENT = "eio:consent-changed";

export type ConsentState = {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

/**
 * Category ids paired with their message keys.
 *
 * The copy lives in the dictionaries. This component previously hard-coded
 * English, so the consent banner — a legal surface — rendered in English on
 * every French and Arabic page, even though every cookie.* key was already
 * translated in all three dictionaries and simply unused.
 */
const CATEGORIES = [
  { id: "essential" as const, nameKey: "cookie.essential", bodyKey: "cookie.essentialBody" },
  { id: "preferences" as const, nameKey: "cookie.preferences", bodyKey: "cookie.preferencesBody" },
  { id: "analytics" as const, nameKey: "cookie.analytics", bodyKey: "cookie.analyticsBody" },
  { id: "marketing" as const, nameKey: "cookie.marketing", bodyKey: "cookie.marketingBody" },
] as const;

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

/** Called from the footer so users can change their mind at any time. */
export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

function save(state: Omit<ConsentState, "essential" | "decidedAt">) {
  const value: ConsentState = { essential: true, ...state, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable — the banner will simply ask again next visit */
  }
  // Anything gated on consent (currently advertising) re-evaluates immediately,
  // so a rejection takes effect without a page reload.
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  return value;
}

function subscribeToConsent(onChange: () => void) {
  window.addEventListener(CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The raw string is the store snapshot: comparing parsed objects would return a
// new reference on every render and loop.
function consentSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Current consent decision, or null when the visitor has not chosen yet.
 * Server-rendered output always sees null, so nothing consent-gated is ever
 * present in the initial HTML.
 */
export function useConsent(): ConsentState | null {
  const raw = useSyncExternalStore(subscribeToConsent, consentSnapshot, () => "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const t = useT();
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefs, setPrefs] = useState({ preferences: false, analytics: false, marketing: false });

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setPrefs({
        preferences: existing.preferences,
        analytics: existing.analytics,
        marketing: existing.marketing,
      });
    } else {
      setVisible(true);
    }

    const onOpen = () => {
      const current = readConsent();
      if (current) {
        setPrefs({
          preferences: current.preferences,
          analytics: current.analytics,
          marketing: current.marketing,
        });
      }
      setDialogOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const decide = (state: { preferences: boolean; analytics: boolean; marketing: boolean }) => {
    save(state);
    setPrefs(state);
    setVisible(false);
    setDialogOpen(false);
  };

  return (
    <>
      {visible && (
        <div
          role="region"
          aria-label={t("cookie.regionLabel")}
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card p-4 shadow-panel sm:p-5"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-[720px] text-sm leading-relaxed text-muted-foreground">
              {t("cookie.body")}{" "}
              <AppLink
                href={path("cookies", locale)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("cookie.policyLink")}
              </AppLink>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="min-h-11 rounded-lg"
                onClick={() => setDialogOpen(true)}
              >
                {t("cookie.manage")}
              </Button>
              <Button
                variant="outline"
                className="min-h-11 rounded-lg"
                onClick={() => decide({ preferences: false, analytics: false, marketing: false })}
              >
                {t("cookie.rejectAll")}
              </Button>
              <Button
                className="min-h-11 rounded-lg font-semibold"
                onClick={() => decide({ preferences: true, analytics: true, marketing: true })}
              >
                {t("cookie.acceptAll")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cookie.title")}</DialogTitle>
            <DialogDescription>{t("cookie.dialogDesc")}</DialogDescription>
          </DialogHeader>

          <ul className="space-y-4">
            {CATEGORIES.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{t(c.nameKey)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(c.bodyKey)}
                  </p>
                </div>
                <Switch
                  checked={c.id === "essential" ? true : prefs[c.id]}
                  disabled={c.id === "essential"}
                  aria-label={t(c.nameKey)}
                  onCheckedChange={(v) =>
                    c.id !== "essential" && setPrefs((p) => ({ ...p, [c.id]: v }))
                  }
                />
              </li>
            ))}
          </ul>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              className="min-h-11 rounded-lg"
              onClick={() => decide({ preferences: false, analytics: false, marketing: false })}
            >
              {t("cookie.rejectAll")}
            </Button>
            <Button className="min-h-11 rounded-lg font-semibold" onClick={() => decide(prefs)}>
              {t("cookie.savePrefs")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
