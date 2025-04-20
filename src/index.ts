import { z } from 'astro/zod';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { atomSchema, atomEntrySchema } from './schema.js';
import { errorMap } from './util.js';

export { atomSchema };

type UnwrapArray<T> = T extends Array<infer U> ? U : never;

export type AtomPerson = UnwrapArray<z.infer<typeof atomSchema>['author']>;
export type AtomLink = UnwrapArray<z.infer<typeof atomSchema>['link']>;
export type AtomCategory = UnwrapArray<z.infer<typeof atomSchema>['category']>;
export type AtomContributor = UnwrapArray<z.infer<typeof atomSchema>['contributor']>;
export type AtomGenerator = z.infer<typeof atomSchema>['generator'];
export type AtomSource = z.infer<typeof atomEntrySchema>['source'];
export type AtomEntry = z.infer<typeof atomEntrySchema>;

export type AtomFeedOptions = z.infer<typeof atomSchema> & {
  stylesheet?: string | boolean;
  xmlns?: Record<string, string>;
  lang?: string; // Add lang option to specify xml:lang attribute
};

export default async function getAtomResponse(atomOptions: AtomFeedOptions): Promise<Response> {
  const atomString = await getAtomString(atomOptions);
  return new Response(atomString, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

export async function getAtomString(atomOptions: AtomFeedOptions): Promise<string> {
  // Extract non-schema options
  const { stylesheet, xmlns, lang, ...schemaOptions } = atomOptions;
  const validated = await validateAtomOptions(schemaOptions);
  // Pass through stylesheet, xmlns and lang for XML generation
  return await generateAtom({ ...validated, stylesheet, xmlns, lang });
}

async function validateAtomOptions(atomOptions: z.infer<typeof atomSchema>) {
  const parsedResult = await atomSchema.safeParseAsync(atomOptions, { errorMap });
  if (parsedResult.success) {
    return parsedResult.data;
  }
  const formattedError = new Error(
    [
      `[Atom] Invalid or missing options:`,
      ...parsedResult.error.errors.map((zodError) => {
        const path = zodError.path.join('.');
        const message = `${zodError.message} (${path})`;
        return message;
      }),
    ].join('\n'),
  );
  throw formattedError;
}

/** Generate Atom 1.0 feed */
async function generateAtom(atomOptions: z.infer<typeof atomSchema> & { 
  stylesheet?: string | boolean; 
  xmlns?: Record<string, string>;
  lang?: string; // Add lang parameter
}): Promise<string> {
  const xmlOptions = {
    ignoreAttributes: false,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    format: true,
  };
  const parser = new XMLParser(xmlOptions);
  const root: any = { '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' } };
  if (typeof atomOptions.stylesheet === 'string') {
    const isXSL = /.xsl$/i.test(atomOptions.stylesheet);
    root['?xml-stylesheet'] = {
      '@_href': atomOptions.stylesheet,
      ...(isXSL && { '@_type': 'text/xsl' }),
    };
  }

  // Atom root element and namespace
  root.feed = { '@_xmlns': 'http://www.w3.org/2005/Atom' };
  
  // Add xml:lang if specified
  if (atomOptions.lang) {
    root.feed['@_xml:lang'] = atomOptions.lang;
  }

  // Additional namespaces
  if (atomOptions.xmlns) {
    for (const [k, v] of Object.entries(atomOptions.xmlns)) {
      root.feed[`@_xmlns:${k}`] = v;
    }
  }

  // Feed metadata
  root.feed.id = atomOptions.id;
  root.feed.title = atomOptions.title;
  root.feed.updated = atomOptions.updated;
  if (atomOptions.subtitle) root.feed.subtitle = atomOptions.subtitle;
  if (atomOptions.rights) root.feed.rights = atomOptions.rights;
  if (atomOptions.icon) root.feed.icon = atomOptions.icon;
  if (atomOptions.logo) root.feed.logo = atomOptions.logo;
  if (atomOptions.generator) root.feed.generator = atomOptions.generator;

  if (atomOptions.author) root.feed.author = atomOptions.author;
  if (atomOptions.link) {
    root.feed.link = atomOptions.link.map((l) =>
      Object.fromEntries(
        Object.entries(l).map(([k, v]) => ["@_" + k, v])
      )
    );
  }
  if (atomOptions.category) root.feed.category = atomOptions.category;
  if (atomOptions.contributor) root.feed.contributor = atomOptions.contributor;

  // Custom data (inserted as raw XML)
  if (typeof atomOptions.customData === 'string') {
    Object.assign(
      root.feed,
      parser.parse(`<feed>${atomOptions.customData}</feed>`).feed,
    );
  }

  // Entries
  root.feed.entry = atomOptions.entry
    .sort((a, b) => {
      const aUpdated = new Date(a.updated).getTime();
      const bUpdated = new Date(b.updated).getTime();
      return bUpdated - aUpdated;
    })
    .map((entry) => {
    const e: Record<string, unknown> = {
      id: entry.id,
      title: entry.title,
      updated: entry.updated,
    };
    if (entry.author) e.author = entry.author;
    if (entry.link) {
      e.link = entry.link.map((l) =>
        Object.fromEntries(
          Object.entries(l).map(([k, v]) => ["@_" + k, v])
        )
      );
    }
    if (entry.category) e.category = entry.category;
    if (entry.contributor) e.contributor = entry.contributor;
    if (entry.published) e.published = entry.published;
    if (entry.rights) e.rights = entry.rights;
    if (entry.source) e.source = entry.source;
    if (entry.summary) e.summary = entry.summary;
    if (entry.content) e.content = entry.content;
    if (typeof entry.customData === 'string') {
      Object.assign(e, parser.parse(`<entry>${entry.customData}</entry>`).entry);
    }
    return e;
  });

  return new XMLBuilder(xmlOptions).build(root);
}
