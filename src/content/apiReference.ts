import type { CodeSamples } from "@/components/site/CodeBlock";

export const API_BASE_URL = "https://api.easyinvoiceocr.com/v1";
export const API_VERSION = "2026-01-15";

export type Endpoint = {
  id: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  name: string;
  status: "planned";
  description: string;
  parameters: {
    name: string;
    in: "path" | "query" | "body";
    type: string;
    required: boolean;
    description: string;
  }[];
  headers: { name: string; description: string }[];
  samples: CodeSamples;
  response: string;
  errors: { code: string; status: number; when: string }[];
};

const authHeader = { name: "Authorization", description: "Bearer YOUR_API_KEY" };
const versionHeader = {
  name: "X-API-Version",
  description: `Pinned API version, e.g. ${API_VERSION}`,
};

export const endpoints: Endpoint[] = [
  {
    id: "upload-document",
    method: "POST",
    path: "/documents",
    name: "Upload a document",
    status: "planned",
    description:
      "Submits an invoice or receipt for extraction. Returns immediately with a document id and a queued status; extraction is retrieved separately once processing finishes.",
    parameters: [
      {
        name: "file",
        in: "body",
        type: "file (multipart)",
        required: true,
        description: "PDF, JPG, PNG or WebP, maximum 20 MB.",
      },
      {
        name: "type",
        in: "body",
        type: "string",
        required: false,
        description: "invoice | receipt | table. Defaults to invoice.",
      },
      {
        name: "locale_hint",
        in: "body",
        type: "string",
        required: false,
        description: "BCP-47 hint such as en-GB or ar-SA to help number and date parsing.",
      },
    ],
    headers: [
      authHeader,
      versionHeader,
      {
        name: "Idempotency-Key",
        description:
          "Optional client-generated key; a retry with the same key returns the original document instead of creating a duplicate.",
      },
    ],
    samples: {
      curl: `curl -X POST ${API_BASE_URL}/documents \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-API-Version: ${API_VERSION}" \\
  -H "Idempotency-Key: 7f1c0b2e-4a6d-4f0b-9d3a-2b8c1e5f7a90" \\
  -F "file=@invoice.pdf" \\
  -F "type=invoice"`,
      javascript: `const body = new FormData();
body.append("file", file);          // a File from an <input type="file">
body.append("type", "invoice");

const res = await fetch("${API_BASE_URL}/documents", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "X-API-Version": "${API_VERSION}",
  },
  body,
});

const document = await res.json();
console.log(document.id, document.status);`,
      python: `import requests

with open("invoice.pdf", "rb") as f:
    res = requests.post(
        "${API_BASE_URL}/documents",
        headers={
            "Authorization": "Bearer YOUR_API_KEY",
            "X-API-Version": "${API_VERSION}",
        },
        files={"file": f},
        data={"type": "invoice"},
        timeout=60,
    )

res.raise_for_status()
print(res.json()["id"])`,
    },
    response: `{
  "id": "doc_3kQ9x2Lp",
  "status": "queued",
  "type": "invoice",
  "filename": "invoice.pdf",
  "pages": 2,
  "bytes": 184320,
  "created_at": "2026-08-03T10:14:22Z"
}`,
    errors: [
      { code: "unauthorized", status: 401, when: "Missing or revoked API key." },
      { code: "unsupported_media_type", status: 415, when: "File is not a PDF, JPG, PNG or WebP." },
      { code: "payload_too_large", status: 413, when: "File exceeds 20 MB." },
      { code: "quota_exceeded", status: 402, when: "Monthly page allowance is used up." },
      { code: "rate_limited", status: 429, when: "Too many requests for this key." },
    ],
  },
  {
    id: "get-status",
    method: "GET",
    path: "/documents/{id}",
    name: "Get processing status",
    status: "planned",
    description:
      "Returns the current state of a document: queued, processing, completed or failed. Poll this until status is completed before requesting the extraction.",
    parameters: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "Document id returned at upload.",
      },
    ],
    headers: [authHeader, versionHeader],
    samples: {
      curl: `curl ${API_BASE_URL}/documents/doc_3kQ9x2Lp \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      javascript: `const res = await fetch("${API_BASE_URL}/documents/doc_3kQ9x2Lp", {
  headers: { Authorization: "Bearer YOUR_API_KEY" },
});
const { status } = await res.json();`,
      python: `import requests

res = requests.get(
    "${API_BASE_URL}/documents/doc_3kQ9x2Lp",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    timeout=30,
)
print(res.json()["status"])`,
    },
    response: `{
  "id": "doc_3kQ9x2Lp",
  "status": "completed",
  "pages": 2,
  "processing_ms": 4120,
  "completed_at": "2026-08-03T10:14:27Z"
}`,
    errors: [
      { code: "not_found", status: 404, when: "No document with that id belongs to this key." },
      { code: "unauthorized", status: 401, when: "Missing or revoked API key." },
    ],
  },
  {
    id: "get-extraction",
    method: "GET",
    path: "/documents/{id}/extraction",
    name: "Retrieve the extraction",
    status: "planned",
    description:
      "Returns the structured result: invoice-level fields with confidence values, and the line-item array. Available once status is completed.",
    parameters: [
      { name: "id", in: "path", type: "string", required: true, description: "Document id." },
      {
        name: "include_raw_text",
        in: "query",
        type: "boolean",
        required: false,
        description: "Also return the raw recognised text per page.",
      },
    ],
    headers: [authHeader, versionHeader],
    samples: {
      curl: `curl "${API_BASE_URL}/documents/doc_3kQ9x2Lp/extraction" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      javascript: `const res = await fetch(
  "${API_BASE_URL}/documents/doc_3kQ9x2Lp/extraction",
  { headers: { Authorization: "Bearer YOUR_API_KEY" } },
);
const extraction = await res.json();
console.log(extraction.fields.total.value);`,
      python: `import requests

res = requests.get(
    "${API_BASE_URL}/documents/doc_3kQ9x2Lp/extraction",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    timeout=30,
)
data = res.json()
print(data["fields"]["total"]["value"])`,
    },
    response: `{
  "document_id": "doc_3kQ9x2Lp",
  "currency": "GBP",
  "fields": {
    "vendor":         { "value": "Northwind Supplies Ltd", "confidence": 0.98 },
    "invoice_number": { "value": "INV-2026-04417",         "confidence": 0.97 },
    "invoice_date":   { "value": "2026-07-14",             "confidence": 0.96 },
    "due_date":       { "value": "2026-08-13",             "confidence": 0.89 },
    "subtotal":       { "value": "1840.00",                "confidence": 0.95 },
    "tax_amount":     { "value": "368.00",                 "confidence": 0.94 },
    "total":          { "value": "2208.00",                "confidence": 0.97 }
  },
  "line_items": [
    {
      "description": "Managed hosting — July",
      "quantity": 1,
      "unit_price": "1200.00",
      "tax": "240.00",
      "total": "1200.00",
      "page": 1
    }
  ]
}`,
    errors: [
      { code: "not_ready", status: 409, when: "Document is still queued or processing." },
      {
        code: "extraction_empty",
        status: 200,
        when: "Processing succeeded but no fields were readable; fields is an empty object.",
      },
      {
        code: "processing_failed",
        status: 422,
        when: "The document could not be processed (corrupt, encrypted or blank).",
      },
    ],
  },
  {
    id: "list-documents",
    method: "GET",
    path: "/documents",
    name: "List documents",
    status: "planned",
    description: "Returns documents belonging to the key, newest first, with cursor pagination.",
    parameters: [
      {
        name: "limit",
        in: "query",
        type: "integer",
        required: false,
        description: "1–100, default 25.",
      },
      {
        name: "cursor",
        in: "query",
        type: "string",
        required: false,
        description: "Cursor from the previous page's next_cursor.",
      },
      {
        name: "status",
        in: "query",
        type: "string",
        required: false,
        description: "Filter by queued, processing, completed or failed.",
      },
    ],
    headers: [authHeader, versionHeader],
    samples: {
      curl: `curl "${API_BASE_URL}/documents?limit=25&status=completed" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      javascript: `const res = await fetch(
  "${API_BASE_URL}/documents?limit=25&status=completed",
  { headers: { Authorization: "Bearer YOUR_API_KEY" } },
);
const { data, next_cursor } = await res.json();`,
      python: `import requests

res = requests.get(
    "${API_BASE_URL}/documents",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    params={"limit": 25, "status": "completed"},
    timeout=30,
)
print(len(res.json()["data"]))`,
    },
    response: `{
  "data": [
    { "id": "doc_3kQ9x2Lp", "status": "completed", "filename": "invoice.pdf" }
  ],
  "next_cursor": null
}`,
    errors: [
      {
        code: "invalid_request",
        status: 400,
        when: "limit outside 1–100, or an unknown status value.",
      },
      { code: "unauthorized", status: 401, when: "Missing or revoked API key." },
    ],
  },
  {
    id: "delete-document",
    method: "DELETE",
    path: "/documents/{id}",
    name: "Delete a document",
    status: "planned",
    description:
      "Permanently removes the stored file and its extraction record. Deletion is idempotent: deleting an already-deleted id returns 204.",
    parameters: [
      { name: "id", in: "path", type: "string", required: true, description: "Document id." },
    ],
    headers: [authHeader, versionHeader],
    samples: {
      curl: `curl -X DELETE ${API_BASE_URL}/documents/doc_3kQ9x2Lp \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      javascript: `await fetch("${API_BASE_URL}/documents/doc_3kQ9x2Lp", {
  method: "DELETE",
  headers: { Authorization: "Bearer YOUR_API_KEY" },
});`,
      python: `import requests

requests.delete(
    "${API_BASE_URL}/documents/doc_3kQ9x2Lp",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    timeout=30,
)`,
    },
    response: `204 No Content`,
    errors: [
      { code: "unauthorized", status: 401, when: "Missing or revoked API key." },
      { code: "forbidden", status: 403, when: "The document belongs to another workspace." },
    ],
  },
];

export const errorEnvelope = `{
  "error": {
    "code": "unsupported_media_type",
    "message": "Only PDF, JPG, PNG and WebP files are accepted.",
    "request_id": "req_8Zc1Nq4t"
  }
}`;

export const rateLimitHeaders = [
  { name: "X-RateLimit-Limit", description: "Requests permitted in the current window." },
  { name: "X-RateLimit-Remaining", description: "Requests left in the current window." },
  { name: "X-RateLimit-Reset", description: "Unix timestamp when the window resets." },
  { name: "Retry-After", description: "Seconds to wait, sent with every 429." },
];
