import { Parser, DomHandler, ElementType } from 'htmlparser2';
import { selectAll } from 'css-select';
import type { Node, Element } from 'domhandler';
import type { MaybePromise } from '@sveltejs/kit/types/private';

type ElementReducer<V> = (n: Element) => V;

interface Options<T> {
	query: string;
	data: { [K in keyof T]: ElementReducer<T[K]> };
}

export function attr(name: string): ElementReducer<string> {
	return (node) => node.attribs[name];
}

export function textContent(): ElementReducer<string> {
	const t = (e: Element): string =>
		e.children.reduce(
			(s, n) => (n.type === 'text' ? n.data : n.type === ElementType.Tag ? s + t(n) : s),
			''
		);
	return t;
}

export async function extractFromResponse<T>(
	response: MaybePromise<Response>,
	options: Options<T>
): Promise<T[]> {
	return extractFromHtml(await (await response).text(), options);
}

export function extractFromHtml<T>(html: string, options: Options<T>): T[] {
	const handler = new DomHandler();
	const parser = new Parser(handler);
	parser.write(html); // TODO use stream
	parser.end();
	const document = handler.root;

	return extractFromElement(document, options);
}

export function extractFromElement<T>(root: Node | Node[], options: Options<T>): T[] {
	const { query, data } = options;
	const elements: Node[] = selectAll(query, root);

	return elements.map((node) =>
		Object.fromEntries(Object.entries(data).map(([key, fn]: any[]) => [key, fn(node)]))
	);
}
