# astrojs-atom

A library for generating [Atom syndication feeds](https://validator.w3.org/feed/docs/atom.html) in Astro projects. This is a fork of `@astrojs/rss` that implements the Atom feed format instead of RSS.

## Installation

```bash
# Using npm
npm install astrojs-atom

# Using yarn
yarn add astrojs-atom

# Using pnpm
pnpm install astrojs-atom
```

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

- `getAtomResponse`: Returns a `Response` object with the Atom XML and proper headers
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
| `subtitle` | `string` | Description or subtitle for the feed |
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
| `customData` | `string` | Custom XML to include in the feed |

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
| `content` | `string` or `object` | Full content of the entry. When using an object, you can specify `type` (like "html") and the `value` |
| `link` | `Array` | Links related to the entry |
| `summary` | `string` or `object` | Summary of the entry |
| `category` | `Array` | Categories for the entry |
| `contributor` | `Array` | Contributors to the entry |
| `published` | `string` | Publication date (RFC 3339 format) |
| `rights` | `string` or `object` | Entry-specific copyright information |
| `source` | `object` | Source feed information for republished entries |
| `customData` | `string` | Custom XML to include in the entry |

## Text Constructs (title, summary, rights)

For properties like `title`, `summary`, and `rights`, you can use either:

- A simple string: `title: "My Title"`
- An object with attributes: `title: { value: "My Title", type: "html" }`

## Type Attribute Values

Common `type` attribute values include:

- `"text"` (default) - Plain text
- `"html"` - HTML content 
- `"xhtml"` - XHTML content
- `"application/xml"` or other MIME types

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

## Validation

To validate your Atom feed, use the [W3C Feed Validation Service](https://validator.w3.org/feed/).
