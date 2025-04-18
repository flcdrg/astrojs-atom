import { z } from 'astro/zod';

export const atomSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	updated: z.string(),
	customData: z.string().optional(),
	categories: z.array(z.string()).optional(),
	author: z.string().optional(),
	commentsUrl: z.string().optional(),
	source: z.object({ url: z.string().url(), title: z.string() }).optional(),
	enclosure: z
		.object({
			url: z.string(),
			length: z.number().nonnegative().int().finite(),
			type: z.string(),
		})
		.optional(),
	link: z.string().optional(),
	content: z.string().optional(),
});
