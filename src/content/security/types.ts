/**
 * The security page, one locale at a time.
 *
 * Every claim on this page is checked against the codebase before it is
 * written. The page's whole purpose is to be believed, so a sentence that
 * cannot be pointed at a line of code or a configuration value does not belong
 * on it — and a reader who finds one wrong stops believing the rest.
 *
 * Deliberately absent, because nothing in this project supports them: named
 * cipher suites, ISO 27001, SOC 2, PCI DSS as a claim about *this* service,
 * GDPR or HIPAA compliance, penetration testing, zero data retention, and any
 * response-time promise for a security report.
 *
 * The three locales are written, not translated. Arabic and French readers get
 * prose composed for them rather than English rearranged.
 */

export type SecurityPillar = {
  /** Matches a key in the route's icon map. */
  icon: "shield" | "lock" | "file" | "server";
  title: string;
  body: string;
};

export type SecurityPoint = {
  title: string;
  body: string;
};

export type SecurityStep = {
  /** Matches a key in the route's icon map. */
  icon: "upload" | "cpu" | "table" | "download";
  title: string;
  body: string;
};

export type SecurityStage = {
  title: string;
  body: string;
};

export type SecurityContent = {
  /** Small label above the page title. */
  eyebrow: string;
  title: string;
  lede: string;
  /** Short line shown inside the hero panel, beside the mark. */
  heroNote: string;

  overview: { title: string; lede: string; pillars: SecurityPillar[] };
  encryption: { title: string; lede: string; points: string[] };
  account: { title: string; lede: string; points: SecurityPoint[] };
  documents: { title: string; lede: string; steps: SecurityStep[]; note: string };
  infrastructure: { title: string; lede: string; points: SecurityPoint[] };
  access: { title: string; lede: string; body: string[] };
  payments: { title: string; lede: string; points: string[] };
  monitoring: { title: string; lede: string; stages: SecurityStage[] };
  userTips: { title: string; lede: string; tips: string[] };
  report: { title: string; body: string; cta: string };
  finalCta: { title: string; body: string; cta: string };
};
