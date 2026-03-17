import { z } from 'astro/zod';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { atomSchema, atomEntrySchema } from './schema.js';
import { errorMap } from './util.js';
import { defaultGenerator } from './generator.js';

export { atomSchema };

type UnwrapArray<T> = T extends Array<infer U> ? U : never;

// Define the thumbnail interface explicitly for better TypeScript support
interface MediaThumbnail {
  url: string;
  medium?: string;
  width?: number;
  height?: number;
  time?: string;
}

export type AtomPerson = UnwrapArray<z.infer<typeof atomSchema>['author']>;
export type AtomLink = UnwrapArray<z.infer<typeof atomSchema>['link']>;
export type AtomCategory = UnwrapArray<z.infer<typeof atomSchema>['category']>;
export type AtomContributor = UnwrapArray<z.infer<typeof atomSchema>['contributor']>;
export type AtomGenerator = z.infer<typeof atomSchema>['generator'];
export type AtomSource = z.infer<typeof atomEntrySchema>['source'];
export type AtomMediaThumbnail = z.infer<typeof atomEntrySchema>['thumbnail'];
export type AtomEntry = z.infer<typeof atomEntrySchema>;

export type AtomFeedOptions = z.infer<typeof atomSchema> & {
  stylesheet?: string | boolean;
  xmlns?: Record<string, string>;
  lang?: string; // Add lang option to specify xml:lang attribute
  useLegacyXmlContentType?: boolean;
};

type AtomTextConstruct = string | {
  value: string;
  type?: string;
};

type AtomContentConstruct = string | {
  value: string;
  type?: string;
  src?: string;
};

const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

function toXmlAttributes(attributes: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [`@_${key}`, value]),
  );
}

function getConstructType(type?: string) {
  return type?.toLowerCase();
}

function isXmlMediaType(type?: string) {
  const normalizedType = getConstructType(type);
  return normalizedType === 'xml'
    || normalizedType?.endsWith('/xml')
    || normalizedType?.endsWith('+xml')
    || false;
}

function isTextMediaType(type?: string) {
  return getConstructType(type)?.startsWith('text/') || false;
}

function parseXmlFragment(parser: XMLParser, fragment: string): Record<string, unknown> {
  const parsedRoot = parser.parse(`<root>${fragment}</root>`).root;
  if (parsedRoot && typeof parsedRoot === 'object') {
    return parsedRoot as Record<string, unknown>;
  }

  return { '#text': parsedRoot ?? '' };
}

function createXhtmlDiv(parser: XMLParser, value: string) {
  const parsedFragment = parseXmlFragment(parser, value);
  const childKeys = Object.keys(parsedFragment).filter((key) => key !== '#text' && !key.startsWith('@_'));
  const textValue = typeof parsedFragment['#text'] === 'string' ? parsedFragment['#text'].trim() : '';

  if (childKeys.length === 1 && textValue.length === 0) {
    const onlyChildKey = childKeys[0];
    const localName = onlyChildKey.includes(':')
      ? onlyChildKey.slice(onlyChildKey.lastIndexOf(':') + 1)
      : onlyChildKey;

    if (localName === 'div') {
      const divValue = parsedFragment[onlyChildKey];
      if (divValue && typeof divValue === 'object') {
        const divNode = { ...(divValue as Record<string, unknown>) };
        const prefix = onlyChildKey.includes(':') ? onlyChildKey.slice(0, onlyChildKey.indexOf(':')) : undefined;
        const namespaceAttribute = prefix ? `@_xmlns:${prefix}` : '@_xmlns';

        if (!(namespaceAttribute in divNode)) {
          divNode[namespaceAttribute] = XHTML_NAMESPACE;
        }

        return { [onlyChildKey]: divNode };
      }

      return {
        [onlyChildKey]: {
          '@_xmlns': XHTML_NAMESPACE,
          '#text': divValue ?? '',
        },
      };
    }
  }

  return {
    div: {
      '@_xmlns': XHTML_NAMESPACE,
      ...parsedFragment,
    },
  };
}

function serializeTextConstruct(
  construct: AtomTextConstruct,
  parser: XMLParser,
) {
  if (typeof construct === 'string') {
    return construct;
  }

  const { value, ...attributes } = construct;
  const xmlAttributes = toXmlAttributes(attributes);
  const normalizedType = getConstructType(attributes.type);

  if (normalizedType === 'xhtml') {
    return {
      ...xmlAttributes,
      ...createXhtmlDiv(parser, value),
    };
  }

  return {
    ...xmlAttributes,
    '#text': value,
  };
}

function serializeContentConstruct(
  content: AtomContentConstruct,
  entryId: string,
  parser: XMLParser,
) {
  if (typeof content === 'string') {
    return {
      '@_xml:base': entryId,
      '#text': content,
    };
  }

  const { value, ...attributes } = content;
  const xmlAttributes = {
    ...toXmlAttributes(attributes),
    '@_xml:base': entryId,
  };
  const normalizedType = getConstructType(attributes.type);

  if (attributes.src) {
    return xmlAttributes;
  }

  if (normalizedType === 'xhtml') {
    return {
      ...xmlAttributes,
      ...createXhtmlDiv(parser, value),
    };
  }

  if (isXmlMediaType(normalizedType)) {
    return {
      ...xmlAttributes,
      ...parseXmlFragment(parser, value),
    };
  }

  if (!normalizedType || normalizedType === 'text' || normalizedType === 'html' || isTextMediaType(normalizedType)) {
    return {
      ...xmlAttributes,
      '#text': value,
    };
  }

  return {
    ...xmlAttributes,
    '#text': Buffer.from(value).toString('base64'),
  };
}

export default async function getAtomResponse(atomOptions: AtomFeedOptions): Promise<Response> {
  const atomString = await getAtomString(atomOptions);
  const contentType = atomOptions.useLegacyXmlContentType
    ? 'application/xml; charset=utf-8'
    : 'application/atom+xml; charset=utf-8';

  return new Response(atomString, {
    headers: {
      'Content-Type': contentType,
    },
  });
}

export async function getAtomString(atomOptions: AtomFeedOptions): Promise<string> {
  // Extract non-schema options
  const { stylesheet, xmlns, lang, ...schemaOptions } = atomOptions;
  delete schemaOptions.useLegacyXmlContentType;
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
    cdataPropName: "__cdata", // Special property name to indicate CDATA content
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
  
  // Handle title as text construct
  root.feed.title = serializeTextConstruct(atomOptions.title, parser);
  
  root.feed.updated = atomOptions.updated;
  if (atomOptions.subtitle) {
    root.feed.subtitle = serializeTextConstruct(atomOptions.subtitle, parser);
  }
  
  // Handle rights as text construct
  if (atomOptions.rights) {
    root.feed.rights = serializeTextConstruct(atomOptions.rights, parser);
  }
  
  if (atomOptions.icon) root.feed.icon = atomOptions.icon;
  if (atomOptions.logo) root.feed.logo = atomOptions.logo;
  
  // Use the provided generator or the default generator
  const generator = atomOptions.generator || defaultGenerator;
  const { value, ...attrs } = generator;
  root.feed.generator = {
    ...toXmlAttributes(attrs),
    '#text': value
  };

  if (atomOptions.author) root.feed.author = atomOptions.author;
  if (atomOptions.link) {
    root.feed.link = atomOptions.link.map((l) =>
      Object.fromEntries(
        Object.entries(l).map(([k, v]) => ["@_" + k, v])
      )
    );
  }
  if (atomOptions.category) {
    root.feed.category = atomOptions.category.map((c) =>
      Object.fromEntries(
        Object.entries(c).map(([k, v]) => ["@_" + k, v])
      )
    );
  }
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
      updated: entry.updated,
    };

    // Handle title as text construct
    e.title = serializeTextConstruct(entry.title, parser);
    
    if (entry.author) e.author = entry.author;
    if (entry.link) {
      e.link = entry.link.map((l) =>
        Object.fromEntries(
          Object.entries(l).map(([k, v]) => ["@_" + k, v])
        )
      );
    }
    if (entry.category) {
      e.category = entry.category.map((c) =>
        Object.fromEntries(
          Object.entries(c).map(([k, v]) => ["@_" + k, v])
        )
      );
    }
    if (entry.contributor) e.contributor = entry.contributor;
    if (entry.published) e.published = entry.published;
    if (entry.rights) {
      e.rights = serializeTextConstruct(entry.rights, parser);
    }
    if (entry.source) e.source = entry.source;
    if (entry.summary) {
      e.summary = serializeTextConstruct(entry.summary, parser);
    }
    if (entry.content) {
      e.content = serializeContentConstruct(
        entry.content,
        entry.id,
        parser,
      );
    }
    if (typeof entry.customData === 'string') {
      Object.assign(e, parser.parse(`<entry>${entry.customData}</entry>`).entry);
    }
    
    // Handle media thumbnail and content
    if (entry.thumbnail) {
      // Add the media namespace if not already included in the feed namespaces
      if (!atomOptions.xmlns || !atomOptions.xmlns['media']) {
        if (!root.feed['@_xmlns:media']) {
          root.feed['@_xmlns:media'] = 'http://search.yahoo.com/mrss/';
        }
      }
      
      // Access the thumbnail properties safely
      const url = (entry.thumbnail as any).url as string;
      const medium = (entry.thumbnail as any).medium as string | undefined;
      const width = (entry.thumbnail as any).width as number | undefined;
      const height = (entry.thumbnail as any).height as number | undefined;
      const time = (entry.thumbnail as any).time as string | undefined;
      
      // Create media:thumbnail element with type assertion
      e['media:thumbnail'] = {
        '@_xmlns:media': 'http://search.yahoo.com/mrss/',
        '@_url': url
      } as Record<string, any>;
      
      // Add optional attributes to thumbnail
      if (width !== undefined) (e['media:thumbnail'] as Record<string, any>)['@_width'] = width;
      if (height !== undefined) (e['media:thumbnail'] as Record<string, any>)['@_height'] = height;
      if (time !== undefined) (e['media:thumbnail'] as Record<string, any>)['@_time'] = time;
      
      // Create media:content element with type assertion
      e['media:content'] = {
        '@_medium': medium || "image",
        '@_xmlns:media': 'http://search.yahoo.com/mrss/',
        '@_url': url
      } as Record<string, any>;
            
      // Add optional attributes to content if present
      if (width !== undefined) (e['media:content'] as Record<string, any>)['@_width'] = width;
      if (height !== undefined) (e['media:content'] as Record<string, any>)['@_height'] = height;
    }
    
    return e;
  });

  return new XMLBuilder(xmlOptions).build(root);
}
