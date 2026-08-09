import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { CodeBlock, CodeTabs } from "@/components/site/CodeBlock";
import { AppLink } from "@/components/site/AppLink";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  API_BASE_URL,
  API_VERSION,
  endpoints,
  errorEnvelope,
  rateLimitHeaders,
} from "@/content/apiReference";
import { path } from "@/config/nav";
import { canonicalUrl, robotsMeta, seoLinks } from "@/config/seo";

const title = "API Reference — EasyInvoiceOCR";
const description =
  "Complete reference for the EasyInvoiceOCR document API: base URL, authentication, endpoints, parameters, request and response examples in cURL, JavaScript and Python, error codes and rate limits.";
const route = canonicalUrl("api-reference");

export const Route = createFileRoute("/$locale/api-reference")({
  component: ApiReferencePage,
  head: () => ({
    meta: [
      { title },
      robotsMeta("api-reference"),
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: route },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: seoLinks("api-reference", "en"),
  }),
});

function ApiReferencePage() {
  return (
    <PageLayout
      breadcrumbs={[
        { label: "Resources", href: path("documentation") },
        { label: "API Reference" },
      ]}
    >
      <PageHero
        eyebrow="Developers"
        title="API Reference"
        lede="The complete contract for submitting documents and retrieving structured extractions. Every endpoint on this page is marked Planned — the specification is stable, the service is not live."
      />

      <Section>
        <Alert className="max-w-[860px] border-destructive/40">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>Planned — no live endpoints</AlertTitle>
          <AlertDescription>
            None of the URLs below currently accept requests, and API keys are not being issued yet.
            Webhooks are intentionally absent from this reference because they are not implemented.
            No SDK exists; the examples use plain cURL, fetch and requests.
          </AlertDescription>
        </Alert>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Base URL
            </dt>
            <dd className="mt-2 break-all font-mono text-[13px] text-navy">{API_BASE_URL}</dd>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              API version
            </dt>
            <dd className="mt-2 font-mono text-[13px] text-navy">{API_VERSION}</dd>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Authentication
            </dt>
            <dd className="mt-2 font-mono text-[13px] text-navy">Bearer YOUR_API_KEY</dd>
          </div>
        </dl>

        <nav aria-label="Endpoints" className="mt-8">
          <h2 className="text-sm font-semibold text-navy">On this page</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {endpoints.map((e) => (
              <li key={e.id}>
                <a
                  href={`#${e.id}`}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
                >
                  {e.method} {e.path} — {e.name}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#errors"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
              >
                Error format
              </a>
            </li>
            <li>
              <a
                href="#rate-limits"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
              >
                Rate limits and idempotency
              </a>
            </li>
          </ul>
        </nav>
      </Section>

      {endpoints.map((e) => (
        <Section key={e.id} id={e.id}>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="font-mono text-[11px]">
              {e.method}
            </Badge>
            <h2 className="text-[20px] font-bold text-navy">
              <a href={`#${e.id}`} className="hover:underline">
                {e.name}
              </a>
            </h2>
            <Badge variant="outline" className="text-[11px]">
              Planned
            </Badge>
          </div>
          <code className="mt-3 block break-all text-sm text-muted-foreground">
            {e.method} {API_BASE_URL}
            {e.path}
          </code>
          <p className="mt-3 max-w-[760px] text-[15px] leading-relaxed text-muted-foreground">
            {e.description}
          </p>

          <div className="mt-7 grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-navy">Parameters</h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead className="bg-surface text-navy">
                      <tr>
                        {["Name", "In", "Type", "Required"].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-semibold"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {e.parameters.map((p) => (
                        <tr key={p.name} className="border-t border-border align-top">
                          <td className="px-3 py-2 font-mono text-[12.5px] text-navy">{p.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.in}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.type}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {p.required ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {e.parameters.map((p) => (
                    <li key={p.name}>
                      <span className="font-mono text-[12.5px] text-navy">{p.name}</span> —{" "}
                      {p.description}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-navy">Headers</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {e.headers.map((h) => (
                    <li key={h.name}>
                      <span className="font-mono text-[12.5px] text-navy">{h.name}</span> —{" "}
                      {h.description}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-navy">Errors</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {e.errors.map((err) => (
                    <li key={err.code}>
                      <code className="rounded bg-surface px-1.5 py-0.5 text-[12.5px] text-navy">
                        {err.status} {err.code}
                      </code>{" "}
                      — {err.when}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-navy">Request</h3>
                <CodeTabs samples={e.samples} title={`${e.method} ${e.path}`} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-navy">Response</h3>
                <CodeBlock code={e.response} title="200 OK" />
              </div>
            </div>
          </div>
        </Section>
      ))}

      <Section id="errors" title="Error format" muted>
        <p className="max-w-[760px] text-[15px] leading-relaxed text-muted-foreground">
          Every non-2xx response returns the same envelope. Branch on <code>error.code</code>, show{" "}
          <code>error.message</code> to a human, and include <code>request_id</code> when contacting
          support.
        </p>
        <CodeBlock className="mt-5 max-w-[720px]" code={errorEnvelope} title="Error envelope" />
      </Section>

      <Section id="rate-limits" title="Rate limits and idempotency">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-navy">Rate-limit headers</h3>
            <dl className="mt-3 space-y-3">
              {rateLimitHeaders.map((h) => (
                <div key={h.name} className="rounded-lg border border-border px-4 py-3">
                  <dt className="font-mono text-[13px] text-navy">{h.name}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{h.description}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy">Idempotency</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Send an <code>Idempotency-Key</code> on every upload. If a request times out or the
              network drops, retrying with the same key returns the original document rather than
              creating a second one. Keys are retained for 24 hours and are scoped to your API key.
              Idempotency applies to uploads only; GET and DELETE are naturally idempotent.
            </p>
            <h3 className="mt-6 text-sm font-semibold text-navy">Webhooks</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Not implemented, and therefore not documented here. Poll{" "}
              <code>GET /documents/{"{id}"}</code> until the status is <code>completed</code>.
            </p>
          </div>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Looking for concepts rather than endpoints? Start with the{" "}
          <AppLink
            href={path("documentation")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            documentation
          </AppLink>
          .
        </p>
      </Section>
    </PageLayout>
  );
}
