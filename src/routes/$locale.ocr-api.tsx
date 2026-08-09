import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { Section } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { CodeBlock, CodeTabs } from "@/components/site/CodeBlock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { asLocale } from "@/i18n";

const product = productBySlug["ocr-api"]!;
const upload = endpoints[0]!;

function ApiExtras() {
  return (
    <>
      <Section title="Status of this API">
        <Alert className="max-w-[820px] border-destructive/40">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>Not available yet — specification only</AlertTitle>
          <AlertDescription>
            The endpoints below are documented but not live. Every endpoint in the API Reference is
            marked <strong>Planned</strong>. There is no way to obtain a working API key today, and
            nothing on this page should be treated as a production service. It is published so that
            integrators can design against a contract that will not change underneath them.
          </AlertDescription>
        </Alert>
      </Section>

      <Section title="Authentication" muted>
        <p className="max-w-[720px] text-[15px] leading-relaxed text-muted-foreground">
          Every request carries a workspace API key as a bearer token. Keys are workspace-scoped,
          shown once at creation, and revocable. Pin the API version with the{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-[13px]">X-API-Version</code> header
          so a future change cannot alter your response shape without you opting in.
        </p>
        <CodeBlock
          className="mt-5 max-w-[820px]"
          title="Request headers"
          code={`Authorization: Bearer YOUR_API_KEY
X-API-Version: ${API_VERSION}
Content-Type: multipart/form-data`}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Base URL:{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-[13px]">{API_BASE_URL}</code>
        </p>
      </Section>

      <Section title="Endpoints">
        <ul className="space-y-3">
          {endpoints.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <Badge variant="secondary" className="font-mono text-[11px]">
                {e.method}
              </Badge>
              <code className="text-sm text-navy">{e.path}</code>
              <span className="text-sm text-muted-foreground">{e.name}</span>
              <Badge variant="outline" className="ml-auto text-[11px]">
                Planned
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">
          Parameters, headers and per-endpoint errors are documented in the{" "}
          <AppLink
            href={path("api-reference")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            API Reference
          </AppLink>
          .
        </p>
      </Section>

      <Section title="Request and response" muted>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-navy">Submitting a document</h3>
            <CodeTabs samples={upload.samples} title="POST /documents" />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-navy">Extraction response</h3>
            <CodeBlock code={endpoints[2]!.response} title="GET /documents/{id}/extraction" />
          </div>
        </div>
      </Section>

      <Section title="Errors and rate limits">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-navy">Error envelope</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every failure uses the same shape, with a stable machine-readable code.
            </p>
            <CodeBlock className="mt-3" code={errorEnvelope} title="Error response" />
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {upload.errors.map((err) => (
                <li key={err.code}>
                  <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] text-navy">
                    {err.status} {err.code}
                  </code>{" "}
                  — {err.when}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy">Rate limits</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Limits are per API key and reported on every response, so a client can back off before
              being throttled. A 429 always includes <code>Retry-After</code>; retry with
              exponential backoff and reuse your <code>Idempotency-Key</code> so a retried upload
              cannot create a duplicate document.
            </p>
            <dl className="mt-4 space-y-3">
              {rateLimitHeaders.map((h) => (
                <div key={h.name} className="rounded-lg border border-border px-4 py-3">
                  <dt className="font-mono text-[13px] text-navy">{h.name}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{h.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section title="Get access" muted>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={path("contact") + "?topic=api"}>Request API access</AppLink>
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <AppLink href={path("api-reference")}>Read the API Reference</AppLink>
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <AppLink href={path("solutions/developers")}>Developer overview</AppLink>
          </Button>
        </div>
        <p className="mt-4 max-w-[720px] text-sm text-muted-foreground">
          Developer registration and self-service key management ship with the account area. Until
          then, “Request API access” opens the contact form pre-set to the API topic so we can
          contact you when keys are issued.
        </p>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/$locale/ocr-api")({
  component: () => (
    <ProductPage
      product={product}
      kind="invoice"
      breadcrumbs={[{ label: "Product", href: path("ocr-api") }, { label: product.name }]}
      extra={<ApiExtras />}
    />
  ),
  head: ({ params }) => productHead(product, asLocale(params.locale)),
});
