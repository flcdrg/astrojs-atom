# astrojs-atom

![NPM Version](https://img.shields.io/npm/v/astrojs-atom)

A library for generating [Atom syndication feeds](https://validator.w3.org/feed/docs/atom.html) in Astro projects. This is a fork of `@astrojs/rss` that implements the Atom feed format instead of RSS.

## Compatibility

- Astro `6.x`
- Node `22.12.0` or newer

## Installation

```bash
# Using npm
npm install astrojs-atom

# Using yarn
yarn add astrojs-atom

# Using pnpm
pnpm install astrojs-atom
```

This package uses `astro/zod`, so its schema behavior follows the Zod version bundled with your installed Astro version. With Astro 6, that means Zod 4 semantics.

## Usage

Create a new `.xml.js` or `.xml.ts` file in your Astro pages directory to generate an Atom feed:

```typescript
// src/pages/atom.xml.js
import { getAtomResponse } from 'astrojs-atom';

export async function GET(context) {
  return getAtomResponse({
    // Required: Feed metadata
    title: "My Website",
    id: "https://example.com/",
    updated: new Date().toISOString(),
    
    // Required: Array of feed entries
    entry: [
      {
        title: "My First Article",
        id: "https://example.com/blog/first-article",
        updated: "2023-01-01T00:00:00Z",
        // Optional: content, author, link, etc.
        content: "This is my first article.",
        link: [
          { href: "https://example.com/blog/first-article", rel: "alternate" }
        ]
      }
    ],
    
    // Optional: Customize the feed with additional properties
    subtitle: "My Personal Blog",
    lang: "en-US",
    author: [
      { 
        name: "Your Name",
        email: "you@example.com"
      }
    ],
    // Add custom stylesheet
    stylesheet: "/atom-styles.xsl"
  });
}
```

## API Reference

### Main Functions

- `getAtomResponse`: Returns a `Response` object with the Atom XML and an Atom-specific `Content-Type` header
- `getAtomString`: Returns just the XML string without creating a Response object

### Feed Options (AtomFeedOptions)

#### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` or `object` | Title of the feed. Can be a simple string or an object with `value` and `type` attributes |
| `id` | `string` | Unique identifier for the feed (typically your site URL) |
| `updated` | `string` | Last updated timestamp (RFC 3339 format) |
| `entry` | `Array` | Array of feed entries |

#### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `subtitle` | `string` or `object` | Description or subtitle for the feed as an Atom text construct |
| `author` | `Array` | Feed authors as an array of person objects |
| `link` | `Array` | Links related to the feed |
| `category` | `Array` | Categories for the feed |
| `contributor` | `Array` | Contributors to the feed |
| `generator` | `object` | Information about the generator of the feed |
| `icon` | `string` | URL to an icon for the feed |
| `logo` | `string` | URL to a logo for the feed |
| `rights` | `string` or `object` | Copyright information |
| `lang` | `string` | Language of the feed (sets xml:lang attribute) |
| `xmlns` | `object` | Custom XML namespaces to include |
| `stylesheet` | `string` | URL to an XSL stylesheet |
| `useLegacyXmlContentType` | `boolean` | Makes `getAtomResponse()` use the legacy `application/xml; charset=utf-8` header instead of the default Atom media type |
| `sortEntriesByUpdated` | `boolean` | When `true`, sorts entries by `updated` descending before serialization. By default, entry order is preserved as provided |
| `customData` | `string` | Custom XML to include in the feed |

`getAtomResponse()` now returns `Content-Type: application/atom+xml; charset=utf-8` by default. If you need the previous header for compatibility with an existing consumer, set `useLegacyXmlContentType: true`.

Feed entries preserve the input order by default. If you want the previous behavior of sorting entries by `updated` descending during generation, set `sortEntriesByUpdated: true`.

### Entry Properties

Each entry in the `entry` array can have the following properties:

#### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` or `object` | Title of the entry |
| `id` | `string` | Unique identifier for the entry |
| `updated` | `string` | Last updated timestamp (RFC 3339 format) |

#### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `author` | `Array` | Entry authors |
| `content` | `string` or `object` | Full content of the entry. Object content can either provide an inline `value` or an external `src`, plus optional `type` and explicit `base` values |
| `link` | `Array` | Links related to the entry |
| `summary` | `string` or `object` | Summary of the entry |
| `category` | `Array` | Categories for the entry |
| `contributor` | `Array` | Contributors to the entry |
| `published` | `string` | Publication date (RFC 3339 format) |
| `rights` | `string` or `object` | Entry-specific copyright information |
| `source` | `object` | Source feed information for republished entries. Shared Atom metadata inside `source` uses the same construct handling as the feed, including text constructs for `title`, `subtitle`, and `rights` |
| `customData` | `string` | Custom XML to include in the entry |
| `thumbnail` | `object` | Thumbnail image for the entry |

## Text Constructs (title, subtitle, summary, rights)

For properties like `title`, `subtitle`, `summary`, and `rights`, you can use either:

- A simple string: `title: "My Title"`
- An object with attributes: `title: { value: "My Title", type: "html" }`

## Type Attribute Values

Common `type` attribute values include:

- `"text"` (default) - Plain text
- `"html"` - Serialized as entity-escaped HTML
- `"xhtml"` - Serialized as inline XHTML wrapped in `<div xmlns="http://www.w3.org/1999/xhtml">`
- XML media types such as `"application/xml"` or `"image/svg+xml"` - Serialized inline as XML
- Other non-text media types - Serialized as base64-encoded content

For Atom text constructs such as `title`, `summary`, and `rights`, use `text`, `html`, or `xhtml`.

## Examples

### Entry with HTML Content

```typescript
{
  title: "My Article",
  id: "https://example.com/blog/my-article",
  updated: "2023-01-01T00:00:00Z",
  content: {
    type: "html",
    value: "<p>This is <strong>formatted</strong> content.</p>"
  }
}
```

This generates escaped HTML inside the Atom element body, not CDATA:

```xml
<content type="html">&lt;p&gt;This is &lt;strong&gt;formatted&lt;/strong&gt; content.&lt;/p&gt;</content>
```

### Entry with XHTML Content

```typescript
{
  title: {
    type: "xhtml",
    value: "<p>This is <strong>XHTML</strong> content.</p>"
  },
  id: "https://example.com/blog/xhtml-article",
  updated: "2023-01-01T00:00:00Z",
  content: {
    type: "xhtml",
    value: "<p>This is <strong>XHTML</strong> content.</p>"
  }
}
```

This generates inline XHTML wrapped in the required XHTML `div`:

```xml
<content type="xhtml">
  <div xmlns="http://www.w3.org/1999/xhtml">
    <p>This is <strong>XHTML</strong> content.</p>
  </div>
</content>
```

### Entry with External Content

```typescript
{
  title: "Hosted Elsewhere",
  id: "https://example.com/blog/hosted-elsewhere",
  updated: "2023-01-01T00:00:00Z",
  summary: "Read the full article at the source URL.",
  content: {
    src: "https://example.com/content/hosted-elsewhere.html",
    type: "text/html"
  }
}
```

When `src` is present, the content is linked externally and no inline `value` is allowed:

```xml
<content src="https://example.com/content/hosted-elsewhere.html" type="text/html" />
```

`xml:base` is no longer added automatically to every `<content>` element. If you need it for relative IRI resolution, use object-form content and pass an explicit `base` value:

```typescript
{
  content: {
    value: "<p>Body</p>",
    type: "html",
    base: "https://cdn.example.com/articles/"
  }
}
```

### Using Custom XML Namespaces

```typescript
getAtomResponse({
  // ...feed options
  xmlns: {
    "dc": "http://purl.org/dc/elements/1.1/",
    "georss": "http://www.georss.org/georss"
  },
  entry: [
    {
      // ...entry properties
      customData: '<dc:creator>John Smith</dc:creator><georss:point>45.256 -71.92</georss:point>'
    }
  ]
});
```

## Media Content

The Atom feed generator supports adding media elements to entries using the Yahoo Media RSS extension.

### Adding Thumbnails

You can add thumbnail images to entries with the `thumbnail` property:

```typescript
{
  // ...other entry properties
  thumbnail: {
    url: "https://example.com/images/thumbnail.jpg",
    medium: "image", // Optional, defaults to "image"
    width: 300,      // Optional
    height: 200      // Optional
  }
}
```

This will generate both `media:thumbnail` and `media:content` elements in your feed:

```xml
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <media:thumbnail
  url="https://example.com/images/thumbnail.jpg"
  width="300" height="200" />
  <media:content medium="image"
  url="https://example.com/images/thumbnail.jpg"
  width="300" height="200" />
</feed>
```

The Media RSS namespace (`xmlns:media="http://search.yahoo.com/mrss/"`) is automatically added once at the feed level when a thumbnail is included.

## Validation

To validate your Atom feed, use the [W3C Feed Validation Service](https://validator.w3.org/feed/).

The library also validates Atom date-time fields against RFC 3339 during schema parsing. `feed.updated`, `entry.updated`, `entry.published`, and `source.updated` must include a full date-time with either `Z` or an explicit UTC offset.

URI-based Atom fields such as `link.href`, `author.uri`, `generator.uri`, and `content.src` accept Atom-compatible URI or URI-reference values like `urn:uuid:...` and `/feed`, not just absolute URLs.

Atom `link.length` values are validated as non-negative byte counts. You can pass either a number like `1234` or a numeric string like `"1234"`.

Atom author requirements are also validated across the whole feed: if the feed has no top-level `author`, then every entry must provide author data either directly on the entry or through its `source`.

`entry.source` metadata is serialized with the same Atom construct mappings as top-level feed metadata, so `source.title`, `source.subtitle`, and `source.rights` support text constructs, while `source.link`, `source.category`, and `source.generator` serialize using Atom attribute/value conventions.

Atom content no longer emits `xml:base` automatically from `entry.id`. If you need `xml:base`, set `content.base` explicitly on object-form content.
````
