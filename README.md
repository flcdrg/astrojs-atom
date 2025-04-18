# @astrojs/atom 📖

Fork of @astrojs/rss that implements the [Atom feed format](https://validator.w3.org/feed/docs/atom.html).

## Installation and use

See the [`@astrojs/atom` guide in the Astro docs][docs] for installation and usage examples.

## `atom()` configuration options

The `atom()` utility function offers a number of configuration options to generate your feed.

### title

Type: `string (required)`

The `<title>` attribute of your Atom feed's output xml.

### description

Type: `string (required)`

The `<subtitle>` attribute of your Atom feed's output xml.

### site

Type: `string (required)`

The base URL to use when generating Atom entry links. We recommend using the [endpoint context object](https://docs.astro.build/en/reference/api-reference/#contextsite), which includes the `site` configured in your project's `astro.config.*`:

```ts
import atom from '@astrojs/atom';

export const GET = (context) =>
  atom({
    site: context.site,
    // ...
  });
```

### items

Type: `AtomFeedItem[] (required)`

A list of formatted Atom feed entries.

An `AtomFeedItem` is a single entry in the list of items in your feed. An example feed entry might look like:

```js
const entry = {
  title: 'Alpha Centauri: so close you can touch it',
  link: '/blog/alpha-centuari',
  pubDate: new Date('2023-06-04'),
  description:
    'Alpha Centauri is a triple star system, containing Proxima Centauri, the closest star to our sun at only 4.24 light-years away.',
  categories: ['stars', 'space'],
};
```

#### `title`

Type: `string (optional)`

The title of the entry.

#### `link`

Type: `string (optional)`

The URL to the entry.

#### `pubDate`

Type: `string | number | Date (optional)`

The publication date of the entry.

#### `description`

Type: `string (optional)`

A short summary of the entry.

#### `content`

Type: `string (optional)`

The full text content of the entry suitable for presentation as HTML. If used, you should also provide a short article summary in the `description` field.

#### `categories`

Type: `string[] (optional)`

A list of any tags or categories to categorize your content. They will be output as multiple `<category>` elements.

#### `author`

Type: `string (optional)`

The name or email address of the entry author.

#### `commentsUrl`

Type: `string (optional)`

The URL of a web page that contains comments on the entry.

#### `source`

Type: `{ title: string, url: string } (optional)`

An object that defines the `title` and `url` of the original feed for entries that have been republished from another source. Both are required properties of `source` for proper attribution.

#### `enclosure`

Type: `{ url: string, length: number, type: string } (optional)`

A media object that belongs to the entry.

#### `customData`

Type: `string (optional)`

A string of valid XML to be injected into the entry.

### stylesheet

Type: `string (optional)`

An absolute path to an XSL stylesheet in your project. If you don’t have an Atom stylesheet in mind, you can use a custom one for styling.

### customData

Type: `string (optional)`

A string of valid XML to be injected between your feed's `<subtitle>` and `<entry>` tags.

### xmlns

Type: `Record<string, string> (optional)`

An object mapping a set of `xmlns` suffixes to string values on the opening `<feed>` tag.

### trailingSlash

Type: `boolean (optional, default: true)`

Whether to append a trailing slash to generated URLs.

## The `atomSchema` validator

When using content collections, you can configure your collection schema to enforce expected [`AtomFeedItem`](#items) properties. Import and apply `atomSchema` to ensure that each collection entry produces a valid Atom feed entry:

```ts
import { defineCollection } from 'astro:content';
import { atomSchema } from '@astrojs/atom';

const blog = defineCollection({
  schema: atomSchema,
});

export const collections = { blog };
```

If you have an existing schema, you can merge extra properties using `extends()`:

```ts
import { defineCollection } from 'astro:content';
import { atomSchema } from '@astrojs/atom';

const blog = defineCollection({
  schema: atomSchema.extend({ extraProperty: z.string() }),
});
```

## The `pagesGlobToAtomItems()` function

To create an Atom feed from documents in `src/pages/`, use the `pagesGlobToAtomItems()` helper. This accepts an `import.meta.glob` result ([see Vite documentation](https://vite.dev/guide/features.html#glob-import)) and outputs an array of valid [`AtomFeedItem`s](#items).

This function assumes, but does not verify, you are globbing for items inside `src/pages/`, and all necessary feed properties are present in each document's frontmatter. If you encounter errors, verify each page frontmatter manually.

```ts
// src/pages/atom.xml.js
import atom, { pagesGlobToAtomItems } from '@astrojs/atom';

export async function GET(context) {
  return atom({
    title: 'Buzz’s Blog',
    description: 'A humble Astronaut’s guide to the stars',
    site: context.site,
    items: await pagesGlobToAtomItems(import.meta.glob('./blog/*.{md,mdx}')),
    // ...
  });
}
```

## The `getAtomString()` function

As `atom()` returns a `Response`, you can also use `getAtomString()` to get the Atom XML string directly and use it in your own response:

```ts
// src/pages/atom.xml.js
import { getAtomString } from '@astrojs/atom';

export async function GET(context) {
  const atomString = await getAtomString({
    title: 'Buzz’s Blog',
    // ...
  });

  return new Response(atomString, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
```

## Support

- Get help in the [Astro Discord][discord]. Post questions in our `#support` forum, or visit our dedicated `#dev` channel to discuss current development and more!
- Check our [Astro Integration Documentation][astro-integration] for more on integrations.
- Submit bug reports and feature requests as [GitHub issues][issues].

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR! These links will help you get started:

- [Contributor Manual][contributing]
- [Code of Conduct][coc]
- [Community Guide][community]

## License

MIT

Copyright (c) 2023–present [Astro][astro]

[docs]: https://docs.astro.build/en/guides/rss/
[astro-endpoints]: https://docs.astro.build/en/core-concepts/astro-pages/#non-html-pages
[astro]: https://astro.build/
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
