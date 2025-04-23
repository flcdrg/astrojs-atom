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
  if (typeof atomOptions.title === 'object') {
    const { value, ...attrs } = atomOptions.title;
    
    root.feed.title = {
      ...Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => ["@_" + k, v])
      ),
      "#text": value
    };
  } else {
    root.feed.title = atomOptions.title;
  }
  
  root.feed.updated = atomOptions.updated;
  if (atomOptions.subtitle) root.feed.subtitle = atomOptions.subtitle;
  
  // Handle rights as text construct
  if (atomOptions.rights) {
    if (typeof atomOptions.rights === 'object') {
      const { value, ...attrs } = atomOptions.rights;
      
      root.feed.rights = {
        ...Object.fromEntries(
          Object.entries(attrs).map(([k, v]) => ["@_" + k, v])
        ),
        "#text": value
      };
    } else {
      root.feed.rights = atomOptions.rights;
    }
  }
  
  if (atomOptions.icon) root.feed.icon = atomOptions.icon;
  if (atomOptions.logo) root.feed.logo = atomOptions.logo;
  
  // Use the provided generator or the default generator
  const generator = atomOptions.generator || defaultGenerator;
  const { value, ...attrs } = generator;
  root.feed.generator = {
    ...Object.fromEntries(
      Object.entries(attrs).map(([k, v]) => ["@_" + k, v])
    ),
    "#text": value
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
    if (typeof entry.title === 'object') {
      const { value, ...attrs } = entry.title;
      
      e.title = {
        ...Object.fromEntries(
          Object.entries(attrs).map(([k, v]) => ["@_" + k, v])
        ),
        "#text": value
      };
    } else {
      e.title = entry.title;
    }
    
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
      // Handle rights as text construct
      if (typeof entry.rights === 'object') {
        const { value, ...attrs } = entry.rights;
        
        e.rights = {
          ...Object.fromEntries(
            Object.entries(attrs).map(([k, v]) => ["@_" + k, v])
          ),
          "#text": value
        };
      } else {
        e.rights = entry.rights;
      }
    }
    if (entry.source) e.source = entry.source;
    if (entry.summary) {
      // Handle summary as text construct
      if (typeof entry.summary === 'object') {
        const { value, ...attrs } = entry.summary;
        const needsCDATA = attrs.type === 'html' || attrs.type === 'xml' || attrs.type?.includes('+xml');
        
        e.summary = {
          ...Object.fromEntries(
            Object.entries(attrs).map(([k, v]) => ["@_" + k, v])
          ),
          // Use __cdata property for HTML/XML summary content to prevent entity encoding
          ...(needsCDATA ? { "__cdata": value } : { "#text": value })
        };
      } else {
        e.summary = entry.summary;
      }
    }
    if (entry.content) {
      // Handle content as an object with attributes if it's an object,
      // or as a simple string value if it's a string
      if (typeof entry.content === 'object') {
        const { value, ...attrs } = entry.content;
        const needsCDATA = attrs.type === 'html' || attrs.type === 'xml' || attrs.type?.includes('+xml');
        
        e.content = {
          ...Object.fromEntries(
            Object.entries(attrs).map(([k, v]) => ["@_" + k, v])
          ),
          "@_xml:base": entry.id, // Add xml:base attribute with the entry's ID as the value
          // Use __cdata property for HTML/XML content to prevent entity encoding
          ...(needsCDATA ? { "__cdata": value } : { "#text": value })
        };
      } else {
        e.content = {
          "@_xml:base": entry.id, // Add xml:base attribute with the entry's ID as the value
          "#text": entry.content
        };
      }
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
