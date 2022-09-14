import { attr, extractFromResponse } from '$lib/extractFromHtml';
import type { Text } from 'domhandler';

export default async function search(keyword: string) {
	const entryURLs = await getRelevantEntries(keyword);
	const variants = await Promise.all(entryURLs.map(fetchEntryVariants));
	return await Promise.all(variants.map(getVariantDetails));
}

async function getRelevantEntries(keyword: string): Promise<
	{
		headword: string;
		url: URL;
	}[]
> {
	const encodedKeyword = encodeURIComponent(keyword);
	const searchURL = `https://www.spreadthesign.com/cs.cz/search/?q=${encodedKeyword}`;

	return await extractFromResponse(fetch(searchURL), {
		query: '.search-result-title a',
		data: {
			headword: (n) => (<Text>n.children[0]).data?.trim(),
			url: (n) => new URL(n.attribs.href, searchURL)
		}
	});
}

async function fetchEntryVariants({ headword, url }: { headword: string; url: URL }): Promise<{
	url: URL;
	headword: string;
	responses: Response[];
}> {
	const baseURL = url.pathname.match(/^\/cs.cz\/word\/\d+\//)?.[0];
	const variantURL = (i: number) => new URL(`${baseURL}x/${i}/`, url);
	const responses: Response[] = [];

	for (let i = 0; i < 3; i++) {
		const r = await fetch(variantURL(i));
		if (!r.ok) break;
		responses.push(r);
	}

	return { url, headword, responses };
}

async function getVariantDetails({
	url,
	headword,
	responses
}: {
	url: URL;
	headword: string;
	responses: Response[];
}): Promise<{ headword: string; videos: URL[] }> {
	const videos = (
		await Promise.all(
			responses.map((r) =>
				extractFromResponse(r, {
					query: '.search-result-content video',
					data: { src: attr('src') }
				})
			)
		)
	)
		.flat()
		.map(({ src }) => new URL(src, url));

	return { headword, videos };
}
