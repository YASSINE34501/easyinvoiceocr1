import type { SecurityContent } from "./types";

/**
 * English security copy.
 *
 * What each claim rests on, so a future edit can check it rather than trust it:
 *
 *  - "never uploaded" — there is no upload path in the codebase. The only call
 *    touching storage is a delete in conversions.functions.ts; the
 *    input/output path columns are read for cleanup and never written.
 *  - password rules — the sign-up schema requires at least eight characters
 *    with a letter and a digit, and Supabase refuses passwords found in known
 *    breach corpora.
 *  - "verified email" — claiming the free allowance checks email_confirmed_at.
 *  - row-level security — 31 policies across the migrations; cross-account
 *    isolation was confirmed against the live database, including an attempt to
 *    read and to modify another account's rows.
 *  - payments — the browser is given only the public client id and a plan id
 *    the server chose; card details are entered on PayPal's own pages.
 *  - webhooks — every delivery is verified with PayPal before anything is
 *    stored, and a redelivery is a no-op through a unique index.
 */
export const securityEn: SecurityContent = {
  eyebrow: "Security",
  title: "Security & Privacy",
  lede: "Protecting your documents and data is at the heart of EasyInvoiceOCR. This page describes what we actually do — not what sounds reassuring.",
  heroNote: "Your documents are read in your browser. They are never uploaded to us.",

  overview: {
    title: "Multi-Layer Protection",
    lede: "Security is not one feature. It is a set of decisions made at every layer, from where your file is opened to who can read a row in the database.",
    pillars: [
      {
        icon: "file",
        title: "Document Protection",
        body: "Recognition and conversion run in your browser. Your file is opened locally, processed locally, and the result is saved by you — it never travels to our servers.",
      },
      {
        icon: "shield",
        title: "Account Security",
        body: "Sign-in is handled by Supabase Auth. Passwords are hashed, never stored in readable form, and checked against known breach corpora before they are accepted.",
      },
      {
        icon: "lock",
        title: "Data Protection",
        body: "Every connection uses HTTPS, enforced by a strict transport policy. What we do store is limited to what running your account requires.",
      },
      {
        icon: "server",
        title: "Secure Infrastructure",
        body: "Managed PostgreSQL with row-level security, service credentials that never reach the browser, and a deployment that fails closed when configuration is incomplete.",
      },
    ],
  },

  encryption: {
    title: "Data Encryption",
    lede: "Encryption matters in two places: while data is moving, and while it is sitting still.",
    points: [
      "Every request between your browser and our servers travels over HTTPS. The site sends a strict transport policy, so a browser that has visited once will refuse to connect over plain HTTP afterwards.",
      "Your account data is held in managed PostgreSQL on Supabase, which encrypts stored data and backups at the platform level.",
      "Passwords are never stored as text. Supabase Auth stores a salted hash, and a password that appears in a known breach corpus is refused at sign-up.",
      "Payment card details never reach us at all, so there is nothing on our side to encrypt: they are entered on PayPal's own pages.",
    ],
  },

  account: {
    title: "Account Security",
    lede: "The controls that stand between your account and someone who wants into it.",
    points: [
      {
        title: "Password requirements",
        body: "At least eight characters, including a letter and a digit. Passwords found in known breach corpora are refused outright rather than merely discouraged.",
      },
      {
        title: "Sign in with Google",
        body: "You can use Google instead of a password. Authentication happens on Google's pages and we never see your Google credentials.",
      },
      {
        title: "Verified email addresses",
        body: "Your address must be confirmed before the free allowance can be claimed, which keeps an unverified address from being used to create usable accounts in bulk.",
      },
      {
        title: "Password recovery",
        body: "Reset links are sent to your address and expire. Requesting a reset for an address that has no account returns the same response as one that does, so the form cannot be used to discover who has an account.",
      },
      {
        title: "Sessions",
        body: "Sessions expire and refresh on their own. Signing out clears the session and everything cached about your account in that browser.",
      },
      {
        title: "Neutral error messages",
        body: "Signing up with an address that already exists does not say so. Confirming it would let anyone test a list of addresses against our user base.",
      },
    ],
  },

  documents: {
    title: "Document & File Protection",
    lede: "An invoice is a business record. It carries names, addresses, amounts and terms, and a converter that quietly kept a copy would be a poor place to send one.",
    steps: [
      {
        icon: "upload",
        title: "You choose a file",
        body: "The file is opened by the browser from your own disk. No request carries it anywhere.",
      },
      {
        icon: "cpu",
        title: "It is processed locally",
        body: "PDF reading and text recognition run as WebAssembly inside the page. Only the recognition engine and its language data are downloaded.",
      },
      {
        icon: "table",
        title: "Data is extracted",
        body: "Fields, tables and totals are assembled in memory, in the tab you are looking at.",
      },
      {
        icon: "download",
        title: "You save the result",
        body: "The finished spreadsheet or document is written by your browser straight to your device.",
      },
    ],
    note: "We record that a conversion happened — which tool, how many pages, whether it succeeded — because quota has to be counted somewhere the browser cannot edit. That record holds no page content and no file. There is no upload path in this application at all.",
  },

  infrastructure: {
    title: "Infrastructure Built with Security in Mind",
    lede: "The parts of the system you never see, and the rules they follow.",
    points: [
      {
        title: "Authentication",
        body: "Supabase Auth issues and validates every session. Server code verifies the token on each request and derives your identity from it, never from anything the page sends.",
      },
      {
        title: "Database",
        body: "Managed PostgreSQL. The browser connects with a publishable key that is subject to row-level security; the key that bypasses those rules exists only on the server.",
      },
      {
        title: "Transport",
        body: "HTTPS throughout, with a strict transport policy. Certificates are managed by the platform and renewed automatically.",
      },
      {
        title: "Fail-closed configuration",
        body: "Where a missing setting could cause harm, the feature refuses to run rather than guessing. Live checkout, for one, stays shut unless every credential is present and the account owner has explicitly enabled it.",
      },
    ],
  },

  access: {
    title: "Access Control",
    lede: "Your data should be reachable by you and by nobody else — and that has to be enforced somewhere better than the user interface.",
    body: [
      "Every private table is governed by PostgreSQL row-level security. The rules live in the database, so they apply to every query regardless of which part of the application asked, and they hold even if application code has a bug.",
      "The rule is the same across your conversions, subscription, usage counters and notifications: a row is yours only when its owner matches the account making the request. A query for someone else's rows does not fail with an error — it simply returns nothing.",
      "Administrative screens grant nothing by being reached. Every administrative action re-checks the role in the database before it does anything.",
    ],
  },

  payments: {
    title: "Payment Security",
    lede: "Subscriptions are handled by PayPal, and the split of responsibilities is deliberate.",
    points: [
      "Card and bank details are entered on PayPal's pages. They never pass through this site and we never store them.",
      "The browser receives only PayPal's public client identifier and the plan the server selected. A plan or a price sent from the page is not accepted.",
      "When PayPal reports an approved subscription, the server confirms it directly with PayPal before granting anything, and rejects a subscription that is not on the plan we authorised.",
      "Every webhook from PayPal is verified with PayPal before it is stored or acted on, and a redelivery of the same event changes nothing a second time.",
    ],
  },

  monitoring: {
    title: "Security Is an Ongoing Process",
    lede: "Software that was secure on the day it shipped is not therefore secure today.",
    stages: [
      {
        title: "Review",
        body: "Changes touching authentication, billing or access rules are examined for what they let through, not only for whether they work.",
      },
      {
        title: "Monitor",
        body: "Failures in payment and webhook handling are logged with enough detail to diagnose them and no more — never payloads, never credentials.",
      },
      {
        title: "Update",
        body: "Dependencies are kept current, with the versions that must not move pinned deliberately and for a written reason.",
      },
      {
        title: "Improve",
        body: "Weaknesses found in review are fixed at the cause and covered by a test, so the same gap cannot reopen unnoticed.",
      },
    ],
  },

  userTips: {
    title: "Help Keep Your Account Secure",
    lede: "A few habits that matter more than anything we can do on our side.",
    tips: [
      "Use a strong password you have not used anywhere else, or sign in with Google.",
      "Never share your sign-in details, and be wary of anyone who asks for them.",
      "Sign out when you finish on a shared or public computer.",
      "Tell us if you see activity on your account that you do not recognise.",
    ],
  },

  report: {
    title: "Found a Security Issue?",
    body: "If you believe you have found a vulnerability, please tell us privately before telling anyone else. Use the contact form and mention security in your message — describing what you found and how to reproduce it helps us confirm and fix it quickly.",
    cta: "Contact us",
  },

  finalCta: {
    title: "Security You Can Trust",
    body: "Your documents stay on your device, your account is yours alone, and every claim on this page describes something the software actually does.",
    cta: "Get started free",
  },
};
