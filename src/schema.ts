import { z } from 'astro/zod';

// Atom Text Construct (for title, summary, rights, etc.)
const textConstruct = z.union([
  z.string(),
  z.object({
    /** Text value (required) */
    value: z.string(),
    /** Content type (optional) */
    type: z.string().optional(),
  })
]);

// Atom Person construct
const person = z.object({
  /** Human-readable name for the person (required) */
  name: z.string(),
  /** Home page for the person (optional) */
  uri: z.string().url().optional(),
  /** Email address for the person (optional) */
  email: z.string().email().optional(),
});

// Atom Link construct
const link = z.object({
  /** URI of the referenced resource (required) */
  href: z.string().url(),
  /** Relationship type (optional) */
  rel: z.string().optional(),
  /** Media type (optional) */
  type: z.string().optional(),
  /** Language of the referenced resource (optional) */
  hreflang: z.string().optional(),
  /** Human-readable information about the link (optional) */
  title: z.string().optional(),
  /** Length of the resource in bytes (optional) */
  length: z.string().optional(),
});

// Atom Category construct
const category = z.object({
  /** Identifies the category (required) */
  term: z.string(),
  /** Categorization scheme URI (optional) */
  scheme: z.string().optional(),
  /** Human-readable label for display (optional) */
  label: z.string().optional(),
});

// Atom Generator construct
const generator = z.object({
  /** URI for the generator (optional) */
  uri: z.string().url().optional(),
  /** Version of the generator (optional) */
  version: z.string().optional(),
  /** Name of the generator (required) */
  value: z.string(),
});

// Atom Source construct (for entry)
const source = z.object({
  /** Unique identifier for the source feed (required) */
  id: z.string(),
  /** Title of the source feed (required) */
  title: textConstruct,
  /** Last updated timestamp (required, RFC 3339) */
  updated: z.string(),
  /** Authors of the source feed (optional) */
  author: z.array(person).optional(),
  /** Links associated with the source feed (optional) */
  link: z.array(link).optional(),
  /** Categories for the source feed (optional) */
  category: z.array(category).optional(),
  /** Contributors to the source feed (optional) */
  contributor: z.array(person).optional(),
  /** Generator for the source feed (optional) */
  generator: generator.optional(),
  /** Icon for the source feed (optional) */
  icon: z.string().optional(),
  /** Logo for the source feed (optional) */
  logo: z.string().optional(),
  /** Rights information (optional) */
  rights: textConstruct.optional(),
  /** Subtitle for the source feed (optional) */
  subtitle: z.string().optional(),
});

// Atom Content construct
const content = z.union([
  z.string(),
  z.object({
    /** Content value/text (required) */
    value: z.string(),
    /** Content type (optional) */
    type: z.string().optional(),
    /** Source URL (optional) */
    src: z.string().url().optional(),
  })
]);

// Atom Entry schema
export const atomEntrySchema = z.object({
  /** Unique identifier for the entry (required) */
  id: z.string(),
  /** Title of the entry (required) */
  title: textConstruct,
  /** Last updated timestamp (required, RFC 3339) */
  updated: z.string(),
  /** Authors of the entry (optional) */
  author: z.array(person).optional(),
  /** Links associated with the entry (optional) */
  link: z.array(link).optional(),
  /** Categories for the entry (optional) */
  category: z.array(category).optional(),
  /** Contributors to the entry (optional) */
  contributor: z.array(person).optional(),
  /** Initial creation or first availability (optional, RFC 3339) */
  published: z.string().optional(),
  /** Rights information (optional) */
  rights: textConstruct.optional(),
  /** Source feed for republished entries (optional) */
  source: source.optional(),
  /** Short summary of the entry (optional) */
  summary: textConstruct.optional(),
  /** Full content of the entry (optional) */
  content: content.optional(),
  /** Custom XML data for the entry (optional) */
  customData: z.string().optional(),
});

// Atom Feed schema
export const atomSchema = z.object({
  /** Unique identifier for the feed (required) */
  id: z.string(),
  /** Title of the feed (required) */
  title: textConstruct,
  /** Last updated timestamp (required, RFC 3339) */
  updated: z.string(),
  /** Authors of the feed (optional, required if not all entries have an author) */
  author: z.array(person).optional(),
  /** Links associated with the feed (optional) */
  link: z.array(link).optional(),
  /** Categories for the feed (optional) */
  category: z.array(category).optional(),
  /** Contributors to the feed (optional) */
  contributor: z.array(person).optional(),
  /** Generator for the feed (optional) */
  generator: generator.optional(),
  /** Icon for the feed (optional) */
  icon: z.string().optional(),
  /** Logo for the feed (optional) */
  logo: z.string().optional(),
  /** Rights information (optional) */
  rights: textConstruct.optional(),
  /** Subtitle for the feed (optional) */
  subtitle: z.string().optional(),
  /** Array of Atom entries (required) */
  entry: z.array(atomEntrySchema),
  /** Custom XML data for the feed (optional) */
  customData: z.string().optional(),
});
