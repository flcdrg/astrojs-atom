type ErrorMapIssue = {
	code: string;
	path?: PropertyKey[];
	message?: string;
	input?: unknown;
	expected?: unknown;
};

/** Normalize URL to its canonical form */
export function createCanonicalURL(
	url: string,
	trailingSlash?: boolean,
	base?: string,
): string {
	let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
	if (!getUrlExtension(url)) {
		// add trailing slash if there’s no extension or `trailingSlash` is true
		pathname = pathname.replace(/\/*$/, '/');
	}

	pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)

	const canonicalUrl = new URL(pathname, base).href;
	if (trailingSlash === false) {
		// remove the trailing slash
		return canonicalUrl.replace(/\/*$/, '');
	}
	return canonicalUrl;
}

/** Check if a URL is already valid */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {}
	return false;
}

function getUrlExtension(url: string) {
	const lastDot = url.lastIndexOf('.');
	const lastSlash = url.lastIndexOf('/');
	return lastDot > lastSlash ? url.slice(lastDot + 1) : '';
}

const flattenErrorPath = (errorPath: PropertyKey[]) => errorPath.map(String).join('.');

export function errorMap(issue: ErrorMapIssue) {
	if (issue.code === 'invalid_type') {
		const badKeyPath = JSON.stringify(flattenErrorPath(issue.path ?? []));
		const received = typeof issue.input;
		const expected = typeof issue.expected === 'string' ? issue.expected : String(issue.expected);

		if (received === 'undefined') {
			return { message: `${badKeyPath} is required.` };
		}

		return { message: `${badKeyPath} should be ${expected}, not ${received}.` };
	}

	if (issue.message) {
		return { message: issue.message };
	}
}
