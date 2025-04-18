import { z } from 'astro/zod';

// Atom Person construct
const person = z.object({
  name: z.string(),
  uri: z.string().url().optional(),
  email: z.string().email().optional(),
});

// Atom Link construct
const link = z.object({
  href: z.string().url(),
  rel: z.string().optional(),
  type: z.string().optional(),
  hreflang: z.string().optional(),
  title: z.string().optional(),
  length: z.string().optional(),
});

// Atom Category construct
const category = z.object({
  term: z.string(),
  scheme: z.string().optional(),
  label: z.string().optional(),
});

// Atom Generator construct
const generator = z.object({
  uri: z.string().url().optional(),
  version: z.string().optional(),
  value: z.string(),
});

// Atom Source construct (for entry)
const source = z.object({
  id: z.string(),
  title: z.string(),
  updated: z.string(),
  author: z.array(person).optional(),
  link: z.array(link).optional(),
  category: z.array(category).optional(),
  contributor: z.array(person).optional(),
  generator: generator.optional(),
  icon: z.string().optional(),
  logo: z.string().optional(),
  rights: z.string().optional(),
  subtitle: z.string().optional(),
});

// Atom Entry schema
export const atomEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  updated: z.string(),
  author: z.array(person).optional(),
  link: z.array(link).optional(),
  category: z.array(category).optional(),
  contributor: z.array(person).optional(),
  published: z.string().optional(),
  rights: z.string().optional(),
  source: source.optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  customData: z.string().optional(),
});

// Atom Feed schema
export const atomSchema = z.object({
	/** Identifies the feed using a universally unique and permanent URI. */
  id: z.string(),
  title: z.string(),
  updated: z.string(),
  author: z.array(person).optional(),
  link: z.array(link).optional(),
  category: z.array(category).optional(),
  contributor: z.array(person).optional(),
  generator: generator.optional(),
  icon: z.string().optional(),
  logo: z.string().optional(),
  rights: z.string().optional(),
  subtitle: z.string().optional(),
  entry: z.array(atomEntrySchema),
  customData: z.string().optional(),
});
