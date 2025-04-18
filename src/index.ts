import { z } from 'astro/zod';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { yellow } from 'kleur/colors';
import { atomSchema } from './schema.js';
import { createCanonicalURL, errorMap, isValidURL } from './util.js';

export { atomSchema };

export type AtomOptions = {
	/** Title of the Atom Feed */
	title: z.infer<typeof atomOptionsValidator>['title'];
	/** Description of the Atom Feed */
	description: z.infer<typeof atomOptionsValidator>['description'];
	/**
	 * Specify the base URL to use for Atom feed links.
	 * We recommend using the [endpoint context object](https://docs.astro.build/en/reference/api-reference/#contextsite),
	 * which includes the `site` configured in your project's `astro.config.*`
	 */
	site: z.infer<typeof atomOptionsValidator>['site'] | URL;
	/** List of Atom feed items to render. */
	items: AtomFeedItem[] | GlobResult;
	/** Specify arbitrary metadata on opening <xml> tag */
	xmlns?: z.infer<typeof atomOptionsValidator>['xmlns'];
	/**
	 * Specifies a local custom XSL stylesheet. Ex. '/public/custom-feed.xsl'
	 */
	stylesheet?: z.infer<typeof atomOptionsValidator>['stylesheet'];
	/** Specify custom data in opening of file */
	customData?: z.infer<typeof atomOptionsValidator>['customData'];
	trailingSlash?: z.infer<typeof atomOptionsValidator>['trailingSlash'];
};

export type AtomFeedItem = {
	/** Link to item */
	link?: z.infer<typeof atomSchema>['link'];
	/** Full content of the item. Should be valid HTML */
	content?: z.infer<typeof atomSchema>['content'];
	/** Title of item */
	title?: z.infer<typeof atomSchema>['title'];
	/** Indicates the last time the entry was modified in a significant way */
	updated?: z.infer<typeof atomSchema>['updated'];
	/** Item description */
	description?: z.infer<typeof atomSchema>['description'];
	/** Append some other XML-valid data to this item */
	customData?: z.infer<typeof atomSchema>['customData'];
	/** Categories or tags related to the item */
	categories?: z.infer<typeof atomSchema>['categories'];
	/** The item author's email address */
	author?: z.infer<typeof atomSchema>['author'];
	/** A URL of a page for comments related to the item */
	commentsUrl?: z.infer<typeof atomSchema>['commentsUrl'];
	/** The Atom channel that the item came from */
	source?: z.infer<typeof atomSchema>['source'];
	/** A media object that belongs to the item */
	enclosure?: z.infer<typeof atomSchema>['enclosure'];
};

type ValidatedAtomFeedItem = z.infer<typeof atomSchema>;
type ValidatedAtomOptions = z.infer<typeof atomOptionsValidator>;
type GlobResult = z.infer<typeof globResultValidator>;

const globResultValidator = z.record(z.function().returns(z.promise(z.any())));

const atomOptionsValidator = z.object({
	title: z.string(),
	description: z.string(),
	site: z.preprocess((url) => (url instanceof URL ? url.href : url), z.string().url()),
	items: z
			.array(atomSchema)
			.or(globResultValidator)
			.transform((items) => {
				if (!Array.isArray(items)) {
					console.warn(
						yellow(
							'[Atom] Passing a glob result directly has been deprecated. Please migrate to the `pagesGlobToAtomItems()` helper: https://docs.astro.build/en/guides/rss/',
						),
					);
					return pagesGlobToAtomItems(items);
				}
				return items;
			}),
	xmlns: z.record(z.string()).optional(),
	stylesheet: z.union([z.string(), z.boolean()]).optional(),
	customData: z.string().optional(),
	trailingSlash: z.boolean().default(true),
});

export default async function getAtomResponse(atomOptions: AtomOptions): Promise<Response> {
	const atomString = await getAtomString(atomOptions);
	return new Response(atomString, {
		headers: {
			'Content-Type': 'application/xml',
		},
	});
}

export async function getAtomString(atomOptions: AtomOptions): Promise<string> {
	const validatedAtomOptions = await validateAtomOptions(atomOptions);
	return await generateAtom(validatedAtomOptions);
}

async function validateAtomOptions(atomOptions: AtomOptions) {
	const parsedResult = await atomOptionsValidator.safeParseAsync(atomOptions, { errorMap });
	if (parsedResult.success) {
		return parsedResult.data;
	}
	const formattedError = new Error(
		[
			`[Atom] Invalid or missing options:`,
			...parsedResult.error.errors.map((zodError) => {
				const path = zodError.path.join('.');
				const message = `${zodError.message} (${path})`;
				const code = zodError.code;

				if (path === 'items' && code === 'invalid_union') {
					return [
						message,
						`The \`items\` property requires at least the \`title\` or \`description\` key. They must be properly typed, as well as \`pubDate\` and \`link\` keys if provided.`,
						`Check your collection's schema, and visit https://docs.astro.build/en/guides/rss/#generating-items for more info.`,
					].join('\n');
				}

				return message;
			}),
		].join('\n'),
	);
	throw formattedError;
}

export function pagesGlobToAtomItems(items: GlobResult): Promise<ValidatedAtomFeedItem[]> {
	return Promise.all(
		Object.entries(items).map(async ([filePath, getInfo]) => {
			const { url, frontmatter } = await getInfo();
			if (url === undefined || url === null) {
				throw new Error(
					`[Atom] You can only glob entries within 'src/pages/' when passing import.meta.glob() directly. Consider mapping the result to an array of AtomFeedItems. See the Atom docs for usage examples: https://docs.astro.build/en/guides/rss/#2-list-of-rss-feed-objects`,
				);
			}
			const parsedResult = atomSchema
				.refine((val) => val.title || val.description, {
					message: 'At least title or description must be provided.',
					path: ['title', 'description'],
				})
				.safeParse({ ...frontmatter, link: url }, { errorMap });

			if (parsedResult.success) {
				return parsedResult.data;
			}
			const formattedError = new Error(
				[
					`[Atom] ${filePath} has invalid or missing frontmatter.\nFix the following properties:`,
					...parsedResult.error.errors.map((zodError) => zodError.message),
				].join('\n'),
			);
			(formattedError as any).file = filePath;
			throw formattedError;
		}),
	);
}

/** Generate Atom 1.0 feed */
async function generateAtom(atomOptions: ValidatedAtomOptions): Promise<string> {
	const { items, site } = atomOptions;

	const xmlOptions = {
		ignoreAttributes: false,
		suppressEmptyNode: true,
		suppressBooleanAttributes: false,
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

	// Additional namespaces
	if (atomOptions.xmlns) {
		for (const [k, v] of Object.entries(atomOptions.xmlns)) {
			root.feed[`@_xmlns:${k}`] = v;
		}
	}

	// Feed metadata
	root.feed.title = atomOptions.title;
	root.feed.subtitle = atomOptions.description;
	root.feed.id = createCanonicalURL(site, atomOptions.trailingSlash, undefined);
	root.feed.link = { '@_href': createCanonicalURL(site, atomOptions.trailingSlash, undefined) };

	// Updated: latest pubDate or now
	const latestDate = items
		.map((item) => item.updated && new Date(item.updated))
		.filter((d) => d instanceof Date && !isNaN(d.getTime()))
		.sort((a, b) => (b && a ? b.getTime() - a.getTime() : 0))[0];
	root.feed.updated = (latestDate || new Date()).toISOString();

	// Custom data (inserted as raw XML)
	if (typeof atomOptions.customData === 'string') {
		Object.assign(
			root.feed,
			parser.parse(`<feed>${atomOptions.customData}</feed>`).feed,
		);
	}

	// Entries
	root.feed.entry = items.map((result) => {
		const entry: Record<string, unknown> = {};
		if (result.title) entry.title = result.title;
		if (result.link) {
			const entryLink = isValidURL(result.link)
				? result.link
				: createCanonicalURL(result.link, atomOptions.trailingSlash, site);
			entry.link = { '@_href': entryLink };
			entry.id = entryLink;
		} else {
			// Fallback: use feed id + index
			entry.id = root.feed.id + '#entry-' + Math.random().toString(36).slice(2);
		}
		if (result.updated) entry.updated = new Date(result.updated).toISOString();
		if (result.description) entry.summary = result.description;
		if (result.content) entry.content = { '@_type': 'html', '#text': result.content };
		if (result.author) entry.author = { name: result.author };
		if (Array.isArray(result.categories)) {
			entry.category = result.categories.map((cat) => ({ '@_term': cat }));
		}
		if (typeof result.customData === 'string') {
			Object.assign(entry, parser.parse(`<entry>${result.customData}</entry>`).entry);
		}
		return entry;
	});

	return new XMLBuilder(xmlOptions).build(root);
}
