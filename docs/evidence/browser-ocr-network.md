# Browser OCR — network evidence

A record of what actually crossed the network while EasyInvoiceOCR read an
invoice. The product's central claim is that recognition happens in the
visitor's browser and the document itself is not uploaded. Reading the source is
not proof of that; watching the network is. This is the capture.

Nothing here contains real invoices, personal data, credentials, cookies or
tokens. Both test documents were generated for this test.

## Environment

| | |
| --- | --- |
| Date | 2026-08-31 |
| Target | `https://www.easyinvoiceocr.com` (production) |
| Deployed commit | `36385ae` |
| Surface | `/en/app` — the authenticated extraction workspace |
| Browser | Chrome, desktop, signed in to a normal account |
| Observers | Chrome DevTools protocol network log **and** an in-page `fetch`/`XMLHttpRequest`/`sendBeacon` wrapper recording request bodies |

Two independent observers were used on purpose. The DevTools log sees requests
the page never initiates itself — a worker fetching its own assets, for example
— while the in-page wrapper is the one that can read a request *body* and say
what was in it.

## Test inputs

Both synthetic, both containing invented companies and amounts.

| File | Type | Size | Contents |
| --- | --- | --- | --- |
| `synthetic-invoice-test.png` | image/png | 61,640 B | Rendered invoice: "Globex Test Supplies Ltd", INV-2026-0777, three line items, USD 600.00 |
| `invoice-a.pdf` | application/pdf | 1,682 B | Text-layer invoice: "Northwind Supplies Ltd", INV-2026-0042, three line items, EUR 892.20 |

## Control test

A capture that reports "no requests" is worthless until you have shown the
capture can see a request at all. So before each run, a deliberate request was
sent with a body that is not user data:

```
POST /robots.txt?phase1_control=1
body: "CONTROL-TEST-PAYLOAD-NOT-USER-DATA"   (34 bytes)
→ 405
```

Both observers recorded it, and the in-page wrapper reported the body back
verbatim, with its exact byte length. That is the part that matters: the
instrument demonstrably reads request bodies, so a document in a request body
would have been visible. The control was repeated before the second run.

## Run A — image

Selected `synthetic-invoice-test.png` (61,640 B), waited for recognition to
finish and the export controls to appear.

Result: completed. Reported recognition confidence 94%. Extracted
`INV-2026-0777`, `2026-08-10`, `2026-09-10`, subtotal `500.00`, tax `100.00`,
total `600.00`, and the three line-item descriptions — the values that were
drawn into the image.

Requests during the run: **one.**

| Destination | Origin | Method | Body | Size |
| --- | --- | --- | --- | --- |
| `/_serverFn/c36d35b1…` (`getConversionGate`) | same | GET | none | 0 |

## Run B — PDF

Selected `invoice-a.pdf` (1,682 B) and waited for the same completion state.

Result: completed. Extracted `INV-2026-0042`, `2026-08-15`, `2026-09-15`,
subtotal `743.50`, tax `148.70`, total `892.20`, and the line items.

Requests during the run: **five, all GET.**

| Destination | Origin | Method | Body | What it is |
| --- | --- | --- | --- | --- |
| `/_serverFn/c36d35b1…` ×2 | same | GET | none | `getConversionGate` — entitlement lookup |
| `/assets/pdf-DXDvzJ3j.js` | same | GET | none | pdf.js, lazy-loaded |
| `/assets/pdf.worker-B_1uJmeK.js` | same | GET | none | pdf.js worker |
| `/assets/pdf.worker-CLesOks4.mjs` | same | GET | none | pdf.js worker module |

The three asset requests are the application fetching its own code the first
time a PDF is opened. They carry no request body and travel in the wrong
direction to be an upload.

## What was looked for, and not found

Across both runs, in both observers:

| Looked for | Found |
| --- | --- |
| Any POST, PUT or PATCH | none |
| `multipart/form-data` | none |
| `FormData` body | none |
| `Blob` body | none |
| `ArrayBuffer` / typed-array body | none |
| Base64 or `data:` payload | none |
| `image/png` or `application/pdf` request body | none |
| Request carrying the original filename | none |
| Supabase Storage, signed upload URL, object storage | never contacted |
| External OCR API | never contacted |
| `sendBeacon` | none |

Every request in both runs was a GET. A GET has no body, so no request observed
during either run was capable of carrying a document.

### The `_serverFn` calls

Two distinct server functions appeared, both GET and both with an empty body:

- `685c84e4…` — `getBillingState`, seen once when a file was selected
- `c36d35b1…` — `getConversionGate`, the quota decision

These are classified **document metadata only — in fact not even that**: as GETs
they sent nothing at all. The entitlement question is asked before the document
is touched, which is also why quota can be refused without the file ever being
read.

### Third-party traffic

During the two OCR runs: **none**. Not "small", not "harmless" — zero.

On ordinary page load, outside the runs, the site does contact
`fonts.googleapis.com` and `fonts.gstatic.com` for webfonts. Those requests
carry no document data, but they are third-party and are recorded here so this
document does not overstate the case.

## What this establishes

For the paths actually exercised — **image and PDF invoice extraction on
`/en/app`** — the original document, and any representation of its contents,
stayed in the browser. Recognition produced correct field values with no
request capable of carrying the document.

## Limitations

This is the part worth reading twice.

- Only two paths were tested: image OCR and PDF OCR in the authenticated
  workspace. A separate earlier capture covered the Merge PDF tool, which also
  transmitted nothing.
- **Not tested:** PDF to Word, Image to Word, Image to PDF, Receipt to Excel,
  PDF Invoice Parser, and the remaining PDF tools. Evidence from one pipeline
  does not transfer to another, and this document does not claim it does.
- One document per format. No multi-page, very large, or malformed input.
- One browser, one machine, one network, one day.
- Export to XLSX/CSV/JSON was offered but not clicked; the export path is
  therefore untested here.

The honest form of the claim is: *for image and PDF invoice extraction, the
document is processed in the browser and is not uploaded* — not the broader
"nothing is ever uploaded", which these two runs do not establish.

## Reproducing this

1. Sign in and open `/en/app`.
2. Open DevTools → Network, preserve log, and clear it.
3. Send a deliberate request with a known body and confirm the log shows it,
   body included. If it does not, stop — the instrument is not working.
4. Clear the log.
5. Choose a synthetic invoice image. Wait for the extracted fields to appear.
6. Inspect every request: method, size, and payload. A GET cannot carry a body.
7. Repeat with a synthetic PDF invoice.
8. Filter for `storage`, `upload`, `supabase`, and any host that is not the
   site's own origin.

The first recognition on a cold cache downloads the WebAssembly core, which is
several megabytes; allow for that before concluding anything has failed.
