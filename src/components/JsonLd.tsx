/**
 * Structured data, rendered in the body.
 *
 * Search engines accept JSON-LD anywhere in the document, and keeping it out of
 * `<head>` avoids React 19's metadata hoisting — which ordered the script
 * differently between the prerender and hydration and cost the page its
 * server-rendered tree.
 *
 * `dangerouslySetInnerHTML` is the only way to emit a raw JSON payload inside a
 * script tag; the content is generated from typed schema objects in `lib/seo.ts`
 * and never contains user input. `<` is escaped anyway so a string in the content
 * model can never close the tag early.
 */
export const JsonLd = ({ schemas }: { schemas: object[] }) => (
  <>
    {schemas.map((schema, index) => (
      <script
        key={index}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
        }}
      />
    ))}
  </>
)
