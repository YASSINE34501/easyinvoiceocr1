/**
 * The accepted payment methods, shown once in the footer on every page.
 *
 * Only what can be paid with is listed. PayPal is the provider, and the SDK is
 * asked for the card funding source explicitly, which the live buttons confirm
 * as eligible — so Visa and Mastercard belong here. American Express, Apple Pay
 * and Google Pay are not shown: nothing in this project establishes that they
 * are available, and a payment method advertised in a footer and then missing
 * at checkout is worse than one that was never promised.
 *
 * The marks are drawn here rather than shipped as logo files. Mastercard's
 * interlocking circles are exact, being pure geometry, with the overlap
 * produced by clipping one circle against the other; Visa and PayPal are
 * wordmarks set in the page's own typeface rather than the custom lettering
 * each brand uses. That keeps the footer free of binaries and of logo files
 * that go stale, at the cost of not matching brand guidelines to the pixel.
 * The official artwork lives in each brand's own centre, together with the
 * usage rules that come with it.
 */

const WORDMARK_FONT =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function PayPalMark() {
  return (
    <svg
      viewBox="0 0 72 24"
      className="h-4 w-auto"
      role="img"
      aria-label="PayPal"
      focusable="false"
    >
      <text
        x="0"
        y="18"
        fontFamily={WORDMARK_FONT}
        fontSize="18"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="-0.5"
      >
        <tspan fill="#253B80">Pay</tspan>
        <tspan fill="#179BD7">Pal</tspan>
      </text>
    </svg>
  );
}

function VisaMark() {
  return (
    <svg viewBox="0 0 52 24" className="h-4 w-auto" role="img" aria-label="Visa" focusable="false">
      <text
        x="0"
        y="18"
        fontFamily={WORDMARK_FONT}
        fontSize="18"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="0.5"
        fill="#1434CB"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg
      viewBox="0 0 32 24"
      className="h-4 w-auto"
      role="img"
      aria-label="Mastercard"
      focusable="false"
    >
      <defs>
        {/* Clipping one circle against the other gives the exact lens shape
            rather than an approximation of it. */}
        <clipPath id="eio-mc-overlap">
          <circle cx="12" cy="12" r="9" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9" fill="#EB001B" />
      <circle cx="20" cy="12" r="9" fill="#F79E1B" />
      <circle cx="20" cy="12" r="9" fill="#FF5F00" clipPath="url(#eio-mc-overlap)" />
    </svg>
  );
}

const MARKS = [VisaMark, MastercardMark, PayPalMark] as const;

export function PaymentMarks({ label }: { label: string }) {
  return (
    /* Its own strip above the copyright line, separated by the same hairline
       the footer already uses between its other bands. */
    <div className="border-t border-border/70">
      <div className="mx-auto max-w-[1200px] px-4 py-7 text-center sm:px-6">
        {/* A paragraph, not a heading. This strip is on every page, and a
            heading here would insert an entry into every page outline that has
            nothing to do with that page. The list is associated with the label
            instead, so a screen reader still announces what the marks are. */}
        <p
          id="footer-payment-methods"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </p>
        {/* Wraps on a narrow screen instead of overflowing; the marks stay the
            same small size at every width. */}
        <ul
          aria-labelledby="footer-payment-methods"
          className="mt-4 flex flex-wrap items-center justify-center gap-3"
        >
          {MARKS.map((Mark, i) => (
            <li
              key={i}
              className="grid h-9 w-[68px] place-items-center rounded-lg border border-border bg-card px-3 shadow-panel"
            >
              <Mark />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
