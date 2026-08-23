/**
 * The payment marks shown in the footer.
 *
 * These are simplified marks drawn here, not the brands' official logo files.
 * Mastercard's interlocking circles are exact because they are pure geometry;
 * Visa and PayPal are wordmarks set in the page's own typeface rather than the
 * custom lettering each brand uses. That is a deliberate trade: it keeps the
 * footer free of embedded binaries and of logo files that go stale, at the cost
 * of not being pixel-accurate to the brand guidelines. Anyone who needs the
 * official artwork should take it from the Visa, Mastercard and PayPal brand
 * centres, which also carry the usage rules that come with it.
 *
 * They are muted by default and come up to full colour on hover, so the footer
 * reads as information rather than as advertising.
 */

const WORDMARK_FONT =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function PayPalMark() {
  return (
    <svg
      viewBox="0 0 72 24"
      className="h-5 w-auto"
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
    <svg viewBox="0 0 52 24" className="h-5 w-auto" role="img" aria-label="Visa" focusable="false">
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
      className="h-5 w-auto"
      role="img"
      aria-label="Mastercard"
      focusable="false"
    >
      <defs>
        {/* The overlap is the left circle clipping the right one, which gives
            the exact lens shape rather than an approximation of it. */}
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

export function PaymentMarks({ label }: { label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {/* One group, so hovering anywhere in the row lifts all three together
          instead of making them flicker one at a time. */}
      <span className="group inline-flex items-center gap-3">
        {[PayPalMark, VisaMark, MastercardMark].map((Mark, i) => (
          <span
            key={i}
            className="opacity-60 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0"
          >
            <Mark />
          </span>
        ))}
      </span>
    </div>
  );
}
