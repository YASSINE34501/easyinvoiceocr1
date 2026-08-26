/**
 * The accepted payment methods, shown in the footer bottom bar on every page.
 *
 * The wordmarks carry direction="ltr" explicitly. An SVG text element inherits
 * the page direction, and under dir="rtl" the glyphs are laid out from x="0"
 * leftwards — outside the viewBox, so Visa and PayPal rendered as empty tiles
 * on the Arabic site while Mastercard, being pure geometry, was unaffected.
 * A brand wordmark reads left to right in every language.
 *
 * Deliberately small and unlabelled: an indicator that payment is possible,
 * sitting between the copyright and the cookie settings without asking for more
 * room than either.
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
        direction="ltr"
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
        direction="ltr"
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

/**
 * @param label Names the group for assistive technology. It is not rendered:
 * the bar carries no visible heading, and an unlabelled row of three logos
 * announces as nothing useful.
 */
export function PaymentMarks({ label }: { label: string }) {
  return (
    <ul
      aria-label={label}
      /* No direction handling of its own. The bar is a flex row, so the browser
         mirrors the order under dir="rtl" and Visa lands at the reading start,
         while the marks inside are never transformed — a logo is never shown
         backwards. */
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {MARKS.map((Mark, i) => (
        <li
          key={i}
          className="grid h-7 w-[58px] place-items-center rounded-md border border-border bg-card"
        >
          <Mark />
        </li>
      ))}
    </ul>
  );
}
